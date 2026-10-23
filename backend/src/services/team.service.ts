import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { TeamRepository, teamSummarySelect } from '../repositories/team.repository';
import { userSummarySelect } from '../repositories/user.repository';
import { Pagination } from '../schemas/directory';
import { AuthenticatedUser } from '../types/auth';
import { canManageTeam, canViewTeam, isClubManager } from '../utils/permissions';

interface TeamInput {
  name: string;
  slug: string;
  description?: string | null;
}

export class TeamService {
  static list(pagination: Pagination) {
    return TeamRepository.list(pagination);
  }

  static async get(teamId: string) {
    const team = await TeamRepository.findById(teamId);
    if (!team) throw new AppError('Team not found', 404);
    return team;
  }

  static create(actor: AuthenticatedUser, data: TeamInput) {
    if (!isClubManager(actor)) throw new AppError('Only club managers can create teams', 403);
    return prisma.team.create({ data, select: teamSummarySelect });
  }

  static async update(actor: AuthenticatedUser, teamId: string, data: Partial<TeamInput>) {
    if (!isClubManager(actor)) throw new AppError('Only club managers can edit teams', 403);
    if (!Object.keys(data).length) throw new AppError('Provide at least one team field', 400);
    await this.get(teamId);
    return prisma.team.update({ where: { id: teamId }, data, select: teamSummarySelect });
  }

  static async members(actor: AuthenticatedUser, teamId: string, pagination: Pagination) {
    if (!canViewTeam(actor, teamId)) throw new AppError('You cannot view this team roster', 403);
    await this.get(teamId);
    return TeamRepository.members(teamId, pagination);
  }

  static async setMembership(
    actor: AuthenticatedUser,
    teamId: string,
    userId: string,
    isTeamHead?: boolean,
  ) {
    if (!canManageTeam(actor, teamId)) throw new AppError('You cannot manage this team', 403);
    if (!isClubManager(actor) && isTeamHead !== undefined)
      throw new AppError('Only club managers can appoint or remove team heads', 403);
    return prisma.$transaction(
      async (tx) => {
        const team = await tx.team.findUnique({ where: { id: teamId } });
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!team || !user) throw new AppError('Team or user not found', 404);
        if (!user.isActive) throw new AppError('Cannot add an inactive account to a team', 409);
        const existing = await tx.teamMembership.findUnique({
          where: { userId_teamId: { userId, teamId } },
        });
        if (!isClubManager(actor) && (existing?.isTeamHead || user.role !== 'USER')) {
          throw new AppError('Only club managers can change privileged memberships', 403);
        }
        return tx.teamMembership.upsert({
          where: { userId_teamId: { userId, teamId } },
          update: isTeamHead === undefined ? {} : { isTeamHead },
          create: { userId, teamId, isTeamHead: isTeamHead ?? false },
          include: { user: { select: userSummarySelect } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  static async removeMembership(actor: AuthenticatedUser, teamId: string, userId: string) {
    if (!canManageTeam(actor, teamId)) throw new AppError('You cannot manage this team', 403);
    return prisma.$transaction(
      async (tx) => {
        const membership = await tx.teamMembership.findUnique({
          where: { userId_teamId: { userId, teamId } },
          include: { user: true },
        });
        if (!membership) throw new AppError('Membership not found', 404);
        if (!isClubManager(actor) && (membership.isTeamHead || membership.user.role !== 'USER')) {
          throw new AppError('Only club managers can remove privileged memberships', 403);
        }
        const activeTasks = await tx.task.count({
          where: {
            teamId,
            assigneeId: userId,
            isDeleted: false,
            status: { not: 'DONE' },
          },
        });
        if (activeTasks)
          throw new AppError('Reassign active team tasks before removing this member', 409);
        await tx.teamMembership.delete({ where: { id: membership.id } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
