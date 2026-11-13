import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';
import { BRAZIL_STATES, RAMOS_CONFIG } from './data/brazilData.js';

const require = createRequire(import.meta.url);
const initialDatabase = require('./data/database.json');

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'database.json')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'database.json');

// Memória em cache para performance ultrarrápida
let dbCache = null;

// Garante que o banco de dados exista e esteja inicializado
export async function initDb() {
  if (dbCache) return dbCache;

  try {
    const rawData = await fs.readFile(DB_PATH, 'utf-8');
    dbCache = JSON.parse(rawData);
  } catch {
    // Se não encontrou o arquivo físico (ex: primeira execução no Vercel serverless), usa o initialDatabase embutido
    dbCache = JSON.parse(JSON.stringify(initialDatabase));
    try {
      await saveDb();
    } catch (saveErr) {
      console.warn('Aviso: não foi possível gravar em DB_PATH, mantendo em memória:', saveErr.message);
    }
  }

  // Garante que o Adm padrão com a senha solicitada exista sempre
  const admExists = dbCache.users.find(u => u.username.toLowerCase() === 'adm');
  if (!admExists) {
    const hashedPass = await bcrypt.hash('S@ulo160605', 10);
    dbCache.users.push({
      id: 'usr_admin_default',
      name: 'Saulo (Administrador SKY)',
      username: 'Adm',
      passwordHash: hashedPass,
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    });
    try {
      await saveDb();
    } catch {}
  }

  return dbCache;
}

export async function saveDb() {
  if (!dbCache) return;
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(dbCache, null, 2), 'utf-8');
  await fs.rename(tempPath, DB_PATH);
}

export function getDb() {
  return dbCache;
}

// Gera leads realistas para qualquer combinação de Ramo + UF + Cidade em escala massiva
export function generateLeadsForSearch({ ramo, uf, city, count = 50, userId = null, userName = null }) {
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

  for (let i = 0; i < safeCount; i++) {
    const basePrefix = prefixes[i % prefixes.length];
    const cycle = Math.floor(i / prefixes.length);
    const suffix = cycle > 0 ? ` (Unidade ${cycle + 1})` : '';
    const tradeName = `${basePrefix} ${targetCity}${suffix}`;
    const companyName = `${tradeName.toUpperCase()} LTDA - EPP`;
    
    // CNPJ variado
    const randPart1 = String(10 + ((i * 7) % 89));
    const randPart2 = String(100 + ((i * 13) % 899));
    const randPart3 = String(100 + ((i * 19) % 899));
    const randPart4 = String(10 + ((i * 3) % 89));
    const cnpj = `${randPart1}.${randPart2}.${randPart3}/0001-${randPart4}`;

    const num1 = String(Math.floor(100 + ((i * 37) % 899)));
    const num2 = String(Math.floor(1000 + ((i * 73) % 8999)));
    const landline = `(${ddd}) 3${num1}-${num2}`;
    
    const mob1 = String(Math.floor(8000 + ((i * 41) % 1999)));
    const mob2 = String(Math.floor(1000 + ((i * 83) % 8999)));
    const mobile = `(${ddd}) 9${mob1}-${mob2}`;

    const neighborhood = bairrosComuns[(i + Math.floor(i / 3)) % bairrosComuns.length];
    const streetName = ruasComuns[i % ruasComuns.length];
    const streetNumber = String(40 + (i * 18));
    const cep = `${ddd}0${String(10 + (i % 89))}-000`;

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
