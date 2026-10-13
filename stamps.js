import { Router } from 'express';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { requireAuth } from './middleware.js';
import { config } from './config.js';
import { validateStampImage } from './utils.js';

const router = Router();
router.use(requireAuth);

// ---------------------------------------------------------------
// GET /api/stamps — catálogo + selos autorais do usuário
// ---------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const catalog = await prisma.stamp.findMany({
      where: { available: true, isCustom: false },
      orderBy: { price: 'asc' },
    });

    const custom = await prisma.stamp.findMany({
      where: { isCustom: true, ownerId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    // Só considera "purchased" para `owned` (usável no envio)
    const owned = await prisma.userStamp.findMany({
      where: { userId: req.userId, source: 'purchased' },
      select: { stampId: true, quantity: true },
    });
    const ownedMap = Object.fromEntries(
      owned.filter((u) => u.stampId).map((u) => [u.stampId, u.quantity])
    );

    const all = [...catalog, ...custom];

    res.json(all.map((s) => ({
      id: s.id,
      name: s.name,
      imagePath: s.imagePath,
      imageData: s.imageData,
      description: s.description,
      price: s.price,
      category: s.category,
      isCustom: s.isCustom,
      owned: ownedMap[s.id] ?? 0,
    })));
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// POST /api/stamps/:id/purchase
// ---------------------------------------------------------------
router.post('/:id/purchase', async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const stamp = await tx.stamp.findUnique({ where: { id: req.params.id } });
      if (!stamp || !stamp.available) {
        throw Object.assign(new Error('Selo indisponível.'), { status: 404 });
      }
      if (stamp.isCustom && stamp.ownerId !== req.userId) {
        throw Object.assign(new Error('Selo indisponível.'), { status: 404 });
      }

      const wallet = await tx.wallet.findUnique({ where: { userId: req.userId } });
      if (!wallet) {
        throw Object.assign(new Error('Carteira não encontrada.'), { status: 404 });
      }
      if (wallet.balance < stamp.price) {
        throw Object.assign(new Error('Saldo insuficiente.'), { status: 400 });
      }

      const newBalance = wallet.balance - stamp.price;
      await tx.wallet.update({
        where: { userId: req.userId },
        data: { balance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          userId: req.userId,
          type: 'debit',
          amount: stamp.price,
          reason: `Compra: ${stamp.name}`,
          refType: 'stamp_purchase',
          refId: stamp.id,
        },
      });

      const userStamp = await tx.userStamp.upsert({
        where: {
          userId_stampId_source: {
            userId: req.userId,
            stampId: stamp.id,
            source: 'purchased',
          },
        },
        create: {
          userId: req.userId,
          stampId: stamp.id,
          quantity: 1,
          source: 'purchased',
        },
        update: { quantity: { increment: 1 } },
      });

      return { walletBalance: newBalance, userStamp };
    });

    res.status(201).json(result);
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// POST /api/stamps/custom — criar selo autoral
// ---------------------------------------------------------------
router.post('/custom', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(3).max(30),
      description: z.string().max(120).optional().nullable(),
      imageBase64: z.string().min(100),
    });

    const data = schema.parse(req.body);

    const activeCustom = await prisma.stamp.count({
      where: { isCustom: true, ownerId: req.userId },
    });
    if (activeCustom >= config.currency.customStampLimit) {
      return res.status(400).json({
        error: `Você já tem ${config.currency.customStampLimit} selos autorais ativos. Use-os em cartas para liberar espaço.`,
      });
    }

    const base64Match = data.imageBase64.match(/^data:(image\/(png|jpeg));base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({ error: 'Formato da imagem inválido.' });
    }

    const buffer = Buffer.from(base64Match[3], 'base64');

    if (buffer.length > config.currency.customStampMaxBytes) {
      const kb = (config.currency.customStampMaxBytes / 1024).toFixed(0);
      return res.status(400).json({ error: `Imagem muito grande. Máx: ${kb} KB.` });
    }

    const check = validateStampImage(buffer, config.currency.customStampSize);
    if (!check.ok) {
      return res.status(400).json({ error: check.error });
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: req.userId } });
      if (!wallet) throw Object.assign(new Error('Carteira não encontrada.'), { status: 404 });

      const price = config.currency.customStampPrice;
      if (wallet.balance < price) {
        throw Object.assign(
          new Error(`Saldo insuficiente. Você precisa de ${price} ${config.currency.symbol}.`),
          { status: 400 }
        );
      }

      const newBalance = wallet.balance - price;
      await tx.wallet.update({
        where: { userId: req.userId },
        data: { balance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          userId: req.userId,
          type: 'debit',
          amount: price,
          reason: `Criação de selo: ${data.name}`,
          refType: 'custom_stamp_creation',
        },
      });

      const stamp = await tx.stamp.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          imageData: data.imageBase64,
          imagePath: null,
          price: 0,
          category: 'lendario',
          available: true,
          isCustom: true,
          ownerId: req.userId,
        },
      });

      // Cria a posse com source = "purchased" (é o autor, e ele pode usar)
      await tx.userStamp.create({
        data: {
          userId: req.userId,
          stampId: stamp.id,
          quantity: 1,
          source: 'purchased',
        },
      });

      return { stamp, walletBalance: newBalance };
    });

    res.status(201).json(result);
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// DELETE /api/stamps/custom/:id — apagar selo autoral
//
// Regra de preservação:
//   - LetterStamp: zera o stampId, mantendo os campos congelados
//     (a carta continua mostrando o selo mesmo se o Stamp sumir).
//   - UserStamp do PRÓPRIO dono: apaga (é o estoque dele).
//   - UserStamp de TERCEIROS (source = "received"): preserva,
//     apenas zerando o stampId. A coleção deles é intocável.
// ---------------------------------------------------------------
router.delete('/custom/:id', async (req, res, next) => {
  try {
    const stamp = await prisma.stamp.findUnique({
      where: { id: req.params.id },
    });

    if (!stamp || !stamp.isCustom) {
      return res.status(404).json({ error: 'Selo não encontrado.' });
    }
    if (stamp.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Cartas: desvincula o Stamp (campos congelados permanecem)
      await tx.letterStamp.updateMany({
        where: { stampId: stamp.id },
        data: { stampId: null },
      });

      // 2. Estoque do dono: apaga as UserStamp dele
      await tx.userStamp.deleteMany({
        where: {
          stampId: stamp.id,
          userId: req.userId,
        },
      });

      // 3. Coleção de terceiros: preserva, só desvincula
      await tx.userStamp.updateMany({
        where: {
          stampId: stamp.id,
          userId: { not: req.userId },
        },
        data: { stampId: null },
      });

      // 4. Apaga o Stamp em si
      await tx.stamp.delete({ where: { id: stamp.id } });
    });

    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
