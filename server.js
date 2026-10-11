import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import draftsRoutes from './drafts.js';
import lettersRoutes from './letters.js';
import trackingRoutes from './tracking.js';
import stampsRoutes from './stamps.js';
import walletRoutes from './wallet.js';
import pushRoutes from './push.js';
import { errorHandler, notFound, apiLimiter } from './middleware.js';
import { startScheduler } from './delivery.js';
import { startWeeklyResetScheduler } from './weekly-reset.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(apiLimiter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/letters', lettersRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/stamps', stampsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/push', pushRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[correio-server] :${config.port} (${config.env})`);
  startScheduler();
  startWeeklyResetScheduler();
});
