import cron from 'node-cron';
import { prisma } from './prisma.js';
import { config } from './config.js';

// Valor do aporte semanal — vem do config.js (INITIAL_BALANCE).
// Se quiser trocar, basta atualizar a variável no painel do Render.
const WEEKLY_AMOUNT = config.currency.initialBalance;

// ─────────────────────────────────────────────────────────────────
// Utilitário: qual foi a última sexta-feira 12:00 (Brasília) que já passou?
// Brasília = UTC-3. Sexta 12:00 BRT = sexta 15:00 UTC.
// ─────────────────────────────────────────────────────────────────
function getLastResetDate(now = new Date()) {
  // Trabalha em UTC
  const utc = new Date(now.getTime());

  // Descobre a última sexta-feira 15:00 UTC (que é a referência do reset)
  // getUTCDay(): domingo = 0, ..., sexta = 5, sábado = 6
  const dow = utc.getUTCDay();
  const daysSinceFriday = (dow + 7 - 5) % 7;

  // Constrói a "sexta mais recente às 15:00 UTC"
  const ref = new Date(utc);
  ref.setUTCHours(15, 0, 0, 0);
  ref.setUTCDate(ref.getUTCDate() - daysSinceFriday);

  // Se a referência ficou no futuro (hoje é sexta antes das 15:00 UTC),
  // recua uma semana
  if (ref.getTime() > utc.getTime()) {
    ref.setUTCDate(ref.getUTCDate() - 7);
  }

  return ref;
}

// ─────────────────────────────────────────────────────────────────
// Aplica o reset em uma carteira
// ─────────────────────────────────────────────────────────────────
async function resetWallet(tx, walletId, resetDate) {
  const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) return;

  // Se já resetou nesta data ou depois, ignora (idempotência)
  if (wallet.lastWeeklyReset && wallet.lastWeeklyReset.getTime() >= resetDate.getTime()) {
    return;
  }

  const previousBalance = wallet.balance;

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: WEEKLY_AMOUNT,
      lastWeeklyReset: resetDate,
    },
  });

  await tx.walletTransaction.create({
    data: {
      userId: wallet.userId,
      type: 'credit',
      amount: WEEKLY_AMOUNT,
      reason: `Reset semanal (${previousBalance} → ${WEEKLY_AMOUNT})`,
      refType: 'weekly_reset',
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// Roda o reset em todas as carteiras pendentes
// ─────────────────────────────────────────────────────────────────
async function runWeeklyReset(reason = 'cron') {
  const resetDate = getLastResetDate();
  console.log(`[weekly-reset] iniciando (${reason}) — referência: ${resetDate.toISOString()}`);

  // Pega todas as carteiras que ainda não resetaram nesta data
  const wallets = await prisma.wallet.findMany({
    where: {
      OR: [
        { lastWeeklyReset: null },
        { lastWeeklyReset: { lt: resetDate } },
      ],
    },
    select: { id: true },
  });

  if (!wallets.length) {
    console.log('[weekly-reset] nenhuma carteira pendente.');
    return { reset: 0 };
  }

  let count = 0;

  for (const w of wallets) {
    try {
      await prisma.$transaction(async (tx) => {
        await resetWallet(tx, w.id, resetDate);
      });
      count++;
    } catch (e) {
      console.error('[weekly-reset] erro na carteira', w.id, e.message);
    }
  }

  console.log(`[weekly-reset] ${count} carteira(s) resetada(s).`);
  return { reset: count };
}

// ─────────────────────────────────────────────────────────────────
// Agendador: toda sexta às 15:00 UTC (= 12:00 Brasília)
// ─────────────────────────────────────────────────────────────────
export function startWeeklyResetScheduler() {
  // 15:00 UTC = 12:00 BRT
  // Cron: minuto 0, hora 15, toda sexta-feira
  cron.schedule('0 15 * * 5', () => {
    runWeeklyReset('cron').catch((e) => console.error('[weekly-reset] falha no cron:', e.message));
  }, { timezone: 'UTC' });

  console.log('[weekly-reset] scheduler iniciado (sextas às 15:00 UTC = 12:00 BRT)');

  // Rodada de "catch-up" no boot:
  // se o servidor ficou fora do ar na sexta, o reset é aplicado ao subir.
  // Só roda uma vez, logo depois de iniciar.
  setTimeout(() => {
    runWeeklyReset('boot').catch((e) =>
      console.error('[weekly-reset] falha no boot:', e.message)
    );
  }, 5000);
}

// Exporta para testes manuais, se quiser
export { runWeeklyReset };