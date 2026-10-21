import crypto from 'crypto';
import { SystemRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  /**
   * Helper: Hash an invitation code using SHA-256
   * Never store raw invitation codes in database!
   */
  static hashInvitationCode(code: string): string {
    return crypto.createHash('sha256').update(code.trim()).digest('hex');
  }

  /**
   * Helper: Resolve user role based on verified email and server bootstrap config
   */
  static resolveInitialRole(email: string): SystemRole {
    const normalizedEmail = email.toLowerCase().trim();
    const systemOwnerEmail = env.SYSTEM_OWNER_EMAIL?.toLowerCase().trim();

    if (systemOwnerEmail && normalizedEmail === systemOwnerEmail) {
      return SystemRole.SYSTEM_OWNER;
    }

    return SystemRole.USER;
  }

  /**
   * Handle verified Google User Profile
   * Called strictly after server-side Google token verification
   */
  static async handleVerifiedGoogleUser(googleUser: {
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    const normalizedEmail = googleUser.email.toLowerCase().trim();
    const defaultRole = this.resolveInitialRole(normalizedEmail);

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: googleUser.name,
          avatarUrl: googleUser.avatarUrl,
          role: defaultRole,
        },
      });
    } else {
      // If user exists and email matches SYSTEM_OWNER_EMAIL, guarantee SYSTEM_OWNER role
      if (defaultRole === SystemRole.SYSTEM_OWNER && user.role !== SystemRole.SYSTEM_OWNER) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: SystemRole.SYSTEM_OWNER },
        });
      }
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
    }

    return user;
  }

  /**
   * Create an Admin Invitation code (System Owner & President only)
   * Generates a secure random token, hashes it, stores hash + expiration
   */
  static async createAdminInvitation(issuerId: string, options: {
    role?: SystemRole;
    position?: string;
    teamId?: string;
    expiresInHours?: number;
  }) {
    // Generate 32-byte secure random string
    const rawCode = `inv_${crypto.randomBytes(24).toString('base64url')}`;
    const hashedCode = this.hashInvitationCode(rawCode);

    const expiresInHours = options.expiresInHours ?? 48; // default 48h expiration
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invitation = await prisma.adminInvitation.create({
      data: {
        hashedCode,
        intendedRole: options.role ?? SystemRole.ADMIN,
        intendedPosition: options.position,
        intendedTeamId: options.teamId,
        createdById: issuerId,
        expiresAt,
      },
    });

    return {
      invitationId: invitation.id,
      rawCode, // Returned ONLY ONCE to the issuer; never stored in plaintext
      expiresAt,
    };
  }

  /**
   * Redeem Admin Invitation Code
   * Atomic single-use redemption with rate-limiting & hash lookup
   */
  static async redeemAdminInvitation(userId: string, rawCode: string) {
    const hashedCode = this.hashInvitationCode(rawCode);
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const invitation = await tx.adminInvitation.findUnique({
        where: { hashedCode },
      });

      if (!invitation) {
        throw new AppError('Invalid or expired invitation code', 400);
      }

      if (invitation.usedAt || invitation.usedById) {
        throw new AppError('This invitation code has already been redeemed', 409);
      }

      if (invitation.revokedAt) {
        throw new AppError('This invitation code has been revoked', 400);
      }

      if (now > invitation.expiresAt) {
        throw new AppError('This invitation code has expired', 400);
      }

      // Mark invitation as redeemed
      await tx.adminInvitation.update({
        where: { id: invitation.id },
        data: {
          usedById: userId,
          usedAt: now,
        },
      });

      // Promote user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          role: invitation.intendedRole,
          ...(invitation.intendedPosition && { position: invitation.intendedPosition }),
        },
      });

      // If invitation was scoped to a team, add team membership
      if (invitation.intendedTeamId) {
        await tx.teamMembership.upsert({
          where: {
            userId_teamId: {
              userId,
              teamId: invitation.intendedTeamId,
            },
          },
          update: { isTeamHead: true },
          create: {
            userId,
            teamId: invitation.intendedTeamId,
            isTeamHead: true,
          },
        });
      }

      return updatedUser;
    });
  }
}
