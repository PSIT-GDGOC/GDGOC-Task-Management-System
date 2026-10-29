import crypto from 'node:crypto';
import {z} from 'zod';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { InvitationService } from '../services/invitation.service';
import { asyncHandler } from '../utils/asyncHandler';
import { invitationLimit } from '../security/rateLimits';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  createInvitationSchema,
  invitationListSchema,
  InvitationFilters,
  invitationParams,
  redemptionSchema,
} from '../schemas/invitation';
const router = Router();
router.use(requireAuth);

router.get(
  '/role-keys',
  asyncHandler(async (req, res) => {
    const isPresident = req.user?.role === 'SYSTEM_OWNER' || req.user?.role === 'PRESIDENT';

    if (!isPresident) {
      throw new AppError('Only the President can view constant leadership keys', 403);
    }
    const keys = await prisma.roleKey.findMany({
      orderBy: [{ teamSlug: 'asc' }, { position: 'asc' }],
    });
    res.json({ success: true, data: keys });
  }),
);

router.patch(
  '/role-keys/:id',
  asyncHandler(async (req, res) => {
    const isPresident = req.user?.role === 'SYSTEM_OWNER' || req.user?.role === 'PRESIDENT';

    if (!isPresident) {
      throw new AppError('Only the President can update leadership keys', 403);
    }
    const {keyCode} = z.object({keyCode:z.string().trim().min(12).max(200)}).strict().parse(req.body);
    const normalized = keyCode.toUpperCase();
    const updated = await prisma.$transaction(async tx => {
      const target = await tx.roleKey.findFirst({where:{OR:[{id:req.params.id},{position:{equals:req.params.id,mode:'insensitive'}}]}});
      if (!target) throw new AppError('Role key record not found',404);
      const duplicate = await tx.roleKey.findFirst({where:{id:{not:target.id},keyCode:{equals:normalized,mode:'insensitive'}}});
      if (duplicate) throw new AppError('This key is already assigned to another leadership position',409);
      const saved = await tx.roleKey.update({where:{id:target.id},data:{keyCode:normalized}});
      await tx.adminEvent.create({data:{actorId:req.user!.id,action:'ROLE_KEY_ROTATED',resourceId:target.id}});
      return saved;
    },{isolationLevel:'Serializable'});
    res.json({ success: true, data: updated });
  }),
);
router.get(
  '/',
  validate({ query: invitationListSchema }),
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      ...(await InvitationService.list(req.user!, req.query as unknown as InvitationFilters)),
    }),
  ),
);
router.post(
  '/',
  invitationLimit,
  validate({ body: createInvitationSchema }),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json({ success: true, data: await InvitationService.create(req.user!, req.body) }),
  ),
);
router.post(
  '/redeem',
  invitationLimit,
  validate({ body: redemptionSchema }),
  asyncHandler(async (req, res) => {
    const user = await InvitationService.redeem(req.user!, req.body.code);
    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve())),
    );
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      position: user.position,
      githubUsername: user.githubUsername,
    };
    req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
    await new Promise<void>((resolve, reject) =>
      req.session.save((error) => (error ? reject(error) : resolve())),
    );
    res.json({ success: true, user: req.session.user, csrfToken: req.session.csrfToken });
  }),
);
router.post(
  '/:id/revoke',
  invitationLimit,
  validate({ params: invitationParams }),
  asyncHandler(async (req, res) =>
    res.json({ success: true, data: await InvitationService.revoke(req.user!, req.params.id) }),
  ),
);
router.delete(
  '/:id',
  invitationLimit,
  validate({ params: invitationParams }),
  asyncHandler(async (req, res) =>
    res.json({ success: true, data: await InvitationService.revoke(req.user!, req.params.id) }),
  ),
);

export default router;
