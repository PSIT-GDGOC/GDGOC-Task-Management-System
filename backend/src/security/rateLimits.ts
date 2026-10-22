import { rateLimit } from 'express-rate-limit';
// Redis-backed stores are connected centrally when REDIS_URL is configured.
export const authenticationLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again later.' },
  },
});
export const invitationLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many invitation attempts. Try again later.' },
  },
});
