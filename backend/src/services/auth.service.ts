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
    subject: string;
    authoritativeEmail: boolean;
  }) {
    const email = googleUser.email.toLowerCase().trim();
    return prisma.$transaction(
      async (tx) => {
        let user = await tx.user.findUnique({ where: { googleSubject: googleUser.subject } });
        if (!user) {
          user = await tx.user.findUnique({ where: { email } });
          if (user?.googleSubject && user.googleSubject !== googleUser.subject)
            throw new AppError('This email is linked to a different Google identity', 409);
          if (user && !googleUser.authoritativeEmail)
            throw new AppError(
              'An administrator must verify this existing account before linking it',
              409,
            );
        }
        if (user && !user.isActive) throw new AppError('Your account has been deactivated', 403);
        const role = this.resolveInitialRole(email);
        const identity = {
          email,
          name: googleUser.name,
          avatarUrl: googleUser.avatarUrl,
          googleSubject: googleUser.subject,
        };
        return user
          ? tx.user.update({
              where: { id: user.id },
              data: { ...identity, ...(role === 'SYSTEM_OWNER' && { role }) },
            })
          : tx.user.create({ data: { ...identity, role } });
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
