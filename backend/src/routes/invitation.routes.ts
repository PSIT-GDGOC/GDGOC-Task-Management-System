import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { InvitationService } from '../services/invitation.service';
import { asyncHandler } from '../utils/asyncHandler';
import { invitationLimit } from '../security/rateLimits';
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
export default router;
