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
  { 
    uf: 'MG', 
    name: 'Minas Gerais', 
    ddd: '31', 
    cepPrefix: '30', 
    cities: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Tiradentes', 'Ouro Preto', 'Poços de Caldas', 'Montes Claros', 'Betim', 'Contagem'],
    bairros: ['Savassi', 'Lourdes', 'Funcionários', 'Santo Agostinho', 'Belvedere', 'Mangabeiras', 'Sion', 'Anchieta', 'Gutierrez', 'Buritis', 'Serra', 'Prado'],
    ruas: ['Av. Afonso Pena', 'Av. do Contorno', 'Av. Getúlio Vargas', 'Rua da Bahia', 'Av. Cristóvão Colombo', 'Av. Nossa Senhora do Carmo', 'Av. Raja Gabaglia', 'Rua Mato Grosso', 'Rua Guajajaras']
  },
  { 
    uf: 'PR', 
    name: 'Paraná', 
    ddd: '41', 
    cepPrefix: '80', 
    cities: ['Curitiba', 'Londrina', 'Maringá', 'Foz do Iguaçu', 'Cascavel', 'Ponta Grossa', 'Guaratuba', 'São José dos Pinhais'],
    bairros: ['Batel', 'Bigorrilho', 'Água Verde', 'Cabral', 'Juvevê', 'Centro Cívico', 'Ecoville', 'Prado Velho', 'Mercês', 'Ahú', 'Cristo Rei'],
    ruas: ['Av. Batel', 'Av. Sete de Setembro', 'Rua Visconde de Nácar', 'Rua Marechal Deodoro', 'Av. Cândido de Abreu', 'Rua Comendador Araújo', 'Av. Silva Jardim', 'Av. República Argentina']
  },
  { 
    uf: 'SC', 
    name: 'Santa Catarina', 
    ddd: '48', 
    cepPrefix: '88', 
    cities: ['Florianópolis', 'Balneário Camboriú', 'Blumenau', 'Joinville', 'Itajaí', 'Bombinhas', 'Gramado', 'Criciúma', 'Chapecó'],
    bairros: ['Beira Mar Norte', 'Agronômica', 'Centro', 'Jurerê Internacional', 'Canasvieiras', 'Lagoa da Conceição', 'Campeche', 'Córrego Grande', 'Coqueiros'],
    ruas: ['Av. Beira Mar Norte', 'Rua Bocaiúva', 'Av. Mauro Ramos', 'Rodovia SC-401', 'Av. dos Búzios', 'Av. Atlântica', 'Av. Brasil', 'Rua Almirante Lamego']
  },
  { 
    uf: 'RS', 
    name: 'Rio Grande do Sul', 
    ddd: '51', 
    cepPrefix: '90', 
    cities: ['Porto Alegre', 'Caxias do Sul', 'Gramado', 'Canela', 'Pelotas', 'Santa Maria', 'Passo Fundo', 'Novo Hamburgo', 'Canoas'],
    bairros: ['Moinhos de Vento', 'Bela Vista', 'Petrópolis', 'Menino Deus', 'Mont\'Serrat', 'Três Figueiras', 'Rio Branco', 'Independência', 'Cidade Baixa'],
    ruas: ['Av. Carlos Gomes', 'Av. Nilo Peçanha', 'Av. Goethe', 'Rua Ramiro Barcelos', 'Av. Ipiranga', 'Av. Padre Cacique', 'Rua 24 de Outubro', 'Av. Cristóvão Colombo']
  },
  { 
    uf: 'GO', 
    name: 'Goiás', 
    ddd: '62', 
    cepPrefix: '74', 
    cities: ['Goiânia', 'Caldas Novas', 'Anápolis', 'Rio Verde', 'Pirenópolis', 'Aparecida de Goiânia', 'Itumbiara'],
    bairros: ['Setor Bueno', 'Setor Marista', 'Setor Oeste', 'Jardim Goiás', 'Setor Sul', 'Alto da Glória', 'Setor Central'],
    ruas: ['Av. 85', 'Av. T-9', 'Av. T-63', 'Av. 136', 'Av. Jamel Cecílio', 'Av. Deputado Jamel Cecílio', 'Av. República do Líbano', 'Av. Goiás']
  },
  { 
    uf: 'DF', 
    name: 'Distrito Federal', 
    ddd: '61', 
    cepPrefix: '70', 
    cities: ['Brasília', 'Taguatinga', 'Águas Claras', 'Ceilândia', 'Guará', 'Sudoeste/Octogonal'],
    bairros: ['Asa Sul', 'Asa Norte', 'Setor Hoteleiro Sul', 'Setor Hoteleiro Norte', 'Sudoeste', 'Noroeste', 'Lago Sul', 'Águas Claras', 'Taguatinga Centro'],
    ruas: ['Setor Hoteleiro Sul Quadra 5', 'Setor Hoteleiro Norte Quadra 2', 'W3 Sul', 'W3 Norte', 'Eixo Monumental', 'L2 Sul', 'L2 Norte', 'Av. das Araucárias', 'Av. Comercial Sul']
  },
  { 
    uf: 'PE', 
    name: 'Pernambuco', 
    ddd: '81', 
    cepPrefix: '50', 
    cities: ['Recife', 'Porto de Galinhas', 'Olinda', 'Caruaru', 'Petrolina', 'Fernando de Noronha', 'Jaboatão dos Guararapes', 'Cabo de Santo Agostinho'],
    bairros: ['Boa Viagem', 'Pina', 'Derby', 'Ilha do Leite', 'Graças', 'Espinheiro', 'Casa Forte', 'Madalena', 'Parnamirim', 'Boa Vista', 'Aflitos', 'Jaqueira', 'Santo Amaro', 'Setúbal', 'Torre', 'Imbiribeira', 'Caxangá', 'Poço da Panela'],
    ruas: ['Av. Boa Viagem', 'Av. Governador Agamenon Magalhães', 'Av. Engenheiro Domingos Ferreira', 'Av. Conselheiro Aguiar', 'Av. Rosa e Silva', 'Rua da Hora', 'Av. Rui Barbosa', 'Av. 17 de Agosto', 'Rua Paissandu', 'Rua Frei Matias Teves', 'Av. Caxangá', 'Rua Padre Carapuceiro', 'Av. Visconde de Jequitinhonha', 'Rua Amélia', 'Estrada do Arraial']
  },
  { 
    uf: 'CE', 
    name: 'Ceará', 
    ddd: '85', 
    cepPrefix: '60', 
    cities: ['Fortaleza', 'Jericoacoara', 'Canoa Quebrada', 'Sobral', 'Juazeiro do Norte', 'Aquiraz', 'Caucaia'],
    bairros: ['Meireles', 'Aldeota', 'Praia de Iracema', 'Varjota', 'Cocó', 'Mucuripe', 'Papicu', 'Dionísio Torres', 'Fátima', 'Centro'],
    ruas: ['Av. Beira Mar', 'Av. Santos Dumont', 'Av. Dom Luís', 'Av. Desembargador Moreira', 'Av. Barão de Studart', 'Av. Washington Soares', 'Av. Abolição', 'Av. Monsenhor Tabosa']
  },
  { 
    uf: 'ES', 
    name: 'Espírito Santo', 
    ddd: '27', 
    cepPrefix: '29', 
    cities: ['Vitória', 'Vila Velha', 'Guarapari', 'Linhares', 'Colatina', 'Cachoeiro de Itapemirim'],
    bairros: ['Praia do Canto', 'Jardim da Penha', 'Enseada do Suá', 'Santa Lúcia', 'Praia da Costa', 'Itapoã', 'Glória', 'Centro', 'Mata da Praia', 'Bento Ferreira'],
    ruas: ['Av. Dante Michelini', 'Av. Rio Branco', 'Av. Américo Buaiz', 'Av. Nossa Senhora da Penha', 'Rua Aleixo Netto', 'Av. Champagnat', 'Av. Hugo Musso', 'Av. Jerônimo Monteiro']
  },
  { 
    uf: 'MT', 
    name: 'Mato Grosso', 
    ddd: '65', 
    cepPrefix: '78', 
    cities: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Sorriso', 'Tangará da Serra'],
    bairros: ['Goiabeiras', 'Bosque da Saúde', 'Santa Rosa', 'Jardim das Américas', 'Duque de Caxias', 'Centro Norte', 'Alvorada', 'Quilombo'],
    ruas: ['Av. Historiador Rubens de Mendonça', 'Av. Miguel Sutil', 'Av. Getúlio Vargas', 'Av. Isaac Póvoas', 'Av. Fernando Corrêa da Costa', 'Av. Mato Grosso', 'Rua Cândido Mariano']
  },
  { 
    uf: 'MS', 
    name: 'Mato Grosso do Sul', 
    ddd: '67', 
    cepPrefix: '79', 
    cities: ['Campo Grande', 'Dourados', 'Bonito', 'Três Lagoas', 'Corumbá', 'Ponta Porã'],
    bairros: ['Chácara Cachoeira', 'Santa Fé', 'Jardim dos Estados', 'Autonomista', 'Bela Vista', 'Centro', 'Carandá Bosque', 'Monte Castelo'],
    ruas: ['Av. Afonso Pena', 'Av. Mato Grosso', 'Av. Ceará', 'Rua 14 de Julho', 'Av. Coronel Antonino', 'Rua Euclides da Cunha', 'Av. Eduardo Elias Zahran']
  },
  { 
    uf: 'PA', 
    name: 'Pará', 
    ddd: '91', 
    cepPrefix: '66', 
    cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal'],
    bairros: ['Nazaré', 'Umarizal', 'Batista Campos', 'Reduto', 'Marco', 'Campina', 'São Brás', 'Cidade Velha'],
    ruas: ['Av. Nazaré', 'Av. Governador José Malcher', 'Av. Visconde de Souza Franco', 'Av. Gentil Bittencourt', 'Av. Almirante Barroso', 'Travessa 14 de Março', 'Av. Conselheiro Furtado']
  },
  { 
    uf: 'AM', 
    name: 'Amazonas', 
    ddd: '92', 
    cepPrefix: '69', 
    cities: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Tefé'],
    bairros: ['Adrianópolis', 'Ponta Negra', 'Vieiralves', 'Nossa Senhora das Graças', 'Parque Dez de Novembro', 'Centro', 'Flores', 'Chapada'],
    ruas: ['Av. Coronel Teixeira', 'Av. Djalma Batista', 'Av. Constantino Nery', 'Av. André Araújo', 'Av. Mário Ypiranga', 'Rua Maceió', 'Av. Darcy Vargas', 'Av. Ephigênio Salles']
  },
  { 
    uf: 'RN', 
    name: 'Rio Grande do Norte', 
    ddd: '84', 
    cepPrefix: '59', 
    cities: ['Natal', 'Pipa', 'Mossoró', 'Parnamirim', 'São Miguel do Gostoso', 'Tibau do Sul', 'Caicó'],
    bairros: ['Ponta Negra', 'Tirol', 'Petrópolis', 'Candelária', 'Capim Macio', 'Lagoa Nova', 'Areia Preta', 'Praia do Meio'],
    ruas: ['Av. Engenheiro Roberto Freire', 'Av. Hermes da Fonseca', 'Av. Prudente de Morais', 'Av. Afonso Pena', 'Av. Senador Salgado Filho', 'Av. Governador Silvio Pedroza', 'Rua Mossoró']
  },
  { 
    uf: 'PB', 
    name: 'Paraíba', 
    ddd: '83', 
    cepPrefix: '58', 
    cities: ['João Pessoa', 'Campina Grande', 'Cabedelo', 'Patos', 'Sousa', 'Conde'],
    bairros: ['Tambaú', 'Manaíra', 'Cabo Branco', 'Bessa', 'Altiplano Cabo Branco', 'Miramar', 'Estados', 'Centro', 'Torre'],
    ruas: ['Av. Epitácio Pessoa', 'Av. Almirante Tamandaré', 'Av. Cabo Branco', 'Av. Edson Ramalho', 'Av. Flávio Ribeiro Coutinho', 'Av. João Maurício', 'Av. Senador Ruy Carneiro']
  },
  { 
    uf: 'AL', 
    name: 'Alagoas', 
    ddd: '82', 
    cepPrefix: '57', 
    cities: ['Maceió', 'Maragogi', 'Arapiraca', 'São Miguel dos Milagres', 'Japaratinga', 'Marechal Deodoro'],
    bairros: ['Ponta Verde', 'Pajuçara', 'Jatiúca', 'Mangabeiras', 'Cruz das Almas', 'Farol', 'Stella Maris', 'Centro'],
    ruas: ['Av. Silvio Carlos Viana', 'Av. Doutor Antônio Gouveia', 'Av. Álvaro Otávio Vieira', 'Av. Fernandes Lima', 'Av. Comendador Gustavo Paiva', 'Rua Deputado José Lages', 'Av. Dona Constança']
  },
  { 
    uf: 'SE', 
    name: 'Sergipe', 
    ddd: '79', 
    cepPrefix: '49', 
    cities: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'Estância'],
    bairros: ['13 de Julho', 'Jardins', 'Atalaia', 'Grageru', 'Salgado Filho', 'Garcia', 'Centro', 'Farolândia', 'Coroa do Meio'],
    ruas: ['Av. Beira Mar', 'Av. Santos Dumont', 'Av. Ministro Geraldo Barreto Sobral', 'Av. Jorge Amado', 'Av. Hermes Fontes', 'Rua Rotary', 'Av. Francisco Porto']
  },
  { 
    uf: 'PI', 
    name: 'Piauí', 
    ddd: '86', 
    cepPrefix: '64', 
    cities: ['Teresina', 'Parnaíba', 'Picos', 'Floriano', 'Piripiri'],
    bairros: ['Jóquei', 'Fátima', 'Ilhotas', 'Ininga', 'São Cristóvão', 'Noivos', 'Centro'],
    ruas: ['Av. Dom Severino', 'Av. Frei Serafim', 'Av. Raul Lopes', 'Av. Nossa Senhora de Fátima', 'Av. Homero Castelo Branco', 'Av. Ininga', 'Rua Coelho de Resende']
  },
  { 
    uf: 'MA', 
    name: 'Maranhão', 
    ddd: '98', 
    cepPrefix: '65', 
    cities: ['São Luís', 'Imperatriz', 'Barreirinhas', 'Caxias', 'Timon', 'São José de Ribamar'],
    bairros: ['Ponta d\'Areia', 'Renascença', 'Calhau', 'São Marcos', 'Olho d\'Água', 'Centro Histórico', 'Cohama', 'Jardim Renascença'],
    ruas: ['Av. dos Holandeses', 'Av. Colares Moreira', 'Av. Professor Carlos Cunha', 'Av. Litorânea', 'Av. Daniel de La Touche', 'Rua das Hortas', 'Av. Marechal Castelo Branco']
  },
  { 
    uf: 'TO', 
    name: 'Tocantins', 
    ddd: '63', 
    cepPrefix: '77', 
    cities: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins'],
    bairros: ['Plano Diretor Sul', 'Plano Diretor Norte', 'Graciosa', 'Jardim Aureny', 'Setor Central'],
    ruas: ['Av. Teotônio Segurado', 'Av. JK', 'Av. LO-01', 'Av. LO-05', 'Av. NS-02', 'Av. Palmas Brasil', 'Av. Tocantins']
  },
  { 
    uf: 'RO', 
    name: 'Rondônia', 
    ddd: '69', 
    cepPrefix: '76', 
    cities: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal'],
    bairros: ['Olaria', 'São Cristóvão', 'Embratel', 'Liberdade', 'Nossa Senhora das Graças', 'Centro'],
    ruas: ['Av. 7 de Setembro', 'Av. Calama', 'Av. Carlos Gomes', 'Av. Nações Unidas', 'Av. Rio Madeira', 'Av. Jorge Teixeira', 'Av. Lauro Sodré']
  },
  { 
    uf: 'AC', 
    name: 'Acre', 
    ddd: '68', 
    cepPrefix: '69', 
    cities: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
    bairros: ['Bosque', 'Cerâmica', 'Abrahão Alab', 'Estação Experimental', 'Conjunto Esperança', 'Centro'],
    ruas: ['Av. Ceará', 'Av. Getúlio Vargas', 'Av. Brasil', 'Av. Nações Unidas', 'Rua Marechal Deodoro', 'Av. Epaminondas Jácome']
  },
  { 
    uf: 'AP', 
    name: 'Amapá', 
    ddd: '96', 
    cepPrefix: '68', 
    cities: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
    bairros: ['Santa Inês', 'Trem', 'Central', 'Jesus de Nazaré', 'Beirol', 'Alvorada'],
    ruas: ['Av. FAB', 'Rua Cândido Mendes', 'Av. Feliciano Coelho', 'Av. Padre Júlio Maria Lombaerd', 'Rua Leopoldo Machado', 'Av. Coaracy Nunes']
  },
  { 
    uf: 'RR', 
    name: 'Roraima', 
    ddd: '95', 
    cepPrefix: '69', 
    cities: ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima'],
    bairros: ['São Francisco', 'Paraviana', 'Caçari', 'Aparecida', 'Mecejana', 'Centro'],
    ruas: ['Av. Ville Roy', 'Av. Capitão Ene Garcêz', 'Av. Glaycon de Paiva', 'Av. Major Williams', 'Av. Brigadeiro Eduardo Gomes', 'Av. Benjamin Constant']
  }
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
