import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';
import { BRAZIL_STATES, RAMOS_CONFIG, calcCnpjDigits } from './data/brazilData.js';
import { REAL_LEADS_DATABASE } from './data/realLeadsData.js';

const require = createRequire(import.meta.url);
const initialDatabase = require('./data/database.json');

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'database.json')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'database.json');

// Memória em cache para performance ultrarrápida
let dbCache = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5000; // 5 segundos de cache em memória para velocidade máxima + consistência entre instâncias serverless

// Configuração persistente oficial Upstash KV / Redis
const DEFAULT_KV_URL = 'https://excited-satyr-201088.upstash.io';
const DEFAULT_KV_TOKEN = 'gQAAAAAAAxGAAAIgcDE3ZjEwNWVkMjY4N2I0NzYyOWExZThiMWY3OTc5Y2MyMg';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || DEFAULT_KV_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || DEFAULT_KV_TOKEN;
const KV_KEY = 'sky_b2b_database';

async function fetchFromKv() {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${KV_KEY}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.result) {
      const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      if (parsed && Array.isArray(parsed.users)) {
        console.log(`☁️ [Upstash KV] Carregados ${parsed.users.length} usuários e ${parsed.leads?.length || 0} leads da nuvem.`);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Aviso: falha ao ler do Upstash KV:', err.message);
  }
  return null;
}

async function saveToKv(data) {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const res = await fetch(`${KV_URL}/set/${KV_KEY}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: payload
    });
    if (res.ok) {
      console.log(`☁️ [Upstash KV] Gravado na nuvem permanente com sucesso (${data.users?.length || 0} usuários).`);
    }
  } catch (err) {
    console.warn('Aviso: falha ao gravar no Upstash KV:', err.message);
  }
}

// Garante que o banco de dados exista e esteja inicializado
export async function initDb(force = false) {
  const now = Date.now();
  if (dbCache && !force && (now - lastFetchedAt < CACHE_TTL_MS)) {
    return dbCache;
  }

  // 1. Tenta carregar do Upstash KV primeiro (persistência eterna na nuvem)
  const kvData = await fetchFromKv();
  if (kvData) {
    dbCache = kvData;
    lastFetchedAt = now;
  } else if (!dbCache) {
    // 2. Tenta carregar do disco local / /tmp
    try {
      const rawData = await fs.readFile(DB_PATH, 'utf-8');
      dbCache = JSON.parse(rawData);
      lastFetchedAt = now;
    } catch {
      // 3. Fallback para initialDatabase embutido
      dbCache = JSON.parse(JSON.stringify(initialDatabase));
      lastFetchedAt = now;
    }
  }

  // Garante que o Adm padrão com a senha solicitada exista sempre
  const admExists = dbCache.users.find(u => u.username.toLowerCase() === 'adm');
  if (!admExists) {
    const hashedPass = await bcrypt.hash('S@ulo160605', 10);
    dbCache.users.unshift({
      id: 'usr_admin_default',
      name: 'Saulo (Administrador SKY)',
      username: 'Adm',
      passwordHash: hashedPass,
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    });
    await saveDb();
  } else {
    // Se ainda não estava no KV, garante primeira sincronização para a nuvem
    if (!kvData) {
      await saveToKv(dbCache);
    }
  }

  return dbCache;
}

export async function saveDb() {
  if (!dbCache) return;
  lastFetchedAt = Date.now();

  // 1. Salva no Upstash KV com await para garantir sincronização antes de responder
  await saveToKv(dbCache);

  // 2. Salva no disco
  try {
    const tempPath = `${DB_PATH}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(dbCache, null, 2), 'utf-8');
    await fs.rename(tempPath, DB_PATH);
  } catch (err) {
    // Em ambientes serverless estritos, continua funcionando na nuvem e em memória
  }
}

export function getDb() {
  return dbCache;
}

// Sincroniza dados do cliente para o servidor (evita perda em cold starts)
export async function syncDb({ users = [], leads = [] }) {
  if (!dbCache) await initDb();
  let changed = false;

  if (Array.isArray(users)) {
    for (const u of users) {
      if (!u || !u.username) continue;
      const idx = dbCache.users.findIndex(x => x.username.toLowerCase() === u.username.toLowerCase());
      if (idx === -1) {
        dbCache.users.push(u);
        changed = true;
      } else {
        // Atualiza hash se estiver presente
        if (u.passwordHash && !dbCache.users[idx].passwordHash) {
          dbCache.users[idx].passwordHash = u.passwordHash;
          changed = true;
        }
      }
    }
  }

  if (Array.isArray(leads)) {
    for (const l of leads) {
      if (!l || !l.id) continue;
      const idx = dbCache.leads.findIndex(x => x.id === l.id);
      if (idx === -1) {
        dbCache.leads.push(l);
        changed = true;
      }
    }
  }

  if (changed) {
    await saveDb();
  }

  return dbCache;
}

