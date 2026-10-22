import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { redis } from '../lib/redis';
import { asyncHandler } from '../utils/asyncHandler';
import { Router, Request, Response } from 'express';

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
export default router;
