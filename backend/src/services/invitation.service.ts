import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedUser } from '../types/auth';
import { isClubManager } from '../utils/permissions';
import { userProfileSelect } from '../repositories/user.repository';
import { InvitationFilters, InvitationInput } from '../schemas/invitation';

const publicSelect = {
  id: true,
  intendedRole: true,
  intendedPosition: true,
  intendedEmail: true,
  intendedTeamId: true,
  createdById: true,
  expiresAt: true,
  usedById: true,
  usedAt: true,
  revokedAt: true,
  createdAt: true,
  intendedTeam: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  usedBy: { select: { id: true, name: true } },
} satisfies Prisma.AdminInvitationSelect;
const digest = (code: string) => crypto.createHash('sha256').update(code).digest('hex');
async function current(tx: Prisma.TransactionClient, actor: AuthenticatedUser, management = false) {
  const user = await tx.user.findUnique({ where: { id: actor.id }, select: userProfileSelect });
  if (!user || !user.isActive) throw new AppError('Active account required', 403);
  if (management && !isClubManager(user))
    throw new AppError('Invitation management permission required', 403);
  return user;
}
async function clock(tx: Prisma.TransactionClient) {
  return (await tx.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS "now"`)[0].now;
}
export class InvitationService {
  static create(actor: AuthenticatedUser, input: InvitationInput) {
    return prisma.$transaction(
      async (tx) => {
        const issuer = await current(tx, actor, true);
        if (input.role === 'PRESIDENT' && issuer.role !== 'SYSTEM_OWNER')
          throw new AppError('Only the owner can issue president invitations', 403);
        if (input.teamId && !(await tx.team.findUnique({ where: { id: input.teamId } })))
          throw new AppError('Team not found', 404);
        const now = await clock(tx);
        const rawCode = input.customKey && input.customKey.trim() ? input.customKey.trim() : 'GDGOC-' + (input.position ? input.position.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) : 'LEAD') + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const invitation = await tx.adminInvitation.create({
          data: {
            hashedCode: digest(rawCode),
            intendedRole: input.role,
            intendedPosition: input.position,
            intendedEmail: input.email,
            intendedTeamId: input.teamId,
            createdById: issuer.id,
            createdAt: now,
            expiresAt: new Date(now.getTime() + input.expiresInHours * 3600000),
          },
          select: publicSelect,
        });
        await tx.adminEvent.create({
          data: {
            actorId: issuer.id,
            action: 'INVITATION_CREATED',
            resourceId: invitation.id,
            details: { role: input.role, teamId: input.teamId ?? null },
          },
        });
        return { ...invitation, invitationId: invitation.id, rawCode, status: 'ACTIVE' };
      },
      { isolationLevel: 'Serializable' },
    );
  }
  static async list(actor: AuthenticatedUser, filters: InvitationFilters) {
    return prisma.$transaction(
      async (tx) => {
        const issuer = await current(tx, actor, true);
        const now = await clock(tx);
        const where: Prisma.AdminInvitationWhereInput = {
          ...(issuer.role === 'PRESIDENT' && { intendedRole: 'ADMIN' }),
          ...(filters.status === 'USED' && { usedAt: { not: null } }),
          ...(filters.status === 'REVOKED' && { usedAt: null, revokedAt: { not: null } }),
          ...(filters.status === 'ACTIVE' && {
            usedAt: null,
            revokedAt: null,
            expiresAt: { gt: now },
          }),
          ...(filters.status === 'EXPIRED' && {
            usedAt: null,
            revokedAt: null,
            expiresAt: { lte: now },
          }),
        };
        const data = await tx.adminInvitation.findMany({
          where,
          select: publicSelect,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (filters.page - 1) * filters.limit,
          take: filters.limit,
        });
        const total = await tx.adminInvitation.count({ where });
        return {
          data: data.map((row) => ({
            ...row,
            status: row.usedAt
              ? 'USED'
              : row.revokedAt
                ? 'REVOKED'
                : row.expiresAt <= now
                  ? 'EXPIRED'
                  : 'ACTIVE',
          })),
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit),
          },
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
  static revoke(actor: AuthenticatedUser, id: string) {
    return prisma.$transaction(
      async (tx) => {
        const issuer = await current(tx, actor, true);
        const invite = await tx.adminInvitation.findUnique({ where: { id } });
        if (!invite) throw new AppError('Invitation not found', 404);
        if (invite.intendedRole === 'PRESIDENT' && issuer.role !== 'SYSTEM_OWNER')
          throw new AppError('Only the owner can manage president invitations', 403);
        if (invite.usedAt) throw new AppError('A used invitation cannot be revoked', 409);
        if (!invite.revokedAt) {
          await tx.adminInvitation.update({ where: { id }, data: { revokedAt: await clock(tx) } });
          await tx.adminEvent.create({
            data: { actorId: issuer.id, action: 'INVITATION_REVOKED', resourceId: id },
          });
        }
        return { id, status: 'REVOKED' };
      },
      { isolationLevel: 'Serializable' },
    );
  }
  static redeem(actor: AuthenticatedUser, code: string) {
    return prisma.$transaction(
      async (tx) => {
        const user = await current(tx, actor);
        const invite = await tx.adminInvitation.findUnique({
          where: { hashedCode: digest(code) },
          include: { createdBy: true },
        });
        const now = await clock(tx);
        if (!invite || invite.revokedAt || invite.expiresAt <= now)
          throw new AppError('Invalid, revoked, or expired invitation', 400);
        if (invite.usedAt) throw new AppError('Invitation already used', 409);
        if (invite.intendedEmail && invite.intendedEmail !== user.email)
          throw new AppError('This invitation belongs to another email', 403);
        if (
          !invite.createdBy.isActive ||
          !['SYSTEM_OWNER', 'PRESIDENT'].includes(invite.createdBy.role) ||
          (invite.intendedRole === 'PRESIDENT' && invite.createdBy.role !== 'SYSTEM_OWNER')
        )
          throw new AppError('The issuer no longer has permission to grant this role', 409);
        if (
          user.role === 'SYSTEM_OWNER' ||
          (user.role === 'PRESIDENT' && invite.intendedRole === 'ADMIN')
        )
          throw new AppError('An invitation cannot downgrade club leadership', 403);
        const claimed = await tx.adminInvitation.updateMany({
          where: {
            id: invite.id,
            usedAt: null,
            usedById: null,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          data: { usedAt: now, usedById: user.id },
        });
        if (claimed.count !== 1) throw new AppError('Invitation is no longer available', 409);
        const updated = await tx.user.update({
          where: { id: user.id },
          data: {
            role: invite.intendedRole,
            ...(invite.intendedPosition && { position: invite.intendedPosition }),
          },
          select: userProfileSelect,
        });
        if (invite.intendedTeamId)
          await tx.teamMembership.upsert({
            where: { userId_teamId: { userId: user.id, teamId: invite.intendedTeamId } },
            update: { isTeamHead: true },
            create: { userId: user.id, teamId: invite.intendedTeamId, isTeamHead: true },
          });
        await tx.adminEvent.create({
          data: {
            actorId: user.id,
            action: 'INVITATION_REDEEMED',
            resourceId: invite.id,
            details: { previousRole: user.role, role: invite.intendedRole },
          },
        });
        return updated;
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
