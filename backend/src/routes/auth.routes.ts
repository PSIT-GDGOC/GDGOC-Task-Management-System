import crypto from 'node:crypto';
import { GoogleAuthService } from '../services/google-auth.service';
import { authenticationLimit, invitationLimit } from '../security/rateLimits';
import { asyncHandler } from '../utils/asyncHandler';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SystemRole } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

const router = Router();

const createInvitationSchema = z.object({
  role: z.nativeEnum(SystemRole).optional(),
  position: z.string().optional(),
  teamId: z.string().optional(),
  expiresInHours: z.number().min(1).max(168).optional(), // 1h to 7 days
});

const redeemInvitationSchema = z.object({
  code: z.string().min(10, 'Invalid invitation code format'),
});

const devLoginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.nativeEnum(SystemRole).optional(),
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/v1/auth/logout
 * Destroys the server session and clears the session cookie
 */
router.post('/logout', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) {
      return next(new AppError('Failed to logout cleanly', 500));
    }
    res.clearCookie('gdgoc.sid', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.COOKIE_SAME_SITE,
    });
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

/**
 * GET /api/v1/auth/google/url
 * Scaffolding for Google OAuth 2.0 initiation
 */
const googleQuery = z.object({ portal: z.enum(['member', 'admin']).default('member') }).strict();
router.get(
  '/google/url',
  authenticationLimit,
  validate({ query: googleQuery }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      configured: true,
      url: await GoogleAuthService.begin(req, req.query.portal as 'member' | 'admin'),
    });
  }),
);
router.get(
  '/google',
  authenticationLimit,
  validate({ query: googleQuery }),
  asyncHandler(async (req, res) => {
    res.redirect(await GoogleAuthService.begin(req, req.query.portal as 'member' | 'admin'));
  }),
);
router.get(
  '/google/callback',
  authenticationLimit,
  validate({
    query: z.object({
      state: z.string().min(20).max(200),
      code: z.string().min(1).max(4096).optional(),
      error: z.string().max(200).optional(),
      scope: z.string().optional(),
      authuser: z.string().optional(),
      prompt: z.string().optional(),
      hd: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    res.redirect(
      await GoogleAuthService.callback(
        req,
        req.query.state as string,
        req.query.code as string | undefined,
        req.query.error as string | undefined,
      ),
    );
  }),
);
router.get(
  '/csrf',
  asyncHandler(async (req, res) => {
    req.session.csrfToken ??= crypto.randomBytes(32).toString('base64url');
    await new Promise<void>((resolve, reject) =>
      req.session.save((error) => (error ? reject(error) : resolve())),
    );
    res.set('Cache-Control', 'no-store').json({ success: true, csrfToken: req.session.csrfToken });
  }),
);

/**
 * POST /api/v1/auth/invitations
 * Create single-use expiring admin invitation
 * Restricted strictly to System Owner and President
 */
router.post(
  '/invitations',
  requireAuth,
  requireRole([SystemRole.SYSTEM_OWNER, SystemRole.PRESIDENT]),
  validate({ body: createInvitationSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.createAdminInvitation(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message:
          'Admin invitation created. Share this code securely; it cannot be retrieved again.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/auth/invitations/redeem
 * Redeem an admin invitation code
 */
router.post(
  '/invitations/redeem',
  invitationLimit,
  requireAuth,
  validate({ body: redeemInvitationSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedUser = await AuthService.redeemAdminInvitation(req.user!.id, req.body.code);

      // Update session with new role
      req.session.user = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        position: updatedUser.position,
        githubUsername: updatedUser.githubUsername,
      };

      res.json({
        success: true,
        message: `Successfully promoted to ${updatedUser.role}`,
        user: req.session.user,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/auth/dev-login
 * Development-only login endpoint to test roles and UI without requiring real Google Cloud credentials.
 * Automatically rejected in production!
 */
router.post(
  '/dev-login',
  authenticationLimit,
  validate({ body: devLoginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    if (
      env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'production' ||
      !env.ENABLE_DEV_LOGIN
    ) {
      return next(new AppError('Development login is disabled in production', 403));
    }

    try {
      const { email, name, role } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing && !existing.isActive)
        throw new AppError('Your account has been deactivated', 403);
      // Upsert mock user; this endpoint is only for isolated development/testing.
      const user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          ...(name && { name }),
          ...(role && { role }),
        },
        create: {
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          role: role || AuthService.resolveInitialRole(normalizedEmail),
        },
      });

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

      res.json({
        success: true,
        message: `Dev session initiated for ${user.email} (${user.role})`,
        user: req.session.user,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
