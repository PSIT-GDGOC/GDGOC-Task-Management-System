import { Router } from 'express';
import { z } from 'zod';
import { SystemRole } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UserFilters, UserService } from '../services/user.service';
import { idSchema, paginationSchema } from '../schemas/directory';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

const profileSchema = z
  .object({
    position: z.string().trim().min(1).max(100).nullable().optional(),
    githubUsername: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/, 'Invalid GitHub username')
      .nullable()
      .optional(),
  })
  .strict();
const directorySchema = paginationSchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  teamId: idSchema.optional(),
  role: z.nativeEnum(SystemRole).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await UserService.profile(req.user!.id) });
  }),
);
router.patch(
  '/me',
  validate({ body: profileSchema }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await UserService.updateProfile(req.user!.id, req.body) });
  }),
);
router.get(
  '/',
  validate({ query: directorySchema }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      ...(await UserService.list(req.user!, req.query as unknown as UserFilters)),
    });
  }),
);
router.patch(
  '/:userId/status',
  validate({
    params: z.object({ userId: idSchema }),
    body: z.object({ isActive: z.boolean() }).strict(),
  }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await UserService.setActive(req.user!, req.params.userId, req.body.isActive),
    });
  }),
);
export default router;
