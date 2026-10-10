import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { config } from './config.js';
import { authLimiter } from './middleware.js';
import {
  normalizeUsername,
  validateUsername,
  validateAddressParts,
  buildDisplayAddress,
} from './utils.js';

const router = Router();

async function issueTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, username: user.username },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessTtl }
  );

  const refreshToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      displayAddress: user.displayAddress,
    },
  };
}

// ---------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().min(3).max(20),
      street: z.string().min(3).max(60),
      number: z.string().min(1).max(6),
      city: z.string().min(2).max(40),
      complement: z.string().max(30).optional().nullable(),
      password: z.string().min(6).max(128),
    });
    const data = schema.parse(req.body);

    const cleanUsername = normalizeUsername(data.username);
    if (!validateUsername(cleanUsername)) {
      return res.status(400).json({
        error: 'Nome de usuário inválido. Use 3–20 letras minúsculas, números ou _.',
      });
    }

    if (!validateAddressParts(data)) {
      return res.status(400).json({ error: 'Endereço inválido.' });
    }

    const displayAddress = buildDisplayAddress(data);
    if (!displayAddress) {
      return res.status(400).json({ error: 'Endereço incompleto.' });
    }

    const conflict = await prisma.user.findFirst({
      where: { OR: [{ username: cleanUsername }, { displayAddress }] },
    });
    if (conflict) {
      return res.status(409).json({ error: 'Nome de usuário ou endereço já em uso.' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          username: cleanUsername,
          passwordHash,
          street: data.street.trim(),
          number: data.number.trim(),
          city: data.city.trim(),
          complement: data.complement?.trim() || null,
          displayAddress,
          notificationPrefs: { create: {} },
          wallet: { create: { balance: config.currency.initialBalance } },
        },
      });
      await tx.walletTransaction.create({
        data: {
          userId: u.id,
          type: 'credit',
          amount: config.currency.initialBalance,
          reason: 'Saldo inicial',
          refType: 'initial',
        },
      });
      return u;
    });

    res.status(201).json(await issueTokens(user));
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().min(3).max(20),
      password: z.string().min(1).max(128),
    });
    const { username, password } = schema.parse(req.body);

    const cleanUsername = normalizeUsername(username);

    const user = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });

    res.json(await issueTokens(user));
  } catch (e) { next(e); }
});

router.post('/logout', async (_req, res) => res.status(204).end());

// ---------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token ausente.' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const accessToken = jwt.sign(
      { sub: user.id, username: user.username },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessTtl }
    );
    const newRefresh = crypto.randomBytes(48).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: newHash, expiresAt },
    });

    res.json({
      accessToken,
      refreshToken: newRefresh,
      user: {
        id: user.id,
        username: user.username,
        displayAddress: user.displayAddress,
      },
    });
  } catch (e) { next(e); }
});

export default router;