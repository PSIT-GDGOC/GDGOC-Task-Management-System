import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { Pagination } from '../schemas/directory';
import { userSummarySelect } from './user.repository';

export const teamSummarySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TeamSelect;

export class TeamRepository {
  static findById(id: string) {
    return prisma.team.findUnique({ where: { id }, select: teamSummarySelect });
  }
  static async list({ page, limit }: Pagination) {
    const [data, total] = await prisma.$transaction([
      prisma.team.findMany({
        select: teamSummarySelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      prisma.team.count(),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  static async members(teamId: string, { page, limit }: Pagination) {
    const where = { teamId };
    const [data, total] = await prisma.$transaction([
      prisma.teamMembership.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          teamId: true,
          isTeamHead: true,
          joinedAt: true,
          user: { select: userSummarySelect },
        },
        orderBy: [{ isTeamHead: 'desc' }, { joinedAt: 'asc' }, { id: 'asc' }],
      }),
      prisma.teamMembership.count({ where }),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
