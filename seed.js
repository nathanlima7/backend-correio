import { prisma } from './prisma.js';

const STAMPS = [
  {
    id: 'selo-flor',
    name: 'Selo da Flor',
    imagePath: 'selo-flor.png',
    description: 'Uma florzinha amarela, simples e alegre.',
    price: 30,
    category: 'comum',
  },
  {
    id: 'selo-lua',
    name: 'Selo da Lua',
    imagePath: 'assets/stamps/selo-lua.png',
    description: 'Brilha na calada da noite.',
    price: 50,
    category: 'incomum',
  },
  {
    id: 'selo-gato',
    name: 'Selo do Gato',
    imagePath: 'assets/stamps/selo-gato.png',
    description: 'Um gatinho curioso, de olhos grandes.',
    price: 60,
    category: 'incomum',
  },
  {
    id: 'selo-estrelas',
    name: 'Selo das Estrelas',
    imagePath: 'assets/stamps/selo-estrelas.png',
    description: 'Para cartas que falam do infinito.',
    price: 90,
    category: 'raro',
  },
  {
    id: 'selo-coracao',
    name: 'Selo do Coração',
    imagePath: 'assets/stamps/selo-coracao.png',
    description: 'Para quem você guarda no peito.',
    price: 120,
    category: 'raro',
  },
];

async function main() {
  for (const s of STAMPS) {
    await prisma.stamp.upsert({
      where: { id: s.id },
      create: s,
      update: {
        name: s.name,
        imagePath: s.imagePath,
        description: s.description,
        price: s.price,
        category: s.category,
        available: true,
      },
    });
    console.log(`✓ ${s.name}`);
  }
  console.log('Seed concluído.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());