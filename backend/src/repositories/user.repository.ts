import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { Pagination } from '../schemas/directory';

export const userSummarySelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  position: true,
  githubUsername: true,
  isActive: true,
} satisfies Prisma.UserSelect;

export const userProfileSelect = {
  ...userSummarySelect,
  teamMemberships: {
    select: {
      teamId: true,
      isTeamHead: true,
      joinedAt: true,
      team: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { joinedAt: 'asc' },
  },
} satisfies Prisma.UserSelect;

export class UserRepository {
  static findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: userProfileSelect });
  }

  static async list(where: Prisma.UserWhereInput, { page, limit }: Pagination) {
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: userProfileSelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      prisma.user.count({ where }),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static updateProfile(
    id: string,
    data: { position?: string | null; githubUsername?: string | null },
  ) {
    return prisma.user.update({ where: { id }, data, select: userProfileSelect });
  }
}
