import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from './errorHandler';

/**
 * Middleware: verifyGitHubWebhookSignature
 * Validates the raw body against the X-Hub-Signature-256 header using HMAC-SHA256
 * and constant-time buffer comparison to prevent timing attacks.
 */
export const verifyGitHubWebhookSignature = (req: Request, res: Response, next: NextFunction): void => {
  const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;
  const webhookSecret = env.GITHUB_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('GITHUB_WEBHOOK_SECRET is not configured on the server.');
    return next(new AppError('Webhook signature verification misconfigured on server', 500));
  }

  if (!signatureHeader) {
    return next(new AppError('Missing X-Hub-Signature-256 header', 401));
  }

  if (!req.rawBody) {
    return next(new AppError('Raw request body is missing for signature verification', 500));
  }

  // Header format is sha256=<hex>
  const expectedPrefix = 'sha256=';
  if (!signatureHeader.startsWith(expectedPrefix)) {
    return next(new AppError('Invalid signature format', 400));
  }

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(req.rawBody);
  const calculatedSignature = `${expectedPrefix}${hmac.digest('hex')}`;

  const sigBuffer = Buffer.from(signatureHeader);
  const calcBuffer = Buffer.from(calculatedSignature);

  if (sigBuffer.length !== calcBuffer.length || !crypto.timingSafeEqual(sigBuffer, calcBuffer)) {
    return next(new AppError('Invalid webhook signature. Payload not trusted.', 401));
  }

  next();
};
