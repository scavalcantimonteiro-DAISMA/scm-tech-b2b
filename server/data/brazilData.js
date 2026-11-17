// Dados e metadados geográficos e setoriais do Brasil para prospecção SKY B2B

// Função oficial para cálculo dos dígitos verificadores de CNPJ (Módulo 11 da Receita Federal)
export function calcCnpjDigits(base12) {
  const digits = String(base12).replace(/\D/g, '').slice(0, 12).split('').map(Number);
  while (digits.length < 12) digits.push(0);

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) sum1 += digits[i] * w1[i];
  const r1 = sum1 % 11;
  const d1 = r1 < 2 ? 0 : 11 - r1;

  digits.push(d1);
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) sum2 += digits[i] * w2[i];
  const r2 = sum2 % 11;
  const d2 = r2 < 2 ? 0 : 11 - r2;

  digits.push(d2);
  const s = digits.join('');
  return s.slice(0, 2) + '.' + s.slice(2, 5) + '.' + s.slice(5, 8) + '/' + s.slice(8, 12) + '-' + s.slice(12, 14);
}

export function validateCnpj(cnpj) {
  const c = String(cnpj).replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const base12 = c.slice(0, 12);
  const expected = calcCnpjDigits(base12);
  const formatted = c.slice(0, 2) + '.' + c.slice(2, 5) + '.' + c.slice(5, 8) + '/' + c.slice(8, 12) + '-' + c.slice(12, 14);
  return expected === formatted;
}

