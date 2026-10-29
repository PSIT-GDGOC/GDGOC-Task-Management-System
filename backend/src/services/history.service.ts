import { Prisma } from '@prisma/client';
import { queryCache } from '../cache/query-cache';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { taskSummaryInclude } from '../repositories/task.repository';
import { HistoryFilters, HistoryListFilters } from '../schemas/history';
import { AuthenticatedUser } from '../types/auth';
import { isClubManager, managedTeamIds } from '../utils/permissions';

function predicates(actor: AuthenticatedUser, filters: HistoryFilters, personal: boolean) {
  const where: Prisma.TaskWhereInput = { status: 'DONE', isDeleted: false };
  const sql = [Prisma.sql`t."status" = 'DONE'`, Prisma.sql`NOT t."isDeleted"`];
  if (personal) {
    if (filters.userId && filters.userId !== actor.id)
      throw new AppError('Personal history is limited to your own work', 403);
    where.completedById = actor.id;
    sql.push(Prisma.sql`t."completedById" = ${actor.id}`);
  } else if (!isClubManager(actor)) {
    const teams = managedTeamIds(actor);
    if (!teams.length) throw new AppError('History audit permission required', 403);
    if (filters.teamId && !teams.includes(filters.teamId))
      throw new AppError('You cannot audit this team', 403);
    where.teamId = { in: teams };
    sql.push(Prisma.sql`t."teamId" IN (${Prisma.join(teams)})`);
  }
  if (filters.teamId) {
    where.teamId = filters.teamId;
    sql.push(Prisma.sql`t."teamId" = ${filters.teamId}`);
  }
  if (filters.userId && !personal) {
    where.completedById = filters.userId;
    sql.push(Prisma.sql`t."completedById" = ${filters.userId}`);
  }
  if (filters.from || filters.to)
    where.completedAt = {
      ...(filters.from && { gte: new Date(filters.from) }),
      ...(filters.to && { lt: new Date(filters.to) }),
    };
  if (filters.from) sql.push(Prisma.sql`t."completedAt" >= ${new Date(filters.from)}`);
  if (filters.to) sql.push(Prisma.sql`t."completedAt" < ${new Date(filters.to)}`);
  if (filters.timing) {
    if (filters.timing === 'no-deadline') {
      where.deadline = null;
      sql.push(Prisma.sql`t."deadline" IS NULL`);
    } else {
      where.deadline = { not: null };
      where.isOnTime = filters.timing === 'on-time';
      sql.push(
        Prisma.sql`t."deadline" IS NOT NULL AND t."isOnTime" = ${filters.timing === 'on-time'}`,
      );
    }
  }
  return { where, sql: Prisma.join(sql, ' AND ') };
}
export class HistoryService {
  static async list(actor: AuthenticatedUser, filters: HistoryListFilters, personal: boolean) {
    const { where } = predicates(actor, filters, personal);
    const { page, limit } = filters;
    const [data, total] = await prisma.$transaction(
      [
        prisma.task.findMany({
          where,
          include: {
            ...taskSummaryInclude,
            activities: {
              orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
              take: 50,
              select: { id: true, action: true, timestamp: true, details: true },
            },
            completedBy: { select: { id: true, name: true } },
            approvedBy: { select: { id: true, name: true } },
          },
          orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.task.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    );
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  static statistics(actor: AuthenticatedUser, filters: HistoryFilters, personal: boolean) {
    const { sql } = predicates(actor, filters, personal);
    return queryCache.remember(
      ['history', actor.id, actor.role, actor.teamMemberships, filters, personal],
      () =>
        prisma.$transaction(
          async (tx) => {
            const [totals] = await tx.$queryRaw<
              Array<{
                totalCompleted: number;
                onTime: number;
                late: number;
                noDeadline: number;
                averageLeadTimeHours: number | null;
              }>
            >`
        SELECT COUNT(*)::int AS "totalCompleted",
          COUNT(*) FILTER (WHERE t."deadline" IS NOT NULL AND t."isOnTime")::int AS "onTime",
          COUNT(*) FILTER (WHERE t."deadline" IS NOT NULL AND NOT t."isOnTime")::int AS "late",
          COUNT(*) FILTER (WHERE t."deadline" IS NULL)::int AS "noDeadline",
          (AVG(EXTRACT(EPOCH FROM (t."completedAt" - t."createdAt"))) / 3600)::float8 AS "averageLeadTimeHours"
        FROM "Task" t WHERE ${sql}`;
            const byTeam = await tx.$queryRaw<
              Array<{ teamId: string | null; name: string; completed: number }>
            >`
        SELECT t."teamId", COALESCE(team.name, 'Whole Club') AS name, COUNT(*)::int AS completed
        FROM "Task" t LEFT JOIN "Team" team ON team.id = t."teamId" WHERE ${sql}
        GROUP BY t."teamId", team.name ORDER BY completed DESC, name ASC`;
            const topContributors = personal
              ? undefined
              : await tx.$queryRaw<Array<{ userId: string; name: string; completed: number }>>`
        SELECT t."completedById" AS "userId", u.name, COUNT(*)::int AS completed
        FROM "Task" t JOIN "User" u ON u.id = t."completedById" WHERE ${sql}
        GROUP BY t."completedById", u.name ORDER BY completed DESC, u.name ASC, t."completedById" ASC LIMIT 10`;
            const rated = totals.onTime + totals.late;
            return {
              ...totals,
              onTimeRate: rated ? Math.round((totals.onTime / rated) * 10000) / 100 : null,
              byTeam,
              ...(topContributors && { topContributors }),
            };
          },
          { isolationLevel: 'RepeatableRead' },
        ),
    );
  }
}
