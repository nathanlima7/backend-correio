import { Router } from 'express';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { requireAuth } from './middleware.js';
import {
  buildDisplayAddress,
  validateAddressParts,
} from './utils.js';

const router = Router();
router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        street: true,
        number: true,
        city: true,
        complement: true,
        displayAddress: true,
        createdAt: true,
        wallet: { select: { balance: true } },
        notificationPrefs: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(user);
  } catch (e) { next(e); }
});

router.patch('/me/address', async (req, res, next) => {
  try {
    const data = z.object({
      street: z.string().min(3).max(60),
      number: z.string().min(1).max(6),
      city: z.string().min(2).max(40),
      complement: z.string().max(30).optional().nullable(),
    }).parse(req.body);

    if (!validateAddressParts(data)) {
      return res.status(400).json({ error: 'Endereço inválido.' });
    }

    const displayAddress = buildDisplayAddress(data);
    if (!displayAddress) {
      return res.status(400).json({ error: 'Endereço incompleto.' });
    }

    const conflict = await prisma.user.findFirst({
      where: { displayAddress, NOT: { id: req.userId } },
    });
    if (conflict) return res.status(409).json({ error: 'Endereço já em uso.' });

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        street: data.street.trim(),
        number: data.number.trim(),
        city: data.city.trim(),
        complement: data.complement?.trim() || null,
        displayAddress,
      },
      select: {
        id: true, username: true, street: true, number: true,
        city: true, complement: true, displayAddress: true,
      },
    });

    res.json(updated);
  } catch (e) { next(e); }
});

router.patch('/me/notification-preferences', async (req, res, next) => {
  try {
    const data = z.object({
      onLetterSent: z.boolean().optional(),
      onTrackingUpdate: z.boolean().optional(),
      onLetterDelivered: z.boolean().optional(),
      onDraftSynced: z.boolean().optional(),
    }).parse(req.body);

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, ...data },
      update: data,
    });
    res.json(prefs);
  } catch (e) { next(e); }
});

router.get('/me/stamps', async (req, res, next) => {
  try {
    const rows = await prisma.userStamp.findMany({
      where: { userId: req.userId },
      include: { stamp: true },
    });
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;