import { Router } from 'express';
import { prisma } from './prisma.js';
import { requireAuth } from './middleware.js';
import { config } from './config.js';

const router = Router();
router.use(requireAuth);

// ---------------------------------------------------------------
// GET /api/wallet — saldo atual + configuração da moeda
// ---------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } });
    if (!wallet) return res.status(404).json({ error: 'Carteira não encontrada.' });

    res.json({
      balance: wallet.balance,
      currencyName: config.currency.name,
      currencySymbol: config.currency.symbol,
      customStampPrice: config.currency.customStampPrice,
    });
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------
// GET /api/wallet/transactions — histórico
// ---------------------------------------------------------------
router.get('/transactions', async (req, res, next) => {
  try {
    const txs = await prisma.walletTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(txs);
  } catch (e) { next(e); }
});

export default router;
