import { prisma } from './prisma.js';
import { sendPush } from './push.js';

// ---------------------------------------------------------------
// Script de envio manual de push para um usuário específico.
//
// Uso:
//   node notificar.js <username> "<título>" "<corpo>" [url]
//
// Exemplo:
//   node notificar.js bea "Parabéns!" "Hoje é seu dia especial 🎂" "/#/collection"
// ---------------------------------------------------------------

async function main() {
  const [,, username, title, body, url = '/#/mymail'] = process.argv;

  if (!username || !title || !body) {
    console.error('Uso: node notificar.js <username> "<título>" "<corpo>" [url]');
    console.error('Exemplo: node notificar.js bea "Olá" "Mensagem de teste" "/#/write"');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  });

  if (!user) {
    console.error(`Usuário "${username}" não encontrado.`);
    process.exit(1);
  }

  const count = await sendPush(user.id, {
    title,
    body,
    url,
    tag: `manual-${Date.now()}`,
  });

  if (count > 0) {
    console.log(`✓ Notificação enviada para ${user.username}`);
  } else {
    console.log(`✗ Nenhum dispositivo ativo para ${user.username}`);
    console.log('  (o usuário precisa ter ativado as notificações no app)');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());