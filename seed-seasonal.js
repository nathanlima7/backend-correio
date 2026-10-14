import { prisma } from './prisma.js';

// ---------------------------------------------------------------
// Seed de selos sazonais — eventos com janela definida.
//
// Adicione novos eventos conforme o calendário avança. Os selos
// ficam no banco desde já, mas só aparecem no catálogo quando a
// data atual cair dentro da janela seasonalFrom..seasonalUntil.
//
// Formato das datas: UTC. Use sempre T00:00:00Z (início) e
// T23:59:59Z (fim) para cobrir o dia inteiro.
//
// IMPORTANTE: para ativar um evento futuro, é só descomentar o
// bloco correspondente abaixo e rodar `npm run seed:seasonal`.
// ---------------------------------------------------------------

const SEASONAL_STAMPS = [
  // ============ DIA INTERNACIONAL DA BEA 2026 ============
  // Janela: 16/10/2026 a 29/10/2026
  {
    id: 'bea-2026-bolo',
    name: 'Bolo Festivo',
    imagePath: 'seasonal/bea-2026-bolo.png',
    description: 'Um bolo com velinhas pra comemorar o dia dela.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-10-16T00:00:00Z'),
    seasonalUntil: new Date('2026-10-29T23:59:59Z'),
    eventName: 'Dia Internacional da Bea',
  },
  {
    id: 'bea-2026-balao',
    name: 'Balão Colorido',
    imagePath: 'seasonal/bea-2026-balao.png',
    description: 'Um balão com a letra B, subindo ao céu.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-10-16T00:00:00Z'),
    seasonalUntil: new Date('2026-10-29T23:59:59Z'),
    eventName: 'Dia Internacional da Bea',
  },
  {
    id: 'bea-2026-estrela',
    name: 'Estrela da Bea',
    imagePath: 'seasonal/bea-2026-estrela.png',
    description: 'Uma estrela que brilha só pra ela.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-10-16T00:00:00Z'),
    seasonalUntil: new Date('2026-10-29T23:59:59Z'),
    eventName: 'Dia Internacional da Bea',
  },
  {
    id: 'bea-2026-corujas',
    name: 'Duas Corujas',
    imagePath: 'seasonal/bea-2026-corujas.png',
    description: 'Uma maior e uma menor. Como a gente.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-10-16T00:00:00Z'),
    seasonalUntil: new Date('2026-10-29T23:59:59Z'),
    eventName: 'Dia Internacional da Bea',
  },

  // ============ DIA DE AÇÃO DE GRAÇAS 2026 ============
  // Janela: 19/11/2026 a 02/12/2026
  {
    id: 'thanksgiving-2026-peru',
    name: 'Peru',
    imagePath: 'seasonal/thanksgiving-2026-peru.png',
    description: 'O clássico da ceia de Ação de Graças.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-11-19T00:00:00Z'),
    seasonalUntil: new Date('2026-12-02T23:59:59Z'),
    eventName: 'Dia de Ação de Graças 2026',
  },
  {
    id: 'thanksgiving-2026-abobora',
    name: 'Abóbora',
    imagePath: 'seasonal/thanksgiving-2026-abobora.png',
    description: 'Laranja e rechonchuda.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-11-19T00:00:00Z'),
    seasonalUntil: new Date('2026-12-02T23:59:59Z'),
    eventName: 'Dia de Ação de Graças 2026',
  },
  {
    id: 'thanksgiving-2026-folha',
    name: 'Folha de Bordo',
    imagePath: 'seasonal/thanksgiving-2026-folha.png',
    description: 'Vermelha como o outono.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-11-19T00:00:00Z'),
    seasonalUntil: new Date('2026-12-02T23:59:59Z'),
    eventName: 'Dia de Ação de Graças 2026',
  },
  {
    id: 'thanksgiving-2026-milho',
    name: 'Milho',
    imagePath: 'seasonal/thanksgiving-2026-milho.png',
    description: 'Espiga dourada, cheia de grãos.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-11-19T00:00:00Z'),
    seasonalUntil: new Date('2026-12-02T23:59:59Z'),
    eventName: 'Dia de Ação de Graças 2026',
  },

  // ============ NATAL 2026 ============
  // Janela: 10/12/2026 a 24/12/2026
  {
    id: 'natal-2026-arvore',
    name: 'Árvore de Natal',
    imagePath: 'seasonal/natal-2026-arvore.png',
    description: 'Verde, iluminada, cheia de promessas.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-12-10T00:00:00Z'),
    seasonalUntil: new Date('2026-12-24T23:59:59Z'),
    eventName: 'Natal 2026',
  },
  {
    id: 'natal-2026-estrela',
    name: 'Estrela Guia',
    imagePath: 'seasonal/natal-2026-estrela.png',
    description: 'Aponta o caminho de volta pra casa.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-12-10T00:00:00Z'),
    seasonalUntil: new Date('2026-12-24T23:59:59Z'),
    eventName: 'Natal 2026',
  },
  {
    id: 'natal-2026-sino',
    name: 'Sino Dourado',
    imagePath: 'seasonal/natal-2026-sino.png',
    description: 'Toca baixinho nas noites frias.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-12-10T00:00:00Z'),
    seasonalUntil: new Date('2026-12-24T23:59:59Z'),
    eventName: 'Natal 2026',
  },
  {
    id: 'natal-2026-boneco-neve',
    name: 'Boneco de Neve',
    imagePath: 'seasonal/natal-2026-boneco-neve.png',
    description: 'Sorri mesmo quando derrete.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-12-10T00:00:00Z'),
    seasonalUntil: new Date('2026-12-24T23:59:59Z'),
    eventName: 'Natal 2026',
  },

  // ============ ANO NOVO 2026/2027 ============
  // Janela: 26/12/2026 a 09/01/2027
  {
    id: 'anonovo-2026-fogos',
    name: 'Fogos no Céu',
    imagePath: 'seasonal/anonovo-2026-fogos.png',
    description: 'Explosões de luz anunciando o recomeço.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-12-26T00:00:00Z'),
    seasonalUntil: new Date('2027-01-09T23:59:59Z'),
    eventName: 'Ano Novo 2027',
  },
  {
    id: 'anonovo-2026-taca',
    name: 'Taça Erguida',
    imagePath: 'seasonal/anonovo-2026-taca.png',
    description: 'Um brinde ao que vem.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-12-26T00:00:00Z'),
    seasonalUntil: new Date('2027-01-09T23:59:59Z'),
    eventName: 'Ano Novo 2027',
  },
  {
    id: 'anonovo-2026-relogio',
    name: 'Relógio da Meia-Noite',
    imagePath: 'seasonal/anonovo-2026-relogio.png',
    description: 'Marca o instante em que tudo muda.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-12-26T00:00:00Z'),
    seasonalUntil: new Date('2027-01-09T23:59:59Z'),
    eventName: 'Ano Novo 2027',
  },
  {
    id: 'anonovo-2026-confete',
    name: 'Confete Dourado',
    imagePath: 'seasonal/anonovo-2026-confete.png',
    description: 'Cai como neve de verão.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-12-26T00:00:00Z'),
    seasonalUntil: new Date('2027-01-09T23:59:59Z'),
    eventName: 'Ano Novo 2027',
  },

  // ============================================================
  // EVENTOS FUTUROS — descomente quando as artes estiverem prontas
  // ============================================================

  // // ============ PÁSCOA 2027 ============
  // // Janela: 05/04/2027 a 19/04/2027
  // { id: 'pascoa-2027-ovo',      name: 'Ovo Decorado',       imagePath: 'seasonal/pascoa-2027-ovo.png',       description: 'Pintado à mão.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-04-05T00:00:00Z'), seasonalUntil: new Date('2027-04-19T23:59:59Z'), eventName: 'Páscoa 2027' },
  // { id: 'pascoa-2027-coelho',   name: 'Coelho',             imagePath: 'seasonal/pascoa-2027-coelho.png',    description: 'Orelhas longas, salto leve.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-04-05T00:00:00Z'), seasonalUntil: new Date('2027-04-19T23:59:59Z'), eventName: 'Páscoa 2027' },
  // { id: 'pascoa-2027-cenoura',  name: 'Cenoura',            imagePath: 'seasonal/pascoa-2027-cenoura.png',   description: 'Crocante e laranja.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-04-05T00:00:00Z'), seasonalUntil: new Date('2027-04-19T23:59:59Z'), eventName: 'Páscoa 2027' },
  // { id: 'pascoa-2027-cruz',     name: 'Cruz',               imagePath: 'seasonal/pascoa-2027-cruz.png',      description: 'Símbolo de fé.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-04-05T00:00:00Z'), seasonalUntil: new Date('2027-04-19T23:59:59Z'), eventName: 'Páscoa 2027' },

  // // ============ DIA DO ÍNDIO 2027 ============
  // // Janela: 19/04/2027 a 03/05/2027
  // { id: 'indio-2027-cocar',     name: 'Cocar',              imagePath: 'seasonal/indio-2027-cocar.png',      description: 'Penas coloridas.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-04-19T00:00:00Z'), seasonalUntil: new Date('2027-05-03T23:59:59Z'), eventName: 'Dia do Índio 2027' },
  // { id: 'indio-2027-oca',       name: 'Oca',                imagePath: 'seasonal/indio-2027-oca.png',        description: 'Casa circular de palha.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-04-19T00:00:00Z'), seasonalUntil: new Date('2027-05-03T23:59:59Z'), eventName: 'Dia do Índio 2027' },
  // { id: 'indio-2027-arco',      name: 'Arco e Flecha',      imagePath: 'seasonal/indio-2027-arco.png',       description: 'Precisão e silêncio.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-04-19T00:00:00Z'), seasonalUntil: new Date('2027-05-03T23:59:59Z'), eventName: 'Dia do Índio 2027' },
  // { id: 'indio-2027-fogueira',  name: 'Fogueira',           imagePath: 'seasonal/indio-2027-fogueira.png',   description: 'Chama que aquece a tribo.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-04-19T00:00:00Z'), seasonalUntil: new Date('2027-05-03T23:59:59Z'), eventName: 'Dia do Índio 2027' },

  // // ============ DIA DAS MÃES 2027 ============
  // // Janela: 10/05/2027 a 24/05/2027
  // { id: 'maes-2027-coracao',    name: 'Coração',            imagePath: 'seasonal/maes-2027-coracao.png',     description: 'Vermelho e pulsante.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-05-10T00:00:00Z'), seasonalUntil: new Date('2027-05-24T23:59:59Z'), eventName: 'Dia das Mães 2027' },
  // { id: 'maes-2027-flor',       name: 'Flor',               imagePath: 'seasonal/maes-2027-flor.png',        description: 'Perfume de jardim.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-05-10T00:00:00Z'), seasonalUntil: new Date('2027-05-24T23:59:59Z'), eventName: 'Dia das Mães 2027' },
  // { id: 'maes-2027-presente',   name: 'Presente',           imagePath: 'seasonal/maes-2027-presente.png',    description: 'Laço dourado.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-05-10T00:00:00Z'), seasonalUntil: new Date('2027-05-24T23:59:59Z'), eventName: 'Dia das Mães 2027' },
  // { id: 'maes-2027-abraco',     name: 'Abraço',             imagePath: 'seasonal/maes-2027-abraco.png',      description: 'O melhor colo do mundo.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-05-10T00:00:00Z'), seasonalUntil: new Date('2027-05-24T23:59:59Z'), eventName: 'Dia das Mães 2027' },

  // // ============ FESTA JUNINA 2027 ============
  // // Janela: 24/06/2027 a 08/07/2027
  // { id: 'junina-2027-fogueira', name: 'Fogueira',           imagePath: 'seasonal/junina-2027-fogueira.png',  description: 'Aquece as noites de junho.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-06-24T00:00:00Z'), seasonalUntil: new Date('2027-07-08T23:59:59Z'), eventName: 'Festa Junina 2027' },
  // { id: 'junina-2027-bandeira', name: 'Bandeirinhas',        imagePath: 'seasonal/junina-2027-bandeira.png',  description: 'Coloridas e tremulando.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-06-24T00:00:00Z'), seasonalUntil: new Date('2027-07-08T23:59:59Z'), eventName: 'Festa Junina 2027' },
  // { id: 'junina-2027-milho',    name: 'Milho',               imagePath: 'seasonal/junina-2027-milho.png',     description: 'Assado na fogueira.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-06-24T00:00:00Z'), seasonalUntil: new Date('2027-07-08T23:59:59Z'), eventName: 'Festa Junina 2027' },
  // { id: 'junina-2027-chapeu',   name: 'Chapéu de Palha',     imagePath: 'seasonal/junina-2027-chapeu.png',    description: 'Caipira e charmoso.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-06-24T00:00:00Z'), seasonalUntil: new Date('2027-07-08T23:59:59Z'), eventName: 'Festa Junina 2027' },

  // // ============ INDEPENDÊNCIA DO BRASIL 2027 ============
  // // Janela: 07/09/2027 a 21/09/2027
  // { id: 'independencia-2027-bandeira', name: 'Bandeira do Brasil', imagePath: 'seasonal/independencia-2027-bandeira.png', description: 'Verde, amarela e azul.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-09-07T00:00:00Z'), seasonalUntil: new Date('2027-09-21T23:59:59Z'), eventName: 'Independência do Brasil 2027' },
  // { id: 'independencia-2027-pombo',    name: 'Pombo da Paz',       imagePath: 'seasonal/independencia-2027-pombo.png',    description: 'Asas brancas.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-09-07T00:00:00Z'), seasonalUntil: new Date('2027-09-21T23:59:59Z'), eventName: 'Independência do Brasil 2027' },
  // { id: 'independencia-2027-tambor',   name: 'Tambor',             imagePath: 'seasonal/independencia-2027-tambor.png',   description: 'Ritmo de marcha.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-09-07T00:00:00Z'), seasonalUntil: new Date('2027-09-21T23:59:59Z'), eventName: 'Independência do Brasil 2027' },
  // { id: 'independencia-2027-estrela',  name: 'Estrela Solitária',  imagePath: 'seasonal/independencia-2027-estrela.png',  description: 'Brilha no céu do país.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-09-07T00:00:00Z'), seasonalUntil: new Date('2027-09-21T23:59:59Z'), eventName: 'Independência do Brasil 2027' },

  // // ============ PRIMAVERA 2027 ============
  // // Janela: 23/09/2027 a 07/10/2027
  // { id: 'primavera-2027-flor',   name: 'Flor',               imagePath: 'seasonal/primavera-2027-flor.png',   description: 'Desabrocha em setembro.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-09-23T00:00:00Z'), seasonalUntil: new Date('2027-10-07T23:59:59Z'), eventName: 'Primavera 2027' },
  // { id: 'primavera-2027-borboleta', name: 'Borboleta',         imagePath: 'seasonal/primavera-2027-borboleta.png', description: 'Asas coloridas.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-09-23T00:00:00Z'), seasonalUntil: new Date('2027-10-07T23:59:59Z'), eventName: 'Primavera 2027' },
  // { id: 'primavera-2027-arvore', name: 'Árvore Florida',     imagePath: 'seasonal/primavera-2027-arvore.png', description: 'Coberta de pétalas.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-09-23T00:00:00Z'), seasonalUntil: new Date('2027-10-07T23:59:59Z'), eventName: 'Primavera 2027' },
  // { id: 'primavera-2027-sol',    name: 'Sol Suave',          imagePath: 'seasonal/primavera-2027-sol.png',    description: 'Aquece sem queimar.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-09-23T00:00:00Z'), seasonalUntil: new Date('2027-10-07T23:59:59Z'), eventName: 'Primavera 2027' },

  // // ============ DIA DAS CRIANÇAS 2027 ============
  // // Janela: 12/10/2027 a 26/10/2027
  // { id: 'criancas-2027-balao',   name: 'Balão',              imagePath: 'seasonal/criancas-2027-balao.png',   description: 'Sobe e não volta.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-10-12T00:00:00Z'), seasonalUntil: new Date('2027-10-26T23:59:59Z'), eventName: 'Dia das Crianças 2027' },
  // { id: 'criancas-2027-pipoca',  name: 'Pipoca',             imagePath: 'seasonal/criancas-2027-pipoca.png',  description: 'Estoura na panela.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-10-12T00:00:00Z'), seasonalUntil: new Date('2027-10-26T23:59:59Z'), eventName: 'Dia das Crianças 2027' },
  // { id: 'criancas-2027-urso',    name: 'Urso de Pelúcia',    imagePath: 'seasonal/criancas-2027-urso.png',    description: 'Melhor amigo de infância.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-10-12T00:00:00Z'), seasonalUntil: new Date('2027-10-26T23:59:59Z'), eventName: 'Dia das Crianças 2027' },
  // { id: 'criancas-2027-bala',    name: 'Bala',               imagePath: 'seasonal/criancas-2027-bala.png',    description: 'Doce e colorida.', price: 50, category: 'sazonal', seasonal: true, seasonalFrom: new Date('2027-10-12T00:00:00Z'), seasonalUntil: new Date('2027-10-26T23:59:59Z'), eventName: 'Dia das Crianças 2027' },
];

async function main() {
  for (const s of SEASONAL_STAMPS) {
    await prisma.stamp.upsert({
      where: { id: s.id },
      create: s,
      update: {
        name: s.name,
        imagePath: s.imagePath,
        description: s.description,
        price: s.price,
        category: s.category,
        seasonal: s.seasonal,
        seasonalFrom: s.seasonalFrom,
        seasonalUntil: s.seasonalUntil,
        eventName: s.eventName,
        available: true,
      },
    });
    console.log(`✓ ${s.name} — ${s.eventName}`);
  }
  console.log(`Seed sazonal concluído. ${SEASONAL_STAMPS.length} selos.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
