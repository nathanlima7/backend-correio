import { prisma } from './prisma.js';
import { sendPush } from './push.js';

async function main() {
  const [,, title, body, url = '/#/mymail'] = process.argv;

  if (!title || !body) {
    console.error('Uso: node notificar-todos.js "<título>" "<corpo>" [url]');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, username: true },
  });

  let enviados = 0;
  for (const u of users) {
    const count = await sendPush(u.id, {
      title,
      body,
      url,
      tag: `manual-broadcast-${Date.now()}`,
    });
    if (count > 0) {
      console.log(`✓ ${u.username}`);
      enviados++;
    } else {
      console.log(`✗ ${u.username} (sem dispositivo ativo)`);
    }
  }

  console.log(`\n${enviados}/${users.length} notificações enviadas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());