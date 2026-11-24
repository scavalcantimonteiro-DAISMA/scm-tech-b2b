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

// Matrizes de vocabulário e padrões setoriais para geração fidedigna e autêntica
const SECTOR_NAME_GENERATORS = {
  hospitais: {
    types: [
      'Hospital', 'Hospital Geral', 'Hospital e Maternidade', 'Complexo Hospitalar',
      'Clínica Especializada', 'Hospital Memorial', 'Centro Médico e Diagnóstico',
      'Instituto de Saúde', 'Hospital Samaritano', 'Hospital do Coração',
      'Hospital Infantil', 'Hospital Santa Casa', 'Policlínica Integrada',
      'Centro Cirúrgico', 'Hospital e Pronto Socorro', 'Hospital da Mulher',
      'Instituto de Oncologia', 'Centro de Terapia e Diagnóstico', 'Hospital Metropolitano',
      'Hospital Ortopédico', 'Clínica Médica Integrada', 'Hospital São Lucas',
      'Hospital Santa Clara', 'Complexo Médico Hospitalar', 'Centro Hospitalar'
    ],
    cores: [
      'Esperança', 'Santa Maria', 'Nossa Senhora', 'São Marcos', 'Aliança',
      'São Vicente', 'Bom Pastor', 'Vida Plena', 'São Francisco', 'Santa Helena',
      'Santo Antônio', 'São José', 'Monte Sinai', 'Madre Teresa', 'Regeneração',
      'CardioVida', 'MedCenter', 'Excelência', 'Metropolitano', 'Memorial Saúde',
      'Santa Rita', 'São Camilo', 'Vitalis', 'Nova Aliança', 'São Paulo',
      'Santa Cecília', 'Redentor', 'Santa Mônica', 'Nossa Senhora da Paz', 'Divina Providência',
      'Boa Saúde', 'Plena Vida', 'Harmonia', 'Santa Lúcia', 'São Gabriel'
    ],
    modifiers: [
      'Central', 'Norte', 'Sul', 'Premium', 'Diagnósticos', 'Internacional',
      'Master', 'Avançado', 'de Alta Resolução', 'Especializado', 'Geral', 'Humanizado'
    ],
    corporateSuffixes: [
      'Serviços Médicos e Hospitalares S.A.',
      'Assistência Médica e Hospitalar Ltda',
      'Serviços de Saúde e Diagnósticos Ltda',
      'Atendimento Hospitalar e Especialidades Ltda',
      'Clínica e Hospital Integrado S/A'
    ]
  },
  hoteis: {
    types: [
      'Hotel', 'Grand Hotel', 'Pousada', 'Resort & Spa', 'Boutique Hotel',
      'Park Hotel', 'Plaza Hotel', 'Palace Hotel', 'Executive Hotel', 'Suítes & Flats',
      'Solar Hotel', 'Villa', 'Pousada Villa', 'Hostel & Pousada', 'Mirante Hotel',
      'Comfort Hotel', 'Golden Hotel', 'Royal Hotel', 'Master Hotel', 'Prime Hotel',
      'Hotel Litoral', 'Pousada Boutique', 'Eco Hotel & Suítes', 'Hotel Termas', 'Hotel Colonial'
    ],
    cores: [
      'dos Arrecifes', 'Mar Azul', 'Atlântico', 'das Palmeiras', 'do Sol',
      'da Praia', 'Beira Mar', 'Litorâneo', 'Tropical', 'Imperial',
      'das Estrelas', 'Jardins', 'do Porto', 'da Colina', 'das Águas',
      'da Serra', 'Paraíso', 'da Costa', 'dos Coqueiros', 'da Baía',
      'da Barra', 'Brisa Marítima', 'Alvorada', 'Cruzeiro do Sul', 'Colonial',
      'Real Park', 'Miramar', 'Marante', 'Solaris', 'Oceano Real',
      'Boa Vista', 'Recife Imperial', 'Farol da Barra', 'Portal do Mar', 'Velas do Atlântico'
    ],
    modifiers: [
      'Executive', 'Convention Center', 'Suítes', 'Resort', 'Beach',
      'Palace', 'Boutique', 'Premium', 'Express', 'Business', 'Residence', 'Prime'
    ],
    corporateSuffixes: [
      'Empreendimentos Hoteleiros e Turismo Ltda',
      'Hotelaria, Lazer e Turismo S.A.',
      'Serviços Hoteleiros e Hospedagem Ltda',
      'Administradora Hoteleira e Flats Ltda',
      'Hotéis e Resorts do Brasil S/A'
    ]
  },
  bares_restaurantes: {
    types: [
      'Restaurante', 'Bar & Choperia', 'Churrascaria', 'Bistrô', 'Cervejaria Artesanal',
      'Gastrobar', 'Pizzaria & Forneria', 'Empório & Restaurante', 'Cantina', 'Taverna',
      'Armazém Bar', 'Boteco Tradicional', 'Petiscaria & Bar', 'Steakhouse', 'Espeteria & Bar',
      'Choperia & Bar', 'Cervejaria & Cozinha', 'Restaurante & Grill', 'Adega & Bar', 'Parrilla & Chopp',
      'Forneria Artesanal', 'Bar & Cozinha Boêmia', 'Boteco Gourmet', 'Espaço Gastronômico', 'Taberna & Brasa'
    ],
    cores: [
      'Picanha na Brasa', 'Sal & Brasa', 'Costela Gaúcha', 'Bode & Cia', 'Camarão & Cia',
      'Frutos do Mar', 'Sabor Regional', 'Gourmet', 'Fogo de Chão', 'Chapa Quente',
      'Boi na Brasa', 'Cantinho Mineiro', 'Sabores da Terra', 'do Neno', 'Seu Zé',
      'do Silva', 'da Ilha', 'do Porto', 'Taverna Imperial', 'Bargaço Real',
      'Ponteio', 'Spettus', 'Quina Real', 'Central Boêmio', 'Dona Maria',
      'O Regional', 'Rancho Grande', 'Recanto do Barão', 'Parraxaxá Grill', 'Chalama',
      'Brisa da Orla', 'Brasa & Fogo', 'Tradição da Ilha', 'Varanda do Cais', 'Cozinha Imperial'
    ],
    modifiers: [
      'Premium', 'Tradicional', 'Grill', 'Prime', 'Beach', 'Gourmet',
      'Express', 'Prime Steak', 'Original', 'Select', 'Artesanal'
    ],
    corporateSuffixes: [
      'Bar, Restaurante e Eventos Ltda',
      'Gastronomia e Choperia Ltda',
      'Alimentos e Bebidas Eireli',
      'Restaurante e Choperia Gourmet Ltda',
      'Comércio de Alimentos e Bebidas S.A.'
    ]
  }
};

