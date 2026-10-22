import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { TeamService } from '../services/team.service';
import {
  membershipParamsSchema,
  Pagination,
  paginationSchema,
  teamParamsSchema,
} from '../schemas/directory';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);
const teamSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

router.get(
  '/',
  validate({ query: paginationSchema }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, ...(await TeamService.list(req.query as unknown as Pagination)) });
  }),
);
router.post(
  '/',
  validate({ body: teamSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await TeamService.create(req.user!, req.body) });
  }),
);
router.get(
  '/:teamId',
  validate({ params: teamParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await TeamService.get(req.params.teamId) });
  }),
);
router.patch(
  '/:teamId',
  validate({ params: teamParamsSchema, body: teamSchema.partial() }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await TeamService.update(req.user!, req.params.teamId, req.body),
    });
  }),
);
router.get(
  '/:teamId/members',
  validate({ params: teamParamsSchema, query: paginationSchema }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      ...(await TeamService.members(
        req.user!,
        req.params.teamId,
        req.query as unknown as Pagination,
      )),
    });
  }),
);
router.put(
  '/:teamId/members/:userId',
  validate({
    params: membershipParamsSchema,
    body: z.object({ isTeamHead: z.boolean().optional() }).strict(),
  }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await TeamService.setMembership(
        req.user!,
        req.params.teamId,
        req.params.userId,
        req.body.isTeamHead,
      ),
    });
  }),
);
router.delete(
  '/:teamId/members/:userId',
  validate({ params: membershipParamsSchema }),
  asyncHandler(async (req, res) => {
    await TeamService.removeMembership(req.user!, req.params.teamId, req.params.userId);
    res.json({ success: true, message: 'Team membership removed' });
  }),
);
export default router;
