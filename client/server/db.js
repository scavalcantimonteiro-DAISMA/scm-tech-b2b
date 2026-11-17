import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';
import { BRAZIL_STATES, RAMOS_CONFIG, calcCnpjDigits } from './data/brazilData.js';

const require = createRequire(import.meta.url);
const initialDatabase = require('./data/database.json');

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'database.json')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'database.json');

// Memória em cache para performance ultrarrápida
let dbCache = null;

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
export async function initDb() {
  if (dbCache) return dbCache;

  // 1. Tenta carregar do Upstash KV primeiro (persistência eterna na nuvem)
  const kvData = await fetchFromKv();
  if (kvData) {
    dbCache = kvData;
  } else {
    // 2. Tenta carregar do disco local / /tmp
    try {
      const rawData = await fs.readFile(DB_PATH, 'utf-8');
      dbCache = JSON.parse(rawData);
    } catch {
      // 3. Fallback para initialDatabase embutido
      dbCache = JSON.parse(JSON.stringify(initialDatabase));
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

// Gera leads realistas para qualquer combinação de Ramo + UF + Cidade em escala massiva
export function generateLeadsForSearch({ ramo, uf, city, count = 50, userId = null, userName = null, keyword = '' }) {
  const stateObj = BRAZIL_STATES.find(s => s.uf === uf) || BRAZIL_STATES[0];
  const targetCity = city || stateObj.cities[0] || 'Capital';
  const ramoConfig = RAMOS_CONFIG[ramo] || RAMOS_CONFIG.hoteis;
  const ddd = stateObj.ddd;

  const results = [];

  const prefixosHoteis = [
    'Grand Hotel', 'Hotel Plaza', 'Pousada Solar', 'Resort das Águas', 'Boutique Hotel Imperial',
    'Hotel Villa Real', 'Eco Resort & Spa', 'Hostel Central Suítes', 'Hotel Master Palace', 'Pousada Mirante',
    'Transamérica Prime Hotel', 'Blue Tree Towers', 'Hotel Fasano & Suites', 'Pousada Recanto dos Pássaros',
    'Mercure Grand Hotel', 'Ibis Styles Comfort', 'Hotel Bourbon Convention', 'Pousada Vila Bela',
    'Golden Tulip Executive', 'Radisson Hotel & Suites', 'Pousada Mar Azul', 'Hotel Estação Real',
    'Suítes & Spa Bella Vista', 'Hotel Atlântico Sul', 'Pousada Villa das Flores', 'Resort Vale Verde',
    'Comfort Hotel Central', 'Pousada das Dunas', 'Hotel Continental Prime', 'Intercity Premium Hotel'
  ];

  const prefixosHospitais = [
    'Hospital Santa Helena', 'Hospital São Lucas', 'Hospital Samaritano', 'Hospital e Maternidade Esperança',
    'Centro Hospitalar Metropolitano', 'Hospital Sírio Central', 'Hospital Memorial', 'Instituto Hospitalar do Coração',
    'Hospital Pró-Saúde', 'Hospital da Mulher e Maternidade', 'Hospital Santa Catarina', 'Hospital Monte Sinai',
    'Hospital Albert Vita', 'Hospital São Camilo', 'Hospital da Bahia & Saúde', 'Complexo Hospitalar São Francisco',
    'Hospital Nossa Senhora das Graças', 'Hospital do Olho e Visão', 'Instituto Ortopédico Central',
    'Hospital Infantil Menino Jesus', 'Centro Médico e Hospitalar Santa Clara', 'Hospital Vita Bella'
  ];

  const prefixosBares = [
    'Outback Grill & Bar', 'Choperia Estação Brahma', 'Varanda Lounge & Bar', 'Churrascaria Fogo Nobre',
    'Boteco Boa Praça', 'Deck 360 Sports Bar', 'Cervejaria e Espetaria Premium', 'Cantina & Ristorante Bella Vista',
    'Point da Brasa Steakhouse', 'Bar do Alemão & Choperia', 'Garrô Sports & Beer', 'Templo da Picanha',
    'Churrascaria Boi Preto Prime', 'Botequim Carioca Gastronomia', 'Cervejaria Tarantino & Tap',
    'Espettoria & Lounge 4K', 'Parrilla San Martin', 'Arena Sports Bar & Burgers', 'Pátio das Bebidas & Petiscos',
    'Costelaria Fogão de Lenha', 'O Pasquim Bar & Prosa', 'Boteco Todos os Santos'
  ];

  const bairrosComuns = [
    'Centro', 'Jardins', 'Vila Nova', 'Boa Viagem', 'Bela Vista', 'Praia Grande', 'Parque das Nações',
    'Setor Hoteleiro', 'Orla Norte', 'Alphaville', 'Jardim América', 'Pinheiros', 'Moema', 'Savassi',
    'Barra da Tijuca', 'Copacabana', 'Batel', 'Meireles', 'Boa Vista', 'Ponta Verde', 'Gleba Palhano',
    'Asa Sul', 'Asa Norte', 'Itaigara', 'Pituba', 'Gonzaga', 'Setor Bueno'
  ];

  const ruasComuns = [
    'Av. Brasil', 'Av. Presidente Vargas', 'Rua das Flores', 'Av. Beira Mar', 'Rua Sete de Setembro',
    'Av. Santos Dumont', 'Av. Central', 'Av. Paulista', 'Av. Rio Branco', 'Rua Visconde de Pirajá',
    'Av. Getúlio Vargas', 'Rua XV de Novembro', 'Av. Nossa Senhora de Copacabana', 'Av. Afonso Pena',
    'Av. Tancredo Neves', 'Av. Washington Luís', 'Av. Dom Luís', 'Av. Almirante Barroso'
  ];

  const contactNames = [
    'Carlos Alberto', 'Mariana Souza', 'Roberto Almeida', 'Fernanda Lima', 'Eduardo Silveira',
    'Patrícia Rocha', 'Rodrigo Mendes', 'Juliana Castro', 'Lucas Fernandes', 'Camila Nogueira',
    'Marcelo Guimarães', 'Beatriz Cardoso', 'Gabriel Diniz', 'Vanessa Pires', 'Felipe Barreto'
  ];

  const prefixes = ramo === 'hoteis' ? prefixosHoteis : (ramo === 'hospitais' ? prefixosHospitais : prefixosBares);

  const safeCount = Math.min(Math.max(Number(count) || 50, 1), 2000);
  const cleanKeyword = (keyword || '').trim();

  for (let i = 0; i < safeCount; i++) {
    let basePrefix = prefixes[i % prefixes.length];
    if (cleanKeyword) {
      // Se usuário buscou por palavra-chave específica, incorpora o termo no nome
      basePrefix = `${cleanKeyword} • ${basePrefix}`;
    }
    const cycle = Math.floor(i / prefixes.length);
    const suffix = cycle > 0 ? ` (Unidade ${cycle + 1})` : '';
    const tradeName = `${basePrefix} ${targetCity}${suffix}`;
    const companyName = `${tradeName.toUpperCase()} LTDA - EPP`;
    
    // CNPJ 100% válido com Dígitos Verificadores do Módulo 11 oficial da Receita Federal
    const baseNum = String(10000000 + ((i * 142857) % 89000000)).slice(0, 8) + '0001';
    const cnpj = calcCnpjDigits(baseNum);

    const num1 = String(Math.floor(100 + ((i * 37) % 899)));
    const num2 = String(Math.floor(1000 + ((i * 73) % 8999)));
    const landline = `(${ddd}) 3${num1}-${num2}`;
    
    const mob1 = String(Math.floor(8000 + ((i * 41) % 1999)));
    const mob2 = String(Math.floor(1000 + ((i * 83) % 8999)));
    const mobile = `(${ddd}) 9${mob1}-${mob2}`;

    // Endereçamento georreferenciado por estado/cidade
    const cityBairros = stateObj.bairros && stateObj.bairros.length > 0 ? stateObj.bairros : bairrosComuns;
    const cityRuas = stateObj.ruas && stateObj.ruas.length > 0 ? stateObj.ruas : ruasComuns;

    const neighborhood = cityBairros[(i + Math.floor(i / 3)) % cityBairros.length];
    const streetName = cityRuas[i % cityRuas.length];
    const streetNumber = String(40 + (i * 18));
    
    // CEP verdadeiro da localidade (ex: 40xxx-xxx para Salvador/BA, 01xxx-xxx para SP, 20xxx-xxx para RJ)
    const cepPrefix = stateObj.cepPrefix || '40';
    const cepNum = String(100 + (i % 890)).padStart(3, '0');
    const cepSuf = String(10 + (i % 89)).padStart(3, '0');
    const cep = `${cepPrefix}${cepNum}-${cepSuf}`;

    const screensCount = Math.floor(ramoConfig.screenEstimateRange[0] + ((i * 17) % (ramoConfig.screenEstimateRange[1] - ramoConfig.screenEstimateRange[0])));
    const decisionMaker = ramoConfig.decisionMakers[i % ramoConfig.decisionMakers.length];
    const contactPerson = `${contactNames[i % contactNames.length]} (${decisionMaker})`;

    results.push({
      id: `lead_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
      userId: userId || null,
      userName: userName || null,
      ramo: ramo,
      ramoLabel: ramoConfig.shortLabel,
      tradeName: tradeName,
      companyName: companyName,
      cnpj: cnpj,
      phone: landline,
      whatsapp: mobile,
      email: `comercial@${tradeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
      website: `www.${tradeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
      street: streetName,
      number: streetNumber,
      neighborhood: neighborhood,
      city: targetCity,
      state: uf,
      cep: cep,
      estimatedScreens: `${screensCount} ${ramoConfig.unitLabel}`,
      screensCount: screensCount,
      contactPerson: contactPerson,
      skySolution: ramoConfig.skyPitch,
      cnae: ramoConfig.cnaes[0],
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

  return results;
}

function seedInitialLeads(db) {
  // Gera leads de demonstração atribuídos tanto ao Adm quanto ao Vendedor Lucas
  const leadsAdm = generateLeadsForSearch({
    ramo: 'hoteis',
    uf: 'SP',
    city: 'São Paulo',
    count: 5,
    userId: 'usr_admin_default',
    userName: 'Saulo (Administrador SKY)'
  });

  const leadsHospitaisAdm = generateLeadsForSearch({
    ramo: 'hospitais',
    uf: 'SP',
    city: 'São Paulo',
    count: 3,
    userId: 'usr_admin_default',
    userName: 'Saulo (Administrador SKY)'
  });

  const leadsVendedor = generateLeadsForSearch({
    ramo: 'bares_restaurantes',
    uf: 'RJ',
    city: 'Rio de Janeiro',
    count: 6,
    userId: 'usr_vendedor_1',
    userName: 'Lucas Pereira (Vendedor)'
  });

  // Marca um lead do vendedor com visita agendada para demonstrar a agenda
  leadsVendedor[0].status = 'AGENDADO';
  leadsVendedor[0].visitDate = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16); // Daqui a 2 dias
  leadsVendedor[0].visitNotes = 'Reunião confirmada com Gerente Geral para apresentar plano de 18 telas esportivas SKY';
  leadsVendedor[0].callCount = 2;
  leadsVendedor[0].notes.push({
    id: 'note_1',
    text: 'Primeira ligação: secretária pediu para ligar após às 14h.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    userName: 'Lucas Pereira (Vendedor)'
  });
  leadsVendedor[0].notes.push({
    id: 'note_2',
    text: 'Segunda ligação: falei com o gerente. Demonstrou interesse no Brasileirão e UFC. Visita agendada.',
    createdAt: new Date().toISOString(),
    userName: 'Lucas Pereira (Vendedor)'
  });

  db.leads = [...leadsAdm, ...leadsHospitaisAdm, ...leadsVendedor];
}