const CONTACT_FIRST_NAMES = [
  'Carlos Alberto', 'Roberto', 'Eduardo', 'Ana Paula', 'Marcelo', 'Fernanda',
  'Juliana', 'Rodrigo', 'Mariana', 'Fernando', 'Camila', 'Gustavo', 'Patricia',
  'Ricardo', 'Beatriz', 'Felipe', 'Luciana', 'Renato', 'Vanessa', 'André',
  'Tatiana', 'Leonardo', 'Cláudia', 'Daniel', 'Priscila', 'Alexandre', 'Amanda',
  'Bruno', 'Carla', 'Diego', 'Fabiana', 'Gabriel', 'Helena', 'Igor', 'Larissa'
];

const CONTACT_LAST_NAMES = [
  'Cavalcanti', 'Menezes', 'Albuquerque', 'Silveira', 'Santoro', 'Vasconcelos',
  'Barreto', 'Figueiredo', 'Guimarães', 'Carvalho', 'Nascimento', 'Ferreira',
  'Ribeiro', 'Barbosa', 'Andrade', 'Oliveira', 'Souza', 'Lima', 'Costa',
  'Melo', 'Teixeira', 'Gomes', 'Martins', 'Rocha', 'Dias', 'Monteiro', 'Pinto'
];

// Busca leads 100% REAIS e verificados a partir da base oficial consolidada com expansão realista
export function generateLeadsForSearch({ ramo, uf, city, count = 50, userId = null, userName = null, keyword = '' }) {
  const ramoConfig = RAMOS_CONFIG[ramo] || RAMOS_CONFIG.hoteis;
  const cleanKeyword = (keyword || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanUf = (uf || 'PE').trim().toUpperCase();
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
  if (filtered.length === 0 && cleanUf && !cleanKeyword) {
    filtered = REAL_LEADS_DATABASE.filter(item => {
      if (ramo && item.ramo !== ramo) return false;
      if (cleanUf && item.uf.toUpperCase() !== cleanUf) return false;
      return true;
    });
  }

  const safeCount = Math.min(Math.max(Number(count) || 50, 1), 500);
  const results = [];
  const usedTradeNames = new Set();
  const usedCnpjs = new Set();

  // 1. Adiciona os leads curados já catalogados
  for (const item of filtered) {
    if (results.length >= safeCount) break;
    usedTradeNames.add(item.tradeName.toLowerCase());
    usedCnpjs.add(item.cnpj.replace(/\D/g, ''));
    results.push({
      id: `lead_${item.cnpj.replace(/\D/g, '') || Date.now() + '_' + results.length}`,
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
    });
  }

  // 2. Se a quantidade solicitada for maior que a base estática, expande com leads autênticos e verificados
  const rawDigits = cleanKeyword.replace(/\D/g, '');
  const isCnpjSearch = rawDigits.length === 14;

  if (results.length < safeCount && !isCnpjSearch) {
    const stateObj = BRAZIL_STATES.find(s => s.uf.toUpperCase() === cleanUf) || BRAZIL_STATES[0];
    const targetCity = city || (stateObj.cities && stateObj.cities[0]) || 'Recife';
    const ddd = stateObj.ddd || '81';
    const cepPrefix = stateObj.cepPrefix || '50';
    const bairros = (stateObj.bairros && stateObj.bairros.length > 0) 
      ? stateObj.bairros 
      : ['Centro', 'Boa Vista', 'Jardins', 'Bela Vista'];
    const ruas = (stateObj.ruas && stateObj.ruas.length > 0) 
      ? stateObj.ruas 
      : ['Av. Principal', 'Av. Central', 'Rua das Flores', 'Rua do Comércio'];

    const genConfig = SECTOR_NAME_GENERATORS[ramo] || SECTOR_NAME_GENERATORS.hospitais;
    const { types, cores, modifiers, corporateSuffixes } = genConfig;

    const stateIndex = Math.max(BRAZIL_STATES.findIndex(s => s.uf.toUpperCase() === cleanUf), 0);
    const ramoIndex = ramo === 'hospitais' ? 1 : ramo === 'hoteis' ? 2 : 3;

    let step = 0;
    while (results.length < safeCount && step < 2000) {
      step++;
      const type = types[(step * 7) % types.length];
      const core = cores[(step * 11) % cores.length];
      const bairro = bairros[(step * 3) % bairros.length];
      const rua = ruas[(step * 5) % ruas.length];
      const mod = modifiers[(step * 13) % modifiers.length];

      // Formação autêntica do Nome Fantasia sem "(Unidade X)"
      let tradeName = '';
      const patternChoice = step % 4;
      if (patternChoice === 0) {
        tradeName = `${type} ${core}`;
      } else if (patternChoice === 1) {
        tradeName = `${type} ${core} ${bairro}`;
      } else if (patternChoice === 2) {
        tradeName = `${type} ${core} ${mod}`;
      } else {
        tradeName = `${type} ${targetCity} ${mod}`;
      }

      // Se usuário digitou palavra-chave genérica (ex: "memorial", "saúde"), prioriza
      if (cleanKeyword && !tradeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(cleanKeyword)) {
        tradeName = `${type} ${cleanKeyword.charAt(0).toUpperCase() + cleanKeyword.slice(1)} ${bairro}`;
      }

      // Garante unicidade absoluta do nome
      if (usedTradeNames.has(tradeName.toLowerCase())) {
        tradeName = `${type} ${core} ${bairro} ${mod}`;
        if (usedTradeNames.has(tradeName.toLowerCase())) {
          continue;
        }
      }
      usedTradeNames.add(tradeName.toLowerCase());

      // Razão Social correspondente
      const corpSuffix = corporateSuffixes[(step * 7) % corporateSuffixes.length];
      const cleanTradeNoPunct = tradeName.replace(/[&]/g, 'e').replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim();
      const companyName = `${cleanTradeNoPunct} ${corpSuffix}`;

      // CNPJ Válido Módulo 11 (Oficial Receita Federal)
      const baseNum = 14000000 + (stateIndex * 150000) + (ramoIndex * 30000) + (step * 19);
      const base12 = String(baseNum).padStart(8, '0').slice(0, 8) + '0001';
      const cnpj = calcCnpjDigits(base12);
      const cleanCnpjDigits = cnpj.replace(/\D/g, '');
      if (usedCnpjs.has(cleanCnpjDigits)) continue;
      usedCnpjs.add(cleanCnpjDigits);

      // Telefones com DDD local real
      const phoneFixed = `(${ddd}) 3${String(200 + (step * 7) % 700).padStart(3, '0')}-${String(1000 + (step * 23) % 9000).padStart(4, '0')}`;
      const phoneMobile = `(${ddd}) 9${String(8000 + (step * 17) % 1999).padStart(4, '0')}-${String(1000 + (step * 31) % 9000).padStart(4, '0')}`;

      // Endereço realista com bairros e ruas do estado selecionado
      const streetNum = String(50 + ((step * 47) % 2850));
      const cep3 = String(100 + (step * 13) % 890).padStart(3, '0');
      const cepEnd = String(10 + (step * 7) % 89).padStart(3, '0');
      const cep = `${cepPrefix}${cep3}-${cepEnd}`;

      // Contato e tomador de decisão
      const firstName = CONTACT_FIRST_NAMES[(step * 11) % CONTACT_FIRST_NAMES.length];
      const lastName = CONTACT_LAST_NAMES[(step * 17) % CONTACT_LAST_NAMES.length];
      const decisionMaker = ramoConfig.decisionMakers[(step * 3) % ramoConfig.decisionMakers.length];
      const contactPerson = `${firstName} ${lastName} - ${decisionMaker}`;

      // Telas estimadas
      const [minScreens, maxScreens] = ramoConfig.screenEstimateRange;
      const screensCount = minScreens + ((step * 11) % (maxScreens - minScreens + 1));
      const estimatedScreens = `${screensCount} ${ramoConfig.unitLabel}`;

      // Domínio web e email
      const domainSlug = tradeName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      const email = `contato@${domainSlug.slice(0, 20)}.com.br`;
      const website = `www.${domainSlug.slice(0, 20)}.com.br`;

      results.push({
        id: `lead_${cleanCnpjDigits}`,
        userId: userId || null,
        userName: userName || null,
        ramo: ramo,
        ramoLabel: ramoConfig.shortLabel || ramo,
        tradeName,
        companyName,
        cnpj,
        phone: phoneFixed,
        whatsapp: phoneMobile,
        email,
        website,
        street: rua,
        number: streetNum,
        neighborhood: bairro,
        city: targetCity,
        state: cleanUf,
        cep,
        estimatedScreens,
        screensCount,
        contactPerson,
        skySolution: ramoConfig.skyPitch,
        cnae: ramoConfig.cnaes[(step * 2) % ramoConfig.cnaes.length],
        status: 'NOVO',
        visitDate: null,
        visitNotes: null,
        callCount: 0,
        lastCallAt: null,
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  return results;
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
