import crypto from 'node:crypto';
import { RequestHandler } from 'express';
import { isTrustedFrontendOrigin } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/api/v1/webhooks/github')
    return next();
  const origin = req.get('origin');
  if (origin && !isTrustedFrontendOrigin(origin))
    return next(new AppError('Untrusted request origin', 403));
  if (!req.session?.user) return next();
  const token = req.get('x-csrf-token');
  const expected = req.session.csrfToken;
  if (
    !token ||
    !expected ||
    Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
    !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  ) {
    return next(new AppError('A valid X-CSRF-Token header is required', 403));
  }
  next();
};
