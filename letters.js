import { Router } from 'express';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { requireAuth } from './middleware.js';
import { config } from './config.js';
import {
  generateTrackingCode,
  STATE_MESSAGES,
  LOST_LETTER_CHANCE,
  buildDisplayAddress,
  validateAddressParts,
} from './utils.js';
import { scheduleDelivery } from './delivery.js';

const router = Router();
router.use(requireAuth);

// ---------------------------------------------------------------
// POST /api/letters
// ---------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      recipientAddress: z.string().min(5).max(120).optional(),
      recipientStreet: z.string().min(3).max(60).optional(),
      recipientNumber: z.string().min(1).max(6).optional(),
      recipientCity: z.string().min(2).max(40).optional(),
      recipientComplement: z.string().max(30).optional().nullable(),

      stamps: z.array(z.object({
        stampId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })).max(10).optional(),

      title: z.string().max(120).nullable().optional(),
      content: z.string().min(1).max(50_000),
    });

    const data = schema.parse(req.body);

    // 1. Endereço
    let recipientAddress = data.recipientAddress
      ? String(data.recipientAddress).trim().replace(/\s+/g, ' ')
      : null;

    if (!recipientAddress && data.recipientStreet && data.recipientNumber && data.recipientCity) {
      if (!validateAddressParts({
        street: data.recipientStreet,
        number: data.recipientNumber,
        city: data.recipientCity,
      })) {
        return res.status(400).json({ error: 'Endereço do destinatário inválido.' });
      }
      recipientAddress = buildDisplayAddress({
        street: data.recipientStreet,
        number: data.recipientNumber,
        city: data.recipientCity,
        complement: data.recipientComplement,
      });
    }

    if (!recipientAddress) {
      return res.status(400).json({ error: 'Endereço do destinatário ausente.' });
    }

    const sender = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!sender) return res.status(404).json({ error: 'Remetente não encontrado.' });

    if (recipientAddress === sender.displayAddress) {
      return res.status(400).json({ error: 'Você não pode enviar carta para si mesmo.' });
    }

    const recipient = await prisma.user.findUnique({
      where: { displayAddress: recipientAddress },
    });
    const enderecoExiste = Boolean(recipient);

    // 2. Normaliza a lista de selos
    const stampMap = new Map();
    for (const s of (data.stamps || [])) {
      stampMap.set(s.stampId, (stampMap.get(s.stampId) || 0) + s.quantity);
    }
    const stampList = [...stampMap.entries()].map(([stampId, quantity]) => ({ stampId, quantity }));

    // 3. Extravio + ETA
    const vaiExtravirar = Math.random() < LOST_LETTER_CHANCE;

    const now = Date.now();
    let etaMs;
    if (config.delivery.devMode) {
      const min = config.delivery.devMinSeconds * 1000;
      const max = config.delivery.devMaxSeconds * 1000;
      etaMs = min + Math.random() * (max - min);
    } else {
      const days = config.delivery.minDays +
        Math.floor(Math.random() * (config.delivery.maxDays - config.delivery.minDays + 1));
      etaMs = days * 24 * 60 * 60 * 1000;
    }
    const estimatedDelivery = new Date(now + etaMs);

    // 4. Transação
    const letter = await prisma.$transaction(async (tx) => {
      if (stampList.length) {
        // Só selos comprados/criados (source = "purchased") podem ser usados
        const owned = await tx.userStamp.findMany({
          where: {
            userId: sender.id,
            stampId: { in: stampList.map((s) => s.stampId) },
            source: 'purchased',
          },
        });
        const ownedMap = Object.fromEntries(owned.map((u) => [u.stampId, u.quantity]));

        for (const { stampId, quantity } of stampList) {
          const available = ownedMap[stampId] || 0;
          if (available < quantity) {
            throw Object.assign(
              new Error('Você não tem selos suficientes.'),
              { status: 400 }
            );
          }
        }
      }

      const l = await tx.letter.create({
        data: {
          trackingCode: generateTrackingCode(),
          senderId: sender.id,
          recipientId: recipient?.id ?? null,
          recipientAddress,
          title: data.title ?? null,
          content: data.content,
          status: 'postada',
          estimatedDelivery,
        },
      });

      await tx.trackingEvent.create({
        data: {
          letterId: l.id,
          status: 'postada',
          message: STATE_MESSAGES.postada,
        },
      });

      for (const { stampId, quantity } of stampList) {
        const stamp = await tx.stamp.findUnique({ where: { id: stampId } });
        if (!stamp) {
          throw Object.assign(
            new Error(`Selo ${stampId} não encontrado.`),
            { status: 400 }
          );
        }

        await tx.letterStamp.create({
          data: {
            letterId: l.id,
            stampId: stamp.id,
            name: stamp.name,
            imagePath: stamp.imagePath,
            imageData: stamp.imageData,
            isCustom: stamp.isCustom,
            quantity,
          },
        });

        // Decrementa o estoque do remetente (source = "purchased")
        const after = await tx.userStamp.update({
          where: {
            userId_stampId_source: {
              userId: sender.id,
              stampId,
              source: 'purchased',
            },
          },
          data: { quantity: { decrement: quantity } },
        });

        if (after.quantity <= 0) {
          await tx.userStamp.delete({
            where: {
              userId_stampId_source: {
                userId: sender.id,
                stampId,
                source: 'purchased',
              },
            },
          });
        }
      }

      return l;
    });

    await scheduleDelivery(letter.id, estimatedDelivery, {
      enderecoExiste,
      vaiExtravirar,
    }).catch((e) => console.error('[letters] schedule:', e.message));

    if (recipient) {
      import('./push.js')
        .then(({ notifyLetterOnTheWay }) => notifyLetterOnTheWay(letter, sender, recipient))
        .catch(() => {});
    }

    res.status(201).json({
      id: letter.id,
      trackingCode: letter.trackingCode,
      status: letter.status,
      estimatedDelivery: letter.estimatedDelivery,
      recipientExists: enderecoExiste,
      stampsUsed: stampList,
    });
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// GET /api/letters/sent
// ---------------------------------------------------------------
router.get('/sent', async (req, res, next) => {
  try {
    const letters = await prisma.letter.findMany({
      where: { senderId: req.userId },
      orderBy: { sentAt: 'desc' },
      include: { stamps: true },
    });
    res.json(letters.map(serializeSent));
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// GET /api/letters/incoming
// ---------------------------------------------------------------
router.get('/incoming', async (req, res, next) => {
  try {
    const letters = await prisma.letter.findMany({
      where: {
        recipientId: req.userId,
        status: {
          notIn: ['entregue', 'extraviada', 'endereco_nao_localizado', 'devolvida', 'devolvendo_ao_remetente'],
        },
      },
      orderBy: { sentAt: 'desc' },
      include: { sender: { select: { username: true, displayAddress: true } } },
    });
    res.json(letters.map((l) => ({
      id: l.id,
      trackingCode: l.trackingCode,
      fromUsername: l.sender.username,
      from: l.sender.displayAddress,
      title: l.title,
      status: l.status,
      sentAt: l.sentAt,
      estimatedDelivery: l.estimatedDelivery,
    })));
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// GET /api/letters/received
// ---------------------------------------------------------------
router.get('/received', async (req, res, next) => {
  try {
    const letters = await prisma.letter.findMany({
      where: { recipientId: req.userId, status: 'entregue' },
      orderBy: { deliveredAt: 'desc' },
      include: {
        sender: { select: { username: true, displayAddress: true } },
        reads: { where: { userId: req.userId } },
        stamps: true,
      },
    });
    res.json(letters.map(serializeReceived));
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// GET /api/letters/returned
// ---------------------------------------------------------------
router.get('/returned', async (req, res, next) => {
  try {
    const letters = await prisma.letter.findMany({
      where: {
        senderId: req.userId,
        status: { in: ['devolvida', 'devolvendo_ao_remetente', 'endereco_nao_localizado'] },
      },
      orderBy: { sentAt: 'desc' },
    });
    res.json(letters.map((l) => ({
      id: l.id,
      trackingCode: l.trackingCode,
      to: l.recipientAddress,
      title: l.title,
      status: l.status,
      sentAt: l.sentAt,
      returnedAt: l.returnedAt,
      failureReason: l.failureReason,
    })));
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// GET /api/letters/:id
// ---------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const letter = await prisma.letter.findUnique({
      where: { id: req.params.id },
      include: {
        sender: { select: { id: true, username: true, displayAddress: true } },
        recipient: { select: { id: true, username: true, displayAddress: true } },
        events: { orderBy: { createdAt: 'asc' } },
        stamps: true,
        reads: { where: { userId: req.userId } },
      },
    });
    if (!letter) return res.status(404).json({ error: 'Carta não encontrada.' });

    const isSender = letter.senderId === req.userId;
    const isRecipient = letter.recipientId === req.userId;
    if (!isSender && !isRecipient) {
      return res.status(403).json({ error: 'Sem acesso a esta carta.' });
    }

    const canRead = isSender || letter.status === 'entregue';

    res.json({
      id: letter.id,
      trackingCode: letter.trackingCode,
      sender: letter.sender,
      recipient: letter.recipient,
      recipientAddress: letter.recipientAddress,
      title: letter.title,
      status: letter.status,
      sentAt: letter.sentAt,
      estimatedDelivery: letter.estimatedDelivery,
      deliveredAt: letter.deliveredAt,
      returnedAt: letter.returnedAt,
      failureReason: letter.failureReason,
      content: canRead ? letter.content : null,
      canRead,
      read: letter.reads.length > 0,
      stamps: (letter.stamps || []).map(serializeStamp),
      events: letter.events.map((ev) => ({
        status: ev.status,
        message: ev.message,
        at: ev.createdAt,
      })),
    });
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// POST /api/letters/:id/read
// ---------------------------------------------------------------
router.post('/:id/read', async (req, res, next) => {
  try {
    const letter = await prisma.letter.findUnique({ where: { id: req.params.id } });
    if (!letter) return res.status(404).json({ error: 'Carta não encontrada.' });
    if (letter.recipientId !== req.userId) {
      return res.status(403).json({ error: 'Apenas o destinatário pode marcar como lida.' });
    }
    if (letter.status !== 'entregue') {
      return res.status(409).json({ error: 'A carta ainda não foi entregue.' });
    }
    await prisma.letterRead.upsert({
      where: { letterId_userId: { letterId: letter.id, userId: req.userId } },
      create: { letterId: letter.id, userId: req.userId },
      update: {},
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------
function serializeStamp(ls) {
  return {
    id: ls.stampId || ls.id,
    name: ls.name,
    imagePath: ls.imagePath,
    imageData: ls.imageData,
    isCustom: ls.isCustom,
    quantity: ls.quantity,
  };
}

function serializeSent(l) {
  return {
    id: l.id,
    trackingCode: l.trackingCode,
    to: l.recipientAddress,
    title: l.title,
    status: l.status,
    sentAt: l.sentAt,
    estimatedDelivery: l.estimatedDelivery,
    deliveredAt: l.deliveredAt,
    returnedAt: l.returnedAt,
    failureReason: l.failureReason,
    stamps: (l.stamps || []).map(serializeStamp),
  };
}

function serializeReceived(l) {
  return {
    id: l.id,
    fromUsername: l.sender.username,
    from: l.sender.displayAddress,
    title: l.title,
    status: l.status,
    deliveredAt: l.deliveredAt,
    read: l.reads.length > 0,
    stamps: (l.stamps || []).map(serializeStamp),
  };
}

export default router;
