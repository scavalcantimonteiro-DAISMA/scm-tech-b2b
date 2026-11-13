// Dados e metadados geográficos e setoriais do Brasil para prospecção SKY B2B

export const BRAZIL_STATES = [
  { uf: 'SP', name: 'São Paulo', ddd: '11', cities: ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'São José dos Campos', 'Sorocaba', 'Campos do Jordão', 'Guarujá', 'Ubatuba'] },
  { uf: 'RJ', name: 'Rio de Janeiro', ddd: '21', cities: ['Rio de Janeiro', 'Niterói', 'Búzios', 'Petrópolis', 'Cabo Frio', 'Angra dos Reis', 'Paraty', 'Macaé', 'Nova Friburgo'] },
  { uf: 'MG', name: 'Minas Gerais', ddd: '31', cities: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Tiradentes', 'Ouro Preto', 'Poços de Caldas', 'Montes Claros', 'Betim'] },
  { uf: 'PR', name: 'Paraná', ddd: '41', cities: ['Curitiba', 'Londrina', 'Maringá', 'Foz do Iguaçu', 'Cascavel', 'Ponta Grossa', 'Guaratuba'] },
  { uf: 'SC', name: 'Santa Catarina', ddd: '48', cities: ['Florianópolis', 'Balneário Camboriú', 'Blumenau', 'Joinville', 'Itajaí', 'Bombinhas', 'Gramado'] },
  { uf: 'RS', name: 'Rio Grande do Sul', ddd: '51', cities: ['Porto Alegre', 'Caxias do Sul', 'Gramado', 'Canela', 'Pelotas', 'Santa Maria', 'Passo Fundo'] },
  { uf: 'BA', name: 'Bahia', ddd: '71', cities: ['Salvador', 'Porto Seguro', 'Feira de Santana', 'Praia do Forte', 'Ilhéus', 'Vitória da Conquista', 'Itacaré'] },
  { uf: 'GO', name: 'Goiás', ddd: '62', cities: ['Goiânia', 'Caldas Novas', 'Anápolis', 'Rio Verde', 'Pirenópolis', 'Aparecida de Goiânia'] },
  { uf: 'DF', name: 'Distrito Federal', ddd: '61', cities: ['Brasília', 'Taguatinga', 'Águas Claras', 'Ceilândia'] },
  { uf: 'PE', name: 'Pernambuco', ddd: '81', cities: ['Recife', 'Porto de Galinhas', 'Olinda', 'Caruaru', 'Petrolina', 'Fernando de Noronha'] },
  { uf: 'CE', name: 'Ceará', ddd: '85', cities: ['Fortaleza', 'Jericoacoara', 'Canoa Quebrada', 'Sobral', 'Juazeiro do Norte', 'Aquiraz'] },
  { uf: 'ES', name: 'Espírito Santo', ddd: '27', cities: ['Vitória', 'Vila Velha', 'Guarapari', 'Linhares', 'Colatina'] },
  { uf: 'MT', name: 'Mato Grosso', ddd: '65', cities: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Sorriso'] },
  { uf: 'MS', name: 'Mato Grosso do Sul', ddd: '67', cities: ['Campo Grande', 'Dourados', 'Bonito', 'Três Lagoas', 'Corumbá'] },
  { uf: 'PA', name: 'Pará', ddd: '91', cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas'] },
  { uf: 'AM', name: 'Amazonas', ddd: '92', cities: ['Manaus', 'Parintins', 'Itacoatiara'] },
  { uf: 'RN', name: 'Rio Grande do Norte', ddd: '84', cities: ['Natal', 'Pipa', 'Mossoró', 'Parnamirim', 'São Miguel do Gostoso'] },
  { uf: 'PB', name: 'Paraíba', ddd: '83', cities: ['João Pessoa', 'Campina Grande', 'Cabedelo', 'Patos'] },
  { uf: 'AL', name: 'Alagoas', ddd: '82', cities: ['Maceió', 'Maragogi', 'Arapiraca', 'São Miguel dos Milagres'] },
  { uf: 'SE', name: 'Sergipe', ddd: '79', cities: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'] },
  { uf: 'PI', name: 'Piauí', ddd: '86', cities: ['Teresina', 'Parnaíba', 'Picos'] },
  { uf: 'MA', name: 'Maranhão', ddd: '98', cities: ['São Luís', 'Imperatriz', 'Barreirinhas'] },
  { uf: 'TO', name: 'Tocantins', ddd: '63', cities: ['Palmas', 'Araguaína', 'Gurupi'] },
  { uf: 'RO', name: 'Rondônia', ddd: '69', cities: ['Porto Velho', 'Ji-Paraná', 'Ariquemes'] },
  { uf: 'AC', name: 'Acre', ddd: '68', cities: ['Rio Branco', 'Cruzeiro do Sul'] },
  { uf: 'AP', name: 'Amapá', ddd: '96', cities: ['Macapá', 'Santana'] },
  { uf: 'RR', name: 'Roraima', ddd: '95', cities: ['Boa Vista'] }
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
