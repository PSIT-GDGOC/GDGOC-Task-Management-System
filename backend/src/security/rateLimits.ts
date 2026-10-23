import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis, redisPrefix } from '../lib/redis';
import { AppError } from '../middleware/errorHandler';
export function redisLimitStore(suffix: string) {
  const client = redis;
  return client
    ? new RedisStore({
        prefix: `${redisPrefix}:limits:${suffix}:`,
        sendCommand: async (...args) => {
          try {
            return (await client.call(args[0], ...args.slice(1))) as never;
          } catch {
            throw new AppError('Request limiting is temporarily unavailable', 503);
          }
        },
      })
    : undefined;
}
const logger = {
  error: () => console.error('Rate-limit storage unavailable'),
  warn: () => console.warn('Rate-limit configuration warning'),
};
export const authenticationLimit = rateLimit({
  store: redisLimitStore('authentication'),
  logger,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  passOnStoreError: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again later.' },
  },
});
export const invitationLimit = rateLimit({
  store: redisLimitStore('invitations'),
  logger,
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? '127.0.0.1'),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  passOnStoreError: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many invitation attempts. Try again later.' },
  },
});
export const apiLimit = rateLimit({
  store: redisLimitStore('api'),
  logger,
  windowMs: 60000,
  limit: 300,
  keyGenerator: (req) => req.session?.user?.id ?? ipKeyGenerator(req.ip ?? '127.0.0.1'),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  passOnStoreError: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' },
  },
});
