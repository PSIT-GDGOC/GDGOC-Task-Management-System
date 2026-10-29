import crypto from 'node:crypto';
import { Prisma, SystemRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { userProfileSelect } from '../repositories/user.repository';

export const passwordLoginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    name: z.string().trim().min(2).max(100).optional(),
    password: z.string().max(128).optional(),
    role: z.nativeEnum(SystemRole).optional(),
    position: z.string().trim().max(100).optional(),
    teamSlug: z.string().trim().toLowerCase().max(100).optional(),
    isTeamHead: z.boolean().optional(),
    invitationKey: z.string().trim().max(200).optional(),
    isSignUp: z.boolean().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.isSignUp && (!input.name || input.name.includes('@')))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['name'],
        message: 'Your name is required for sign up. Enter your name rather than an email address.',
      });
  });

type LoginInput = z.infer<typeof passwordLoginSchema>;
const digest = (code: string) => crypto.createHash('sha256').update(code).digest('hex');
function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password: string, stored: string) {
  const match = /^([a-f0-9]{32}):([a-f0-9]{128})$/.exec(stored);
  return Boolean(
    match &&
    crypto.timingSafeEqual(Buffer.from(match[2], 'hex'), crypto.scryptSync(password, match[1], 64)),
  );
}

/** Sign-in reads permissions; only validated signup grants new memberships. */
export async function passwordLogin(input: LoginInput) {
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: input.email } });
      if (existing && !existing.isActive)
        throw new AppError('Your account has been deactivated', 403);
      if (!input.isSignUp) {
        if (!existing)
          throw new AppError('No account found with this email. Please sign up first.', 404);
        if (
          !input.password ||
          !existing.passwordHash ||
          !verifyPassword(input.password, existing.passwordHash)
        ) {
          throw new AppError(
            'Incorrect password or password sign-in is unavailable. Use Google sign-in for accounts without a password.',
            401,
          );
        }
        const isSuperAdmin =
          existing.role === SystemRole.SYSTEM_OWNER ||
          existing.role === SystemRole.ADMIN ||
          ['president', 'vice president', 'secretary', 'organizer', 'system owner', 'super admin', 'admin'].includes(
            (existing.position || '').trim().toLowerCase(),
          );

        if (isSuperAdmin) {
          // Ensure any legacy or accidental squad memberships are purged for super admins
          await tx.teamMembership.deleteMany({ where: { userId: existing.id } });
        }

        return tx.user.findUniqueOrThrow({ where: { id: existing.id }, select: userProfileSelect });
      }
      if (existing)
        throw new AppError(
          'An account with this email already exists. Please sign in instead.',
          409,
        );
      if (!input.password || input.password.length < 6)
        throw new AppError('Password must be at least 6 characters.', 400);
      if (input.email === env.SYSTEM_OWNER_EMAIL)
        throw new AppError('The system owner must use verified Google sign-in.', 403);

      let role: SystemRole = SystemRole.USER;
      let position = 'Team Member';
      let teamSlug = input.teamSlug;
      let isTeamHead = false;
      let invitation: Prisma.AdminInvitationGetPayload<{
        include: { createdBy: true; intendedTeam: true };
      }> | null = null;
      const requestedLeadership = Boolean(
        (input.role && input.role !== 'USER') ||
        input.isTeamHead ||
        (input.position && !['member', 'team member'].includes(input.position.toLowerCase())),
      );
      if (requestedLeadership && !input.invitationKey)
        throw new AppError('A leadership invitation key is required.', 400);
      if (!env.ALLOW_SELF_REGISTRATION && !input.invitationKey)
        throw new AppError(
          'Self registration is disabled. Ask a club administrator for an invitation.',
          403,
        );

      if (input.invitationKey) {
        const key = input.invitationKey.toUpperCase();
        const roleKey = await tx.roleKey.findFirst({
          where: { keyCode: { equals: key, mode: 'insensitive' } },
        });
        if (roleKey) {
          if (input.position && input.position.toLowerCase() !== roleKey.position.toLowerCase())
            throw new AppError('Leadership key does not match the requested position.', 400);
          if (roleKey.teamSlug && teamSlug && teamSlug !== roleKey.teamSlug)
            throw new AppError('Leadership key does not match the selected team.', 400);
          role = SystemRole.ADMIN;
          position = roleKey.position;
          teamSlug = roleKey.teamSlug ?? undefined;
          isTeamHead = Boolean(roleKey.teamSlug);
        } else {
          invitation = await tx.adminInvitation.findFirst({
            where: { hashedCode: { in: [digest(input.invitationKey), digest(key)] } },
            include: { createdBy: true, intendedTeam: true },
          });
          if (
            !invitation ||
            invitation.revokedAt ||
            invitation.usedAt ||
            invitation.expiresAt <= new Date()
          )
            throw new AppError('Invalid or expired leadership invitation.', 400);
          if (invitation.intendedEmail && invitation.intendedEmail !== input.email)
            throw new AppError('This invitation belongs to another email.', 403);
          if (
            !invitation.createdBy.isActive ||
            !['SYSTEM_OWNER', 'PRESIDENT'].includes(invitation.createdBy.role) ||
            (invitation.intendedRole === 'PRESIDENT' &&
              invitation.createdBy.role !== 'SYSTEM_OWNER')
          )
            throw new AppError('The invitation issuer can no longer grant this role.', 403);
          if (invitation.intendedTeam && teamSlug && invitation.intendedTeam.slug !== teamSlug)
            throw new AppError('Invitation does not match the selected team.', 400);
          role = invitation.intendedRole;
          position = invitation.intendedPosition || 'Team Member';
          teamSlug = invitation.intendedTeam?.slug ?? undefined;
          isTeamHead = Boolean(invitation.intendedTeamId);
        }
      }

      const isSuperAdminRole =
        role === SystemRole.SYSTEM_OWNER ||
        role === SystemRole.ADMIN ||
        ['president', 'vice president', 'secretary', 'organizer', 'system owner', 'super admin', 'admin'].includes(
          position.trim().toLowerCase(),
        );

      if (isSuperAdminRole) {
        teamSlug = undefined;
        isTeamHead = false;
      }

      const team = teamSlug ? await tx.team.findUnique({ where: { slug: teamSlug } }) : null;
      if (teamSlug && !team) throw new AppError('Selected team not found.', 400);
      if (['President', 'Vice President', 'Secretary', 'Organizer'].includes(position)) {
        if (
          await tx.user.findFirst({
            where: { position: { equals: position, mode: 'insensitive' }, isActive: true },
          })
        )
          throw new AppError(`Only one ${position} is allowed.`, 409);
      }
      if (
        team &&
        isTeamHead &&
        (await tx.teamMembership.findFirst({
          where: { teamId: team.id, isTeamHead: true, user: { isActive: true } },
        }))
      )
        throw new AppError('This team already has an active Team Lead.', 409);
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name!,
          passwordHash: hashPassword(input.password),
          role,
          position,
        },
      });
      if (team && !isSuperAdminRole)
        await tx.teamMembership.create({ data: { userId: user.id, teamId: team.id, isTeamHead } });
      if (invitation) {
        const claimed = await tx.adminInvitation.updateMany({
          where: {
            id: invitation.id,
            usedAt: null,
            usedById: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { usedAt: new Date(), usedById: user.id },
        });
        if (claimed.count !== 1) throw new AppError('Invitation is no longer available.', 409);
        await tx.adminEvent.create({
          data: {
            actorId: user.id,
            action: 'INVITATION_REDEEMED',
            resourceId: invitation.id,
            details: { role },
          },
        });
      }
      return tx.user.findUniqueOrThrow({ where: { id: user.id }, select: userProfileSelect });
    },
    { isolationLevel: 'Serializable' },
  );
}
