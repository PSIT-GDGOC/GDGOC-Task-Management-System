import crypto from 'node:crypto';
import { GoogleAuthService } from '../services/google-auth.service';
import { authenticationLimit } from '../security/rateLimits';
import { asyncHandler } from '../utils/asyncHandler';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { passwordLogin, passwordLoginSchema } from '../services/password-auth.service';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { UserRepository } from '../repositories/user.repository';

const router = Router();

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
 * PATCH /api/v1/auth/name
 * Updates user's real full name
 */
router.patch(
  '/name',
  requireAuth,
  validate({ body: z.object({ name: z.string().trim().min(2).max(100) }).strict() }),
  asyncHandler(async (req: Request, res: Response) => {
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: req.body.name },
    });
    if (req.session?.user) {
      req.session.user.name = updatedUser.name;
    }
    const updated = await UserRepository.findById(req.user!.id);
    res.json({ success: true, user: updated });
  }),
);

/**
 * POST /api/v1/auth/logout
 * Destroys the server session and clears the session cookie
 */
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) {
      return next(new AppError('Failed to logout cleanly', 500));
    }
    res.clearCookie('gdgoc.sid', {
      httpOnly: true,
      secure:
        env.NODE_ENV === 'production' ||
        process.env.RENDER === 'true' ||
        env.COOKIE_SAME_SITE === 'none',
      sameSite: env.COOKIE_SAME_SITE,
    });
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

/**
 * GET /api/v1/auth/google/url
 * Begin a browser-bound Google OAuth 2.0 sign-in
 */
const googleQuery = z.object({ portal: z.enum(['member', 'admin']).default('member') }).strict();
router.get(
  '/google/url',
  authenticationLimit,
  validate({ query: googleQuery }),
  asyncHandler(async (req, res) => {
    if (!GoogleAuthService.configured()) {
      res.json({
        success: true,
        configured: false,
        message: 'Google OAuth 2.0 credentials are not yet configured on the server.',
      });
      return;
    }
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
    const portal = (req.query.portal as 'member' | 'admin') || 'member';
    const targetOrigin = portal === 'admin' ? env.ADMIN_ORIGIN : env.CLIENT_ORIGIN;
    if (!GoogleAuthService.configured()) {
      res.redirect(
        `${targetOrigin}/login?error=${encodeURIComponent(
          'Google OAuth 2.0 credentials are not yet configured on the server.',
        )}`,
      );
      return;
    }
    res.redirect(await GoogleAuthService.begin(req, portal));
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
  async (req: Request, res: Response) => {
    try {
      const redirectUrl = await GoogleAuthService.callback(
        req,
        req.query.state as string,
        req.query.code as string | undefined,
        req.query.error as string | undefined,
      );
      res.redirect(redirectUrl);
    } catch (err: any) {
      const portal = req.session?.oauth?.portal || 'member';
      const targetOrigin = portal === 'admin' ? env.ADMIN_ORIGIN : env.CLIENT_ORIGIN;
      const errorMsg = encodeURIComponent(
        err.message || 'Google sign-in was cancelled or could not be verified',
      );
      res.redirect(`${targetOrigin}/login?error=${errorMsg}`);
    }
  },
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
 * POST /api/v1/auth/dev-login
 * Development-only login endpoint to test roles and UI without requiring real Google Cloud credentials.
 * Automatically rejected in production!
 */
router.post(
  '/dev-login',
  authenticationLimit,
  validate({ body: passwordLoginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    if (
      !env.ENABLE_DEV_LOGIN ||
      (process.env.NODE_ENV === 'production' && process.env.ALLOW_STAGING_DEV_LOGIN !== 'true')
    ) {
      return next(new AppError('Development login is disabled in production', 403));
    }

    try {
      const user = await passwordLogin(req.body);

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

      res.json({
        success: true,
        csrfToken: req.session.csrfToken,
        message: `Session initiated for ${user.email} (${user.role} - ${user.position || 'Member'})`,
        user: {
          ...req.session.user,
          teamMemberships: user.teamMemberships,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
