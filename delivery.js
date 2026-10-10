import cron from 'node-cron';
import { prisma } from './prisma.js';
import { STATE_MESSAGES } from './utils.js';

const SEQUENCE_NORMAL = [
  'postada',
  'aguardando_coleta',
  'em_transito',
  'centro_de_distribuicao',
  'saiu_para_entrega',
  'entregue',
];

const SEQUENCE_LOST = [
  'postada',
  'aguardando_coleta',
  'em_transito',
  'centro_de_distribuicao',
  'saiu_para_entrega',
  'extraviada',
];

const SEQUENCE_RETURN = [
  'postada',
  'aguardando_coleta',
  'em_transito',
  'centro_de_distribuicao',
  'endereco_nao_localizado',
  'devolvendo_ao_remetente',
  'devolvida',
];

export async function scheduleDelivery(letterId, estimatedDelivery, opts = {}) {
  const { enderecoExiste = true, vaiExtravirar = false } = opts;

  let sequence;
  if (!enderecoExiste) sequence = SEQUENCE_RETURN;
  else if (vaiExtravirar) sequence = SEQUENCE_LOST;
  else sequence = SEQUENCE_NORMAL;

  const now = Date.now();
  const total = estimatedDelivery.getTime() - now;
  const steps = sequence.slice(1);

  let acc = 0;
  for (const status of steps) {
    acc += total / steps.length;
    const runAt = new Date(now + acc);

    await prisma.deliveryJob.upsert({
      where: { id: `${letterId}:${status}` },
      create: {
        id: `${letterId}:${status}`,
        letterId,
        nextRunAt: runAt,
        nextStatus: status,
      },
      update: {},
    }).catch(() => {});
  }
}

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const now = new Date();
    const due = await prisma.deliveryJob.findMany({
      where: {
        completed: false,
        nextRunAt: { lte: now },
        OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - 60_000) } }],
      },
      take: 20,
      orderBy: { nextRunAt: 'asc' },
    });

    for (const job of due) {
      const locked = await prisma.deliveryJob.updateMany({
        where: { id: job.id, completed: false, lockedAt: null },
        data: { lockedAt: now },
      });
      if (locked.count === 0) continue;

      try {
        await applyStatus(job.letterId, job.nextStatus);
        await prisma.deliveryJob.update({
          where: { id: job.id },
          data: { completed: true },
        });
      } catch (e) {
        console.error('[delivery] erro', job.id, e.message);
        await prisma.deliveryJob.update({
          where: { id: job.id },
          data: { lockedAt: null },
        });
      }
    }
  } finally {
    running = false;
  }
}

async function applyStatus(letterId, status) {
  const letter = await prisma.letter.findUnique({ where: { id: letterId } });
  if (!letter) return;

  const finais = ['entregue', 'extraviada', 'devolvida'];
  if (finais.includes(letter.status)) return;

  const patch = { status };
  if (status === 'entregue') patch.deliveredAt = new Date();
  if (status === 'devolvida') patch.returnedAt = new Date();
  if (status === 'endereco_nao_localizado') patch.failureReason = 'endereco_invalido';
  if (status === 'extraviada') patch.failureReason = 'extraviada';

  await prisma.$transaction([
    prisma.letter.update({ where: { id: letterId }, data: patch }),
    prisma.trackingEvent.create({
      data: {
        letterId,
        status,
        message: STATE_MESSAGES[status] || status,
      },
    }),
  ]);

  try {
    const { notifyTrackingUpdate, notifyLetterDelivered } = await import('./push.js');
    if (status === 'entregue') await notifyLetterDelivered(letterId);
    else await notifyTrackingUpdate(letterId, status);
  } catch {}
}

export function startScheduler() {
  cron.schedule('*/10 * * * * *', tick, { timezone: 'UTC' });
  console.log('[delivery] scheduler iniciado');
}