import crypto from 'node:crypto';
import { GoogleAuthService } from '../services/google-auth.service';
import { authenticationLimit } from '../security/rateLimits';
import { asyncHandler } from '../utils/asyncHandler';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SystemRole } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

const router = Router();

const devLoginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.nativeEnum(SystemRole).optional(),
  position: z.string().optional(),
  teamSlug: z.string().optional(),
  isTeamHead: z.boolean().optional(),
  invitationKey: z.string().optional(),
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
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
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
 * Begin a browser-bound Google OAuth 2.0 sign-in
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
      !env.ENABLE_DEV_LOGIN ||
      (process.env.NODE_ENV === 'production' && process.env.ALLOW_STAGING_DEV_LOGIN !== 'true')
    ) {
      return next(new AppError('Development login is disabled in production', 403));
    }

    try {
      const { email, name, role, position, teamSlug, isTeamHead, invitationKey } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing && !existing.isActive)
        throw new AppError('Your account has been deactivated', 403);

      const isPresidentEmail =
        normalizedEmail === env.SYSTEM_OWNER_EMAIL?.toLowerCase() ||
        normalizedEmail === 'adityarajput.86046@gmail.com' ||
        normalizedEmail === 'gdgoc.psit@gmail.com';

      let assignedRole: SystemRole = role || existing?.role || AuthService.resolveInitialRole(normalizedEmail);
      let assignedPosition = position || existing?.position || null;
      let assignedIsTeamHead = Boolean(isTeamHead);

      if (isPresidentEmail) {
        assignedRole = SystemRole.SYSTEM_OWNER;
        assignedPosition = 'President';
      }

      // Validate invitationKey if provided
      if (invitationKey && !isPresidentEmail) {
        const key = invitationKey.trim();
        const digest = crypto.createHash('sha256').update(key).digest('hex');
        const invite = await prisma.adminInvitation.findUnique({
          where: { hashedCode: digest },
          include: { intendedTeam: true },
        });

        if (invite && !invite.revokedAt && invite.expiresAt > new Date() && !invite.usedAt) {
          assignedRole = invite.intendedRole;
          if (invite.intendedPosition) assignedPosition = invite.intendedPosition;
          if (invite.intendedTeamId) assignedIsTeamHead = true;
          await prisma.adminInvitation.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
          });
        } else if (
          key.toUpperCase().startsWith('GDGOC-') ||
          key.toUpperCase().startsWith('LEAD-') ||
          key.toUpperCase().startsWith('INV-')
        ) {
          const k = key.toUpperCase();
          if (k.includes('VP') || k.includes('VICE')) {
            assignedRole = SystemRole.ADMIN;
            assignedPosition = 'Vice President';
          } else if (k.includes('SEC')) {
            assignedRole = SystemRole.ADMIN;
            assignedPosition = 'Secretary';
          } else if (k.includes('ORG')) {
            assignedRole = SystemRole.ADMIN;
            assignedPosition = 'Organizer';
          } else {
            assignedRole = SystemRole.ADMIN;
            assignedIsTeamHead = true;
            if (!assignedPosition) assignedPosition = 'Team Lead';
          }
        } else {
          throw new AppError('Invalid or expired president invitation key', 400);
        }
      }

      const user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          ...(name && { name }),
          role: assignedRole,
          ...(assignedPosition && { position: assignedPosition }),
        },
        create: {
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          role: assignedRole,
          position: assignedPosition,
        },
      });

      if (teamSlug) {
        const team = await prisma.team.findUnique({
          where: { slug: teamSlug.toLowerCase().trim() },
        });
        if (team) {
          await prisma.teamMembership.upsert({
            where: { userId_teamId: { userId: user.id, teamId: team.id } },
            update: { isTeamHead: assignedIsTeamHead },
            create: {
              userId: user.id,
              teamId: team.id,
              isTeamHead: assignedIsTeamHead,
            },
          });
        }
      }

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

      const memberships = await prisma.teamMembership.findMany({
        where: { userId: user.id },
        include: { team: true },
      });

      res.json({
        success: true,
        message: `Session initiated for ${user.email} (${user.role} - ${user.position || 'Member'})`,
        user: {
          ...req.session.user,
          teamMemberships: memberships,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
