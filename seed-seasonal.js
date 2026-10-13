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
// ---------------------------------------------------------------

const SEASONAL_STAMPS = [
  // ============ HALLOWEEN 2026 ============
  {
    id: 'halloween-2026-abobora',
    name: 'Abóbora Iluminada',
    imagePath: 'seasonal/halloween-2026-abobora.png',
    description: 'Uma abóbora sorridente, cheia de luz.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-10-01T00:00:00Z'),
    seasonalUntil: new Date('2026-10-31T23:59:59Z'),
    eventName: 'Dia das Bruxas 2026',
  },
  {
    id: 'halloween-2026-morcego',
    name: 'Morcego Noturno',
    imagePath: 'seasonal/halloween-2026-morcego.png',
    description: 'Sai voando quando a lua sobe.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-10-01T00:00:00Z'),
    seasonalUntil: new Date('2026-10-31T23:59:59Z'),
    eventName: 'Dia das Bruxas 2026',
  },
  {
    id: 'halloween-2026-gato-preto',
    name: 'Gato Preto',
    imagePath: 'seasonal/halloween-2026-gato-preto.png',
    description: 'Sete vidas e um olhar misterioso.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-10-01T00:00:00Z'),
    seasonalUntil: new Date('2026-10-31T23:59:59Z'),
    eventName: 'Dia das Bruxas 2026',
  },
  {
    id: 'halloween-2026-fantasma',
    name: 'Fantasma Gentil',
    imagePath: 'seasonal/halloween-2026-fantasma.png',
    description: 'Um susto leve, quase um abraço.',
    price: 50,
    category: 'sazonal',
    seasonal: true,
    seasonalFrom:  new Date('2026-10-01T00:00:00Z'),
    seasonalUntil: new Date('2026-10-31T23:59:59Z'),
    eventName: 'Dia das Bruxas 2026',
  },

  // ============ NATAL 2026 ============
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
    id: 'anonovo-2026-taça',
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