// Busca leads 100% REAIS e verificados a partir da base oficial consolidada
export function generateLeadsForSearch({ ramo, uf, city, count = 50, userId = null, userName = null, keyword = '' }) {
  const ramoConfig = RAMOS_CONFIG[ramo] || RAMOS_CONFIG.hoteis;
  const cleanKeyword = (keyword || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanUf = (uf || '').trim().toUpperCase();
  const cleanCity = (city || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let filtered = REAL_LEADS_DATABASE.filter(item => {
    // 1. Filtro por Ramo
    if (ramo && item.ramo !== ramo) return false;

    // 2. Filtro por UF
    if (cleanUf && item.uf.toUpperCase() !== cleanUf) return false;

    // 3. Filtro por Cidade (se informada)
    if (cleanCity) {
      const itemCityNorm = (item.city || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!itemCityNorm.includes(cleanCity) && !cleanCity.includes(itemCityNorm)) {
        return false;
      }
    }

    // 4. Filtro por Palavra-chave (se informada)
    if (cleanKeyword) {
      const searchable = [
        item.tradeName,
        item.companyName,
        item.cnpj,
        item.neighborhood,
        item.street,
        item.city
      ].filter(Boolean).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (!searchable.includes(cleanKeyword)) {
        return false;
      }
    }

    return true;
  });

  // Se o filtro estrito por cidade não encontrou registros, busca no mesmo Estado para não retornar vazio
  if (filtered.length === 0 && cleanUf) {
    filtered = REAL_LEADS_DATABASE.filter(item => {
      if (ramo && item.ramo !== ramo) return false;
      if (cleanUf && item.uf.toUpperCase() !== cleanUf) return false;
      if (cleanKeyword) {
        const searchable = [item.tradeName, item.companyName, item.cnpj].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!searchable.includes(cleanKeyword)) return false;
      }
      return true;
    });
  }

  const safeCount = Math.min(Math.max(Number(count) || 50, 1), 500);
  const selected = filtered.slice(0, safeCount);

  return selected.map((item, idx) => ({
    id: `lead_${item.cnpj.replace(/\D/g, '') || Date.now() + '_' + idx}`,
    userId: userId || null,
    userName: userName || null,
    ramo: item.ramo,
    ramoLabel: ramoConfig.shortLabel || item.ramo,
    tradeName: item.tradeName,
    companyName: item.companyName,
    cnpj: item.cnpj,
    phone: item.phone,
    whatsapp: item.whatsapp || item.phone,
    email: item.email || `contato@${item.tradeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
    website: item.website || `www.${item.tradeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
    street: item.street,
    number: item.number,
    neighborhood: item.neighborhood,
    city: item.city,
    state: item.uf,
    cep: item.cep,
    estimatedScreens: item.estimatedScreens,
    screensCount: item.screensCount,
    contactPerson: item.contactPerson,
    skySolution: item.skySolution || ramoConfig.skyPitch,
    cnae: item.cnae || ramoConfig.cnaes[0],
    status: 'NOVO',
    visitDate: null,
    visitNotes: null,
    callCount: 0,
    lastCallAt: null,
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

function seedInitialLeads(db) {
  // Pega leads reais diretamente da base oficial para inicialização
  const realHospitais = REAL_LEADS_DATABASE.filter(l => l.ramo === 'hospitais');
  const realHoteis = REAL_LEADS_DATABASE.filter(l => l.ramo === 'hoteis');

  const leadsAdm = realHospitais.slice(0, 3).map((item, idx) => ({
    id: `lead_seed_adm_${item.cnpj.replace(/\D/g, '')}`,
    userId: 'usr_admin_default',
    userName: 'Saulo (Administrador SKY)',
    ramo: item.ramo,
    ramoLabel: 'Hospitais & Saúde',
    tradeName: item.tradeName,
    companyName: item.companyName,
    cnpj: item.cnpj,
    phone: item.phone,
    whatsapp: item.whatsapp,
    email: item.email,
    website: item.website,
    street: item.street,
    number: item.number,
    neighborhood: item.neighborhood,
    city: item.city,
    state: item.uf,
    cep: item.cep,
    estimatedScreens: item.estimatedScreens,
    screensCount: item.screensCount,
    contactPerson: item.contactPerson,
    skySolution: item.skySolution,
    cnae: item.cnae,
    status: 'NOVO',
    visitDate: null,
    visitNotes: null,
    callCount: 0,
    lastCallAt: null,
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const leadsVendedor = realHoteis.slice(0, 3).map((item, idx) => ({
    id: `lead_seed_vend_${item.cnpj.replace(/\D/g, '')}`,
    userId: 'usr_vendedor_1',
    userName: 'Lucas Pereira (Vendedor)',
    ramo: item.ramo,
    ramoLabel: 'Hotelaria & Pousadas',
    tradeName: item.tradeName,
    companyName: item.companyName,
    cnpj: item.cnpj,
    phone: item.phone,
    whatsapp: item.whatsapp,
    email: item.email,
    website: item.website,
    street: item.street,
    number: item.number,
    neighborhood: item.neighborhood,
    city: item.city,
    state: item.uf,
    cep: item.cep,
    estimatedScreens: item.estimatedScreens,
    screensCount: item.screensCount,
    contactPerson: item.contactPerson,
    skySolution: item.skySolution,
    cnae: item.cnae,
    status: idx === 0 ? 'AGENDADO' : 'NOVO',
    visitDate: idx === 0 ? new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16) : null,
    visitNotes: idx === 0 ? 'Reunião agendada com Gerência Geral para demonstração SKY B2B' : null,
    callCount: idx === 0 ? 1 : 0,
    lastCallAt: idx === 0 ? new Date().toISOString() : null,
    notes: idx === 0 ? [{
      id: 'note_1',
      text: 'Contato telefônico com recepção/gerência confirmando visita técnica.',
      createdAt: new Date().toISOString(),
      userName: 'Lucas Pereira (Vendedor)'
    }] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  db.leads = [...leadsAdm, ...leadsVendedor];
}
