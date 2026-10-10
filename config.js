import 'dotenv/config';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  },

  corsOrigin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(','),

  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT,
  },

  delivery: {
    minDays: Number(process.env.DELIVERY_MIN_DAYS ?? 0),
    maxDays: Number(process.env.DELIVERY_MAX_DAYS ?? 3),
    devMode: process.env.DELIVERY_DEV_MODE === 'true',
    devMinSeconds: Number(process.env.DELIVERY_DEV_MIN_SECONDS ?? 10),
    devMaxSeconds: Number(process.env.DELIVERY_DEV_MAX_SECONDS ?? 60),
  },

  currency: {
    name: process.env.CURRENCY_NAME || 'Moedas Postais',
    symbol: process.env.CURRENCY_SYMBOL || '₥',
    initialBalance: Number(process.env.INITIAL_BALANCE ?? 500),
    defaultStampPrice: Number(process.env.STAMP_PRICE_DEFAULT ?? 50),

    // Selos autorais
  customStampPrice: Number(process.env.CUSTOM_STAMP_PRICE ?? 180),
  customStampLimit: Number(process.env.CUSTOM_STAMP_LIMIT ?? 3),
  customStampSize: Number(process.env.CUSTOM_STAMP_SIZE ?? 32),
  customStampMaxBytes: Number(process.env.CUSTOM_STAMP_MAX_BYTES ?? 51200), // 50 KB
  },

  isProd: process.env.NODE_ENV === 'production',
};