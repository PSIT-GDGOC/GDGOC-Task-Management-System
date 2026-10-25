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
import { UserRepository } from '../repositories/user.repository';

const router = Router();


function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
}

const devLoginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().optional(),
  role: z.nativeEnum(SystemRole).optional(),
  position: z.string().optional(),
  teamSlug: z.string().optional(),
  isTeamHead: z.boolean().optional(),
  invitationKey: z.string().optional(),
  isSignUp: z.boolean().optional(),
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
      const { email, name, password, role, position, teamSlug, isTeamHead, invitationKey, isSignUp } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing && !existing.isActive)
        throw new AppError('Your account has been deactivated', 403);

      const isPresidentEmail =
        normalizedEmail === env.SYSTEM_OWNER_EMAIL?.toLowerCase() ||
        normalizedEmail === 'adityarajput.86046@gmail.com' ||
        normalizedEmail === 'gdgoc.psit@gmail.com';

      // Reject non-existent accounts attempting to sign in (unless bootstrapping designated president)
      if (!existing && !isSignUp && !isPresidentEmail) {
        throw new AppError('No account found with this email. Please sign up first.', 404);
      }

      // Reject existing accounts attempting to sign up again
      if (existing && isSignUp) {
        throw new AppError('An account with this email already exists. Please sign in instead.', 409);
      }

      // Enforce strict password validation on sign-in
      if (!isSignUp) {
        const trimmedPassword = (password || '').trim();
        if (!trimmedPassword) {
          throw new AppError('Password is required.', 400);
        }

        if (existing) {
          if (existing.passwordHash) {
            if (!verifyPassword(trimmedPassword, existing.passwordHash)) {
              throw new AppError('Incorrect password. Please verify your password and try again.', 401);
            }
          } else {
            // Default preset password for seeded/legacy accounts
            if (trimmedPassword !== 'Password@123') {
              throw new AppError('Incorrect password. Please verify your password and try again.', 401);
            }
          }
        } else if (isPresidentEmail) {
          // Designated President bootstrap sign-in
          if (trimmedPassword !== 'Password@123') {
            throw new AppError('Incorrect password. Please verify your password and try again.', 401);
          }
        }
      }

      // If user already exists in DB, prioritize their persistent DB role & position
      let assignedRole: SystemRole = existing ? existing.role : (role || AuthService.resolveInitialRole(normalizedEmail));
      let assignedPosition = existing ? existing.position : (position || null);
      let assignedIsTeamHead = Boolean(isTeamHead);

      if (isPresidentEmail) {
        assignedRole = SystemRole.SYSTEM_OWNER;
        assignedPosition = 'President';
      }

      // Role guards on returning login
      if (!isSignUp && existing) {
        if ((role === SystemRole.SYSTEM_OWNER || position === 'President') && !isPresidentEmail && existing.role !== SystemRole.SYSTEM_OWNER) {
          throw new AppError('Access denied. Only the chapter President can sign in via the President portal.', 403);
        }
        if ((isTeamHead || role === SystemRole.ADMIN) && existing.role === SystemRole.USER && !isPresidentEmail) {
          const isHead = await prisma.teamMembership.findFirst({
            where: { userId: existing.id, isTeamHead: true },
          });
          if (!isHead) {
            throw new AppError('Access denied. Your account is registered as a regular member. Please sign in under Team Crew.', 403);
          }
        }
      }

      // Validate invitationKey during initial sign-up (or if explicitly supplied)
      if (invitationKey && !isPresidentEmail && (isSignUp || !existing)) {
        const rawKey = invitationKey.trim();
        const upperKey = rawKey.toUpperCase();
        const requestedPosition = (assignedPosition || position || '').trim();

        // 1. Primary Check: Query the constant RoleKey table in database
        const matchingRoleKey = await prisma.roleKey.findFirst({
          where: {
            OR: [
              { keyCode: rawKey },
              { keyCode: upperKey },
            ],
          },
        });

        if (matchingRoleKey) {
          // If a position was specified, verify it matches this role's key in the DB
          if (requestedPosition && requestedPosition.toLowerCase() !== matchingRoleKey.position.toLowerCase()) {
            throw new AppError(
              `Key "${rawKey}" belongs to position "${matchingRoleKey.position}". It cannot be used for "${requestedPosition}".`,
              400,
            );
          }
          assignedRole = SystemRole.ADMIN;
          assignedPosition = matchingRoleKey.position;
          if (matchingRoleKey.teamSlug) {
            assignedIsTeamHead = true;
          }
        } else {
          // 2. Fallback check for shorthand presets
          const PRESET_ROLE_MAP: Record<string, string> = {
            'GDGOC-VP-KEY': 'Vice President',
            'VP': 'Vice President',
            'GDGOC-SEC-KEY': 'Secretary',
            'SEC': 'Secretary',
            'GDGOC-ORG-KEY': 'Organizer',
            'ORG': 'Organizer',
            'GDGOC-TECH-KEY': 'Tech Lead',
            'TECH': 'Tech Lead',
            'GDGOC-MEDIA-KEY': 'Media Lead',
            'MEDIA': 'Media Lead',
            'GDGOC-CONTENT-KEY': 'Content Lead',
            'CONTENT': 'Content Lead',
            'GDGOC-LEAD-KEY': 'Tech Lead',
            'LEAD': 'Tech Lead',
          };

          const matchedPos = PRESET_ROLE_MAP[upperKey];
          if (matchedPos) {
            if (requestedPosition && requestedPosition.toLowerCase() !== matchedPos.toLowerCase()) {
              throw new AppError(
                `Key "${rawKey}" belongs to position "${matchedPos}". It cannot be used for "${requestedPosition}".`,
                400,
              );
            }
            assignedRole = SystemRole.ADMIN;
            assignedPosition = matchedPos;
            if (['Tech Lead', 'Media Lead', 'Content Lead'].includes(matchedPos)) {
              assignedIsTeamHead = true;
            }
          } else {
            // 3. Fallback check for legacy AdminInvitation
            const digest = crypto.createHash('sha256').update(rawKey).digest('hex');
            const upperDigest = crypto.createHash('sha256').update(upperKey).digest('hex');
            const invite = await prisma.adminInvitation.findFirst({
              where: {
                OR: [
                  { hashedCode: digest },
                  { hashedCode: upperDigest },
                ],
              },
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
            } else {
              throw new AppError('Invalid leadership key for this position. Please check with the President.', 400);
            }
          }
        }
      }

      // Enforce singleton leadership: Only 1 President, 1 Vice President, 1 Secretary, 1 Organizer
      const SINGLETON_POSITIONS = ['President', 'Vice President', 'Secretary', 'Organizer'];
      const targetPos = assignedPosition ? assignedPosition.trim() : null;
      if (isSignUp && targetPos && SINGLETON_POSITIONS.some((p) => p.toLowerCase() === targetPos.toLowerCase())) {
        const canonicalPosition = SINGLETON_POSITIONS.find((p) => p.toLowerCase() === targetPos.toLowerCase())!;
        const existingLeader = await prisma.user.findFirst({
          where: {
            position: { equals: canonicalPosition, mode: 'insensitive' },
            email: { not: normalizedEmail },
            isActive: true,
          },
        });
        if (existingLeader) {
          throw new AppError(
            `Position '${canonicalPosition}' is already assigned to ${existingLeader.name || existingLeader.email}. Only one ${canonicalPosition} is allowed.`,
            400,
          );
        }
      }

      // Enforce singleton team heads: Only 1 Team Lead per squad (Tech, Media, Content)
      if (isSignUp && teamSlug && assignedIsTeamHead) {
        const targetTeam = await prisma.team.findUnique({
          where: { slug: teamSlug.toLowerCase().trim() },
        });
        if (targetTeam) {
          const existingHead = await prisma.teamMembership.findFirst({
            where: {
              teamId: targetTeam.id,
              isTeamHead: true,
              user: { email: { not: normalizedEmail }, isActive: true },
            },
            include: { user: true },
          });
          if (existingHead) {
            throw new AppError(
              `The ${targetTeam.name} squad already has an active Team Lead (${existingHead.user.name || existingHead.user.email}). Only one Team Lead per squad is allowed.`,
              400,
            );
          }
        }
      }

      let user;
      if (existing) {
        user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            ...(name && { name }),
            ...(password && !existing.passwordHash && { passwordHash: hashPassword(password) }),
            role: assignedRole,
            ...(assignedPosition && { position: assignedPosition }),
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: name || normalizedEmail.split('@')[0],
            role: assignedRole,
            position: assignedPosition,
            ...(password && { passwordHash: hashPassword(password) }),
          },
        });
      }

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
      req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
      await new Promise<void>((resolve, reject) =>
        req.session.save((error) => (error ? reject(error) : resolve())),
      );

      const memberships = await prisma.teamMembership.findMany({
        where: { userId: user.id },
        include: { team: true },
      });

      res.json({
        success: true,
        csrfToken: req.session.csrfToken,
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
