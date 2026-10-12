import { Router } from 'express';
import webpush from 'web-push';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { requireAuth } from './middleware.js';
import { config } from './config.js';

const router = Router();

// ---------------------------------------------------------------
// Inicialização do web-push
// ---------------------------------------------------------------
let vapidReady = false;

if (config.vapid.publicKey && config.vapid.privateKey && config.vapid.subject) {
  webpush.setVapidDetails(
    config.vapid.subject,
    config.vapid.publicKey,
    config.vapid.privateKey
  );
  vapidReady = true;
  console.log('[push] VAPID configurado.');
} else {
  console.warn('[push] VAPID não configurado. Web Push desabilitado.');
}

// ---------------------------------------------------------------
// GET /api/push/public-key
// ---------------------------------------------------------------
router.get('/public-key', (req, res) => {
  if (!vapidReady) {
    return res.status(503).json({ error: 'Push não configurado no servidor.' });
  }
  res.json({ publicKey: config.vapid.publicKey });
});

// ---------------------------------------------------------------
// POST /api/push/subscribe
//
// Regra: cada usuário tem NO MÁXIMO UMA inscrição ativa.
// Ao registrar uma nova, todas as anteriores são desativadas.
// Isso evita duplicação (PWA + Chrome no mesmo aparelho).
// ---------------------------------------------------------------
router.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string().min(10),
        auth: z.string().min(10),
      }),
    });

    const data = schema.parse(req.body);

    // 1) Cria/atualiza a inscrição atual como ativa
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: req.userId,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        active: true,
      },
      update: {
        userId: req.userId,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        active: true,
      },
    });

    // 2) Desativa TODAS as outras inscrições desse usuário
    await prisma.pushSubscription.updateMany({
      where: {
        userId: req.userId,
        id: { not: sub.id },
        active: true,
      },
      data: { active: false },
    });

    res.status(201).json({ ok: true, id: sub.id });
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// DELETE /api/push/subscribe
// ---------------------------------------------------------------
router.delete('/subscribe', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      endpoint: z.string().url(),
    });
    const { endpoint } = schema.parse(req.body);

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: req.userId },
    });

    res.status(204).end();
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// POST /api/push/test
// ---------------------------------------------------------------
router.post('/test', requireAuth, async (req, res, next) => {
  try {
    if (!vapidReady) {
      return res.status(503).json({ error: 'Push não configurado.' });
    }

    const count = await sendPush(req.userId, {
      title: 'Correio Virtual',
      body: 'Se você está vendo isto, as notificações estão funcionando!',
      url: '/#/mymail',
      tag: 'test-' + Date.now(),
    });

    res.json({ ok: true, sent: count });
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// sendPush(userId, payload)
//
// Envia para a inscrição ATIVA do usuário. Se por algum motivo
// houver mais de uma ativa (dados antigos), envia só para a mais
// recente — como defesa extra.
// ---------------------------------------------------------------
export async function sendPush(userId, payload) {
  if (!vapidReady) return 0;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: 'desc' },
    take: 1,   // ← defesa extra: nunca envia para mais de uma
  });

  if (!subs.length) return 0;

  const sub = subs[0];
  const pushConfig = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };

  try {
    await webpush.sendNotification(pushConfig, JSON.stringify(payload));
    return 1;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) {
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { active: false },
      }).catch(() => {});
    } else {
      console.error('[push] erro ao enviar para', sub.endpoint.slice(0, 40), e.message);
    }
    return 0;
  }
}

// ---------------------------------------------------------------
// notifyLetterOnTheWay
// ---------------------------------------------------------------
export async function notifyLetterOnTheWay(letter, sender, recipient) {
  if (!recipient) return;

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: recipient.id },
  });
  if (prefs && prefs.onLetterSent === false) return;

  await sendPush(recipient.id, {
    title: 'Uma carta está a caminho!',
    body: `${sender.username} enviou uma correspondência para você.`,
    url: `/#/collection`,
    tag: `letter-${letter.id}`,
  });
}

// ---------------------------------------------------------------
// notifyTrackingUpdate
// ---------------------------------------------------------------
export async function notifyTrackingUpdate(letterId, status) {
  const letter = await prisma.letter.findUnique({
    where: { id: letterId },
    include: { sender: { select: { id: true } } },
  });
  if (!letter || !letter.senderId) return;

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: letter.senderId },
  });
  if (!prefs || prefs.onTrackingUpdate === false) return;

  const MESSAGES = {
    aguardando_coleta: 'Sua carta aguarda coleta.',
    em_transito: 'Sua carta está em trânsito.',
    centro_de_distribuicao: 'Sua carta chegou ao centro de distribuição.',
    saiu_para_entrega: 'Sua carta saiu para entrega.',
    extraviada: 'Sua carta parece ter se perdido no caminho.',
    endereco_nao_localizado: 'O endereço não foi localizado. A carta está voltando.',
    devolvendo_ao_remetente: 'Sua carta está retornando.',
    devolvida: 'Sua carta voltou para você.',
  };

  const body = MESSAGES[status] || `Status: ${status}`;

  await sendPush(letter.senderId, {
    title: 'Atualização no rastreio',
    body,
    url: `/#/track/${letter.trackingCode}`,
    tag: `letter-${letter.id}-${status}`,
  });
}

// ---------------------------------------------------------------
// notifyLetterDelivered
// ---------------------------------------------------------------
export async function notifyLetterDelivered(letterId) {
  const letter = await prisma.letter.findUnique({ where: { id: letterId } });
  if (!letter) return;

  if (letter.senderId) {
    const prefsSender = await prisma.notificationPreference.findUnique({
      where: { userId: letter.senderId },
    });
    if (!prefsSender || prefsSender.onLetterDelivered !== false) {
      await sendPush(letter.senderId, {
        title: 'Sua carta foi entregue!',
        body: 'A correspondência chegou ao destinatário.',
        url: `/#/track/${letter.trackingCode}`,
        tag: `letter-${letter.id}-delivered`,
      });
    }
  }

  if (letter.recipientId) {
    const prefsRecipient = await prisma.notificationPreference.findUnique({
      where: { userId: letter.recipientId },
    });
    if (!prefsRecipient || prefsRecipient.onLetterDelivered !== false) {
      await sendPush(letter.recipientId, {
        title: 'Você recebeu uma carta!',
        body: 'Uma nova correspondência chegou. Toque para abrir.',
        url: `/#/collection`,
        tag: `letter-${letter.id}-received`,
      });
    }
  }
}

export default router;
