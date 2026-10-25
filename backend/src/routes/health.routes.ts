import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { redis } from '../lib/redis';
import { checkSessionStore } from '../lib/session-store';
import { asyncHandler } from '../utils/asyncHandler';
import { Router, Request, Response } from 'express';
import { EmailService } from '../services/email.service';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'gdgoc-task-management-server',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    ...(env.NODE_ENV !== 'production' && {
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    }),
  });
});

router.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await checkSessionStore();
      if (redis) await redis.ping();
      res.json({
        status: 'ready',
        database: 'connected',
        redis: redis ? 'connected' : 'not-configured',
      });
    } catch {
      res.status(503).json({ status: 'not-ready' });
    }
  }),
);

router.get('/email-check', (_req: Request, res: Response) => {
  const hasBrevoKey = Boolean(process.env.BREVO_API_KEY);
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  res.json({
    status: 'configured',
    deliveryMethod: hasBrevoKey ? 'BREVO_HTTPS_API (Port 443)' : 'SMTP',
    hasBrevoKey,
    smtpConfigured: Boolean(host && user && process.env.SMTP_PASS),
    sender: process.env.SMTP_FROM || 'GDGOC PSIT <gdgoc.psit@gmail.com>',
  });
});

router.get(
  '/email-test',
  asyncHandler(async (req: Request, res: Response) => {
    const to = (req.query.to as string) || 'gdgoc.psit@gmail.com';
    const result = await EmailService.sendMail({
      to,
      subject: '🧪 Render Live Email Diagnostic Test',
      html: '<h3>Testing email delivery from Render!</h3><p>Your production email system is working 100%.</p>',
      text: 'Testing email delivery from Render!',
    });
    res.json({
      success: true,
      recipient: to,
      deliveryResult: result,
    });
  }),
);

export default router;
