import { Router } from 'express';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { requireAuth } from './middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const drafts = await prisma.draft.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(drafts);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = z.object({
      recipientAddress: z.string().max(80).nullable().optional(),
      title: z.string().max(120).nullable().optional(),
      content: z.string().max(50_000).optional(),
    }).parse(req.body ?? {});
    // ... resto igual

    const draft = await prisma.draft.create({
      data: { userId: req.userId, ...data },
    });
    res.status(201).json(draft);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const draft = await prisma.draft.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!draft) return res.status(404).json({ error: 'Rascunho não encontrado.' });
    res.json(draft);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const data = z.object({
      recipientAddress: z.string().max(80).nullable().optional(),
      title: z.string().max(120).nullable().optional(),
      content: z.string().max(50_000).optional(),
      version: z.number().int().optional(),
    }).parse(req.body ?? {});

    const existing = await prisma.draft.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Rascunho não encontrado.' });

    // Controle otimista de versão para não sobrescrever alterações mais novas
    if (data.version && data.version < existing.version) {
      return res.status(409).json({
        error: 'Rascunho foi modificado em outro dispositivo.',
        serverVersion: existing.version,
      });
    }

    const updated = await prisma.draft.update({
      where: { id: existing.id },
      data: {
        ...data,
        version: existing.version + 1,
      },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.draft.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!result.count) return res.status(404).json({ error: 'Rascunho não encontrado.' });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;