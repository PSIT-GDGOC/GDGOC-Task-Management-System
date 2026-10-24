import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../utils/asyncHandler';
import { idSchema, paginationSchema, Pagination } from '../schemas/directory';
import { AuthenticatedUser } from '../types/auth';
const router = Router();
router.use(requireAuth);
function visible(user: AuthenticatedUser): Prisma.NotificationWhereInput {
  return {
    userId: user.id,
    task: {
      isDeleted: false,
    },
  };
}
router.get(
  '/',
  validate({
    query: paginationSchema.extend({ unreadOnly: z.enum(['true', 'false']).default('false') }),
  }),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as Pagination;
    const where = {
      ...visible(req.user!),
      ...(req.query.unreadOnly === 'true' && { readAt: null }),
    };
    const [data, total, unreadCount] = await prisma.$transaction(
      [
        prisma.notification.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: { task: { select: { id: true, title: true, status: true, deadline: true } } },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { ...visible(req.user!), readAt: null } }),
      ],
      { isolationLevel: 'RepeatableRead' },
    );
    res.json({
      success: true,
      data,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),
);
router.patch(
  '/:id/read',
  validate({ params: z.object({ id: idSchema }), body: z.object({}).strict() }),
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { ...visible(req.user!), id: req.params.id },
    });
    if (!notification) throw new AppError('Notification not found', 404);
    await prisma.notification.updateMany({
      where: { id: notification.id, userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({
      success: true,
      data: await prisma.notification.findUnique({
        where: { id: notification.id },
        select: { id: true, readAt: true },
      }),
    });
  }),
);
router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  }),
);

router.post(
  '/:id/read',
  validate({ params: z.object({ id: idSchema }) }),
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { ...visible(req.user!), id: req.params.id },
    });
    if (!notification) throw new AppError('Notification not found', 404);
    await prisma.notification.updateMany({
      where: { id: notification.id, userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({
      success: true,
      data: await prisma.notification.findUnique({
        where: { id: notification.id },
        select: { id: true, readAt: true },
      }),
    });
  }),
);

export default router;