export const BRAZIL_STATES = [
  { 
    uf: 'BA', 
    name: 'Bahia', 
    ddd: '71', 
    cepPrefix: '40',
    cities: ['Salvador', 'Porto Seguro', 'Feira de Santana', 'Praia do Forte', 'Ilhéus', 'Vitória da Conquista', 'Itacaré'],
    bairros: ['Barra', 'Ondina', 'Rio Vermelho', 'Pelourinho', 'Pituba', 'Caminho das Árvores', 'Itaigara', 'Stella Maris', 'Itapuã', 'Campo Grande', 'Graça', 'Armação', 'Stiep', 'Santo Antônio Além do Carmo'],
    ruas: ['Av. Sete de Setembro', 'Av. Oceânica', 'Av. Tancredo Neves', 'Av. Antônio Carlos Magalhães', 'Rua Chile', 'Rua Fonte do Boi', 'Av. Manoel Dias da Silva', 'Rua Forte de São Diogo', 'Largo do Pelourinho', 'Alameda da Praia', 'Av. Otávio Mangabeira']
  },
  { 
    uf: 'SP', 
    name: 'São Paulo', 
    ddd: '11', 
    cepPrefix: '01',
    cities: ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'São José dos Campos', 'Sorocaba', 'Campos do Jordão', 'Guarujá', 'Ubatuba'],
    bairros: ['Jardins', 'Moema', 'Pinheiros', 'Bela Vista', 'Itaim Bibi', 'Vila Olímpia', 'Consolação', 'Higienópolis', 'Brooklin', 'Perdizes', 'Vila Mariana'],
    ruas: ['Av. Paulista', 'Av. Brigadeiro Faria Lima', 'Alameda Santos', 'Rua Oscar Freire', 'Av. Rebouças', 'Rua da Consolação', 'Av. Engenheiro Luís Carlos Berrini', 'Av. Ibirapuera']
  },
  { 
    uf: 'RJ', 
    name: 'Rio de Janeiro', 
    ddd: '21', 
    cepPrefix: '20',
    cities: ['Rio de Janeiro', 'Niterói', 'Búzios', 'Petrópolis', 'Cabo Frio', 'Angra dos Reis', 'Paraty', 'Macaé', 'Nova Friburgo'],
    bairros: ['Copacabana', 'Ipanema', 'Barra da Tijuca', 'Leblon', 'Botafogo', 'Flamengo', 'Centro', 'Leme', 'São Conrado', 'Tijuca'],
    ruas: ['Av. Atlântica', 'Av. Vieira Souto', 'Av. das Américas', 'Rua Visconde de Pirajá', 'Av. Rio Branco', 'Rua Barata Ribeiro', 'Av. Delfim Moreira', 'Av. Princesa Isabel']
  },
  { uf: 'MG', name: 'Minas Gerais', ddd: '31', cepPrefix: '30', cities: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Tiradentes', 'Ouro Preto', 'Poços de Caldas', 'Montes Claros', 'Betim'] },
  { uf: 'PR', name: 'Paraná', ddd: '41', cepPrefix: '80', cities: ['Curitiba', 'Londrina', 'Maringá', 'Foz do Iguaçu', 'Cascavel', 'Ponta Grossa', 'Guaratuba'] },
  { uf: 'SC', name: 'Santa Catarina', ddd: '48', cepPrefix: '88', cities: ['Florianópolis', 'Balneário Camboriú', 'Blumenau', 'Joinville', 'Itajaí', 'Bombinhas', 'Gramado'] },
  { uf: 'RS', name: 'Rio Grande do Sul', ddd: '51', cepPrefix: '90', cities: ['Porto Alegre', 'Caxias do Sul', 'Gramado', 'Canela', 'Pelotas', 'Santa Maria', 'Passo Fundo'] },
  { uf: 'GO', name: 'Goiás', ddd: '62', cepPrefix: '74', cities: ['Goiânia', 'Caldas Novas', 'Anápolis', 'Rio Verde', 'Pirenópolis', 'Aparecida de Goiânia'] },
  { uf: 'DF', name: 'Distrito Federal', ddd: '61', cepPrefix: '70', cities: ['Brasília', 'Taguatinga', 'Águas Claras', 'Ceilândia'] },
  { uf: 'PE', name: 'Pernambuco', ddd: '81', cepPrefix: '50', cities: ['Recife', 'Porto de Galinhas', 'Olinda', 'Caruaru', 'Petrolina', 'Fernando de Noronha'] },
  { uf: 'CE', name: 'Ceará', ddd: '85', cepPrefix: '60', cities: ['Fortaleza', 'Jericoacoara', 'Canoa Quebrada', 'Sobral', 'Juazeiro do Norte', 'Aquiraz'] },
  { uf: 'ES', name: 'Espírito Santo', ddd: '27', cepPrefix: '29', cities: ['Vitória', 'Vila Velha', 'Guarapari', 'Linhares', 'Colatina'] },
  { uf: 'MT', name: 'Mato Grosso', ddd: '65', cepPrefix: '78', cities: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Sorriso'] },
  { uf: 'MS', name: 'Mato Grosso do Sul', ddd: '67', cepPrefix: '79', cities: ['Campo Grande', 'Dourados', 'Bonito', 'Três Lagoas', 'Corumbá'] },
  { uf: 'PA', name: 'Pará', ddd: '91', cepPrefix: '66', cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas'] },
  { uf: 'AM', name: 'Amazonas', ddd: '92', cepPrefix: '69', cities: ['Manaus', 'Parintins', 'Itacoatiara'] },
  { uf: 'RN', name: 'Rio Grande do Norte', ddd: '84', cepPrefix: '59', cities: ['Natal', 'Pipa', 'Mossoró', 'Parnamirim', 'São Miguel do Gostoso'] },
  { uf: 'PB', name: 'Paraíba', ddd: '83', cepPrefix: '58', cities: ['João Pessoa', 'Campina Grande', 'Cabedelo', 'Patos'] },
  { uf: 'AL', name: 'Alagoas', ddd: '82', cepPrefix: '57', cities: ['Maceió', 'Maragogi', 'Arapiraca', 'São Miguel dos Milagres'] },
  { uf: 'SE', name: 'Sergipe', ddd: '79', cepPrefix: '49', cities: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'] },
  { uf: 'PI', name: 'Piauí', ddd: '86', cepPrefix: '64', cities: ['Teresina', 'Parnaíba', 'Picos'] },
  { uf: 'MA', name: 'Maranhão', ddd: '98', cepPrefix: '65', cities: ['São Luís', 'Imperatriz', 'Barreirinhas'] },
  { uf: 'TO', name: 'Tocantins', ddd: '63', cepPrefix: '77', cities: ['Palmas', 'Araguaína', 'Gurupi'] },
  { uf: 'RO', name: 'Rondônia', ddd: '69', cepPrefix: '76', cities: ['Porto Velho', 'Ji-Paraná', 'Ariquemes'] },
  { uf: 'AC', name: 'Acre', ddd: '68', cepPrefix: '69', cities: ['Rio Branco', 'Cruzeiro do Sul'] },
  { uf: 'AP', name: 'Amapá', ddd: '96', cepPrefix: '68', cities: ['Macapá', 'Santana'] },
  { uf: 'RR', name: 'Roraima', ddd: '95', cepPrefix: '69', cities: ['Boa Vista'] }
];

export const RAMOS_CONFIG = {
  hoteis: {
    id: 'hoteis',
    label: 'Hotéis, Pousadas, Resorts e Hostels',
    shortLabel: 'Hotelaria & Pousadas',
    icon: 'Hotel',
    cnaes: ['5510-8/01 - Hotéis', '5510-8/02 - Apart-hotéis', '5510-8/03 - Pousadas/Hostels'],
    skyPitch: 'Soluções integradas de TV por assinatura em Alta Definição (HD) para quartos, pacotes de esportes/filmes para hóspedes e infraestrutura centralizada sem cabos aparentes.',
    screenEstimateRange: [20, 250],
    unitLabel: 'quartos/telas',
    decisionMakers: ['Gerente Geral', 'Diretor de Operações', 'Gerente de Governança / Compras', 'Proprietário']
  },
  hospitais: {
    id: 'hospitais',
    label: 'Hospitais, Maternidades e Clínicas de Grande Porte',
    shortLabel: 'Hospitais & Saúde',
    icon: 'Building2',
    cnaes: ['8610-1/01 - Atividades de atendimento hospitalar', '8610-1/02 - Centros de internação', '8630-5/01 - Clínicas com leitos'],
    skyPitch: 'Sistemas corporativos de entretenimento para leitos de internação, centros de infusão e recepções hospitalares, proporcionando conforto ao paciente e faturamento unificado.',
    screenEstimateRange: [40, 300],
    unitLabel: 'leitos/pontos',
    decisionMakers: ['Diretor Administrativo', 'Gerente de Hotelaria Hospitalar', 'Gerente de Facilities / Compras', 'Superintendente']
  },
  bares_restaurantes: {
    id: 'bares_restaurantes',
    label: 'Bares, Choperias, Churrascarias e Restaurantes de Grande Porte',
    shortLabel: 'Bares & Restaurantes (Grandes)',
    icon: 'UtensilsCrossed',
    cnaes: ['5611-2/01 - Restaurantes e similares', '5611-2/02 - Bares e outros estabelecimentos especializados em servir bebidas', '5611-2/03 - Choperias e cervejarias'],
    skyPitch: 'Pacotes corporativos esportivos com direitos de exibição pública (futebol nacional e internacional, UFC/Combate, basquete), canais musicais 4K e estabilidade para múltiplos telões.',
    screenEstimateRange: [8, 45],
    unitLabel: 'telas/telões',
    decisionMakers: ['Sócio Proprietário', 'Gerente Geral', 'Diretor de Operações', 'Gerente Comercial']
  }
};
