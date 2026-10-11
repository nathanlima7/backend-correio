import { prisma } from './prisma.js';

// Cores por categoria (vão para o frontend aplicar)
const CATEGORIES = {
  comum:    { label: 'COMUM',    color: '#e8b923' }, // amarelo
  incomum:  { label: 'INCOMUM',  color: '#00e5ff' }, // azul neon
  raro:     { label: 'RARO',     color: '#a855f7' }, // roxo
  epico:    { label: 'ÉPICO',    color: '#f97316' }, // laranja
  lendario: { label: 'LENDÁRIO', color: '#f5c542' }, // dourado
};

const STAMPS = [
  // ============ COMUM (10 Gemas) ============
  {
    id: 'selo-flor',
    name: 'Selo da Flor',
    imagePath: 'selo-flor.png',
    description: 'Uma florzinha amarela, simples e alegre.',
    price: 10,
    category: 'comum',
  },
  {
    id: 'selo-folha',
    name: 'Selo da Folha',
    imagePath: 'selo-folha.png',
    description: 'Verde como a primavera.',
    price: 10,
    category: 'comum',
  },
  {
    id: 'selo-nuvem',
    name: 'Selo da Nuvem',
    imagePath: 'selo-nuvem.png',
    description: 'Branca, fofinha, à deriva.',
    price: 10,
    category: 'comum',
  },
  {
    id: 'selo-cogumelo',
    name: 'Selo do Cogumelo',
    imagePath: 'selo-cogumelo.png',
    description: 'Pequeno e charmoso.',
    price: 10,
    category: 'comum',
  },

  // ============ INCOMUM (20 Gemas) ============
  {
    id: 'selo-lua',
    name: 'Selo da Lua',
    imagePath: 'selo-lua.png',
    description: 'Brilha na calada da noite.',
    price: 20,
    category: 'incomum',
  },
  {
    id: 'selo-gato',
    name: 'Selo do Gato',
    imagePath: 'selo-gato.png',
    description: 'Um gatinho curioso, de olhos grandes.',
    price: 20,
    category: 'incomum',
  },
  {
    id: 'selo-coruja',
    name: 'Selo da Coruja',
    imagePath: 'selo-coruja.png',
    description: 'Sábia, atenta, noturna.',
    price: 20,
    category: 'incomum',
  },
  {
    id: 'selo-borboleta',
    name: 'Selo da Borboleta',
    imagePath: 'selo-borboleta.png',
    description: 'Delicada e colorida.',
    price: 20,
    category: 'incomum',
  },

  // ============ RARO (40 Gemas) ============
  {
    id: 'selo-estrelas',
    name: 'Selo das Estrelas',
    imagePath: 'selo-estrelas.png',
    description: 'Para cartas que falam do infinito.',
    price: 40,
    category: 'raro',
  },
  {
    id: 'selo-coracao',
    name: 'Selo do Coração',
    imagePath: 'selo-coracao.png',
    description: 'Para quem você guarda no peito.',
    price: 40,
    category: 'raro',
  },
  {
    id: 'selo-livro',
    name: 'Selo do Livro',
    imagePath: 'selo-livro.png',
    description: 'Histórias que atravessam o tempo.',
    price: 40,
    category: 'raro',
  },
  {
    id: 'selo-chuva',
    name: 'Selo da Chuva',
    imagePath: 'selo-chuva.png',
    description: 'Pingos que trazem cheiro de terra.',
    price: 40,
    category: 'raro',
  },

  // ============ ÉPICO (60 Gemas) ============
  {
    id: 'selo-marte',
    name: 'Selo de Marte',
    imagePath: 'selo-marte.png',
    description: 'O planeta vermelho, misterioso.',
    price: 60,
    category: 'epico',
  },
  {
    id: 'selo-saturno',
    name: 'Selo de Saturno',
    imagePath: 'selo-saturno.png',
    description: 'Seus anéis giram em silêncio.',
    price: 60,
    category: 'epico',
  },
  {
    id: 'selo-dragao',
    name: 'Selo do Dragão',
    imagePath: 'selo-dragao.png',
    description: 'Guardião de mundos distantes.',
    price: 60,
    category: 'epico',
  },
  {
    id: 'selo-montanha',
    name: 'Selo da Montanha',
    imagePath: 'selo-montanha.png',
    description: 'Alta, antiga, serena.',
    price: 60,
    category: 'epico',
  },

  // ============ LENDÁRIO (80 Gemas) ============
  {
    id: 'selo-fenix',
    name: 'Selo da Fênix',
    imagePath: 'selo-fenix.png',
    description: 'Renasce das cinzas.',
    price: 80,
    category: 'lendario',
  },
  {
    id: 'selo-eclipse',
    name: 'Selo do Eclipse',
    imagePath: 'selo-eclipse.png',
    description: 'Quando a luz encontra a sombra.',
    price: 80,
    category: 'lendario',
  },
  {
    id: 'selo-unicornio',
    name: 'Selo do Unicórnio',
    imagePath: 'selo-unicornio.png',
    description: 'Lenda entre névoas douradas.',
    price: 80,
    category: 'lendario',
  },
  {
    id: 'selo-via-lactea',
    name: 'Selo da Via Láctea',
    imagePath: 'selo-via-lactea.png',
    description: 'Um rio de estrelas no céu.',
    price: 80,
    category: 'lendario',
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
    console.log(`✓ ${s.name} (${s.category})`);
  }
  console.log(`Seed concluído. ${STAMPS.length} selos.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
