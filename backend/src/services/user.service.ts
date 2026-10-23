import { Prisma, SystemRole } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { UserRepository, userProfileSelect } from '../repositories/user.repository';
import { Pagination } from '../schemas/directory';
import { AuthenticatedUser } from '../types/auth';
import { isClubManager, managedTeamIds } from '../utils/permissions';

export interface UserFilters extends Pagination {
  search?: string;
  teamId?: string;
  role?: SystemRole;
  isActive?: boolean;
}

export class UserService {
  static async register(actor: AuthenticatedUser, data: { email: string; name: string }) {
    if (!isClubManager(actor)) throw new AppError('Club management permission required', 403);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { ...data, role: 'USER' },
        select: userProfileSelect,
      });
      await tx.adminEvent.create({
        data: {
          actorId: actor.id,
          action: 'MEMBER_REGISTERED',
          resourceId: user.id,
        },
      });
      return user;
    });
  }
  static async profile(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static updateProfile(
    id: string,
    data: { position?: string | null; githubUsername?: string | null },
  ) {
    if (!Object.keys(data).length) throw new AppError('Provide at least one profile field', 400);
    return UserRepository.updateProfile(id, data);
  }

  static list(actor: AuthenticatedUser, filters: UserFilters) {
    const scope = managedTeamIds(actor);
    if (!isClubManager(actor) && !scope.length)
      throw new AppError('Member management permission required', 403);
    if (filters.teamId && !isClubManager(actor) && !scope.includes(filters.teamId)) {
      throw new AppError('You cannot access this team directory', 403);
    }
    const where: Prisma.UserWhereInput = {
      ...(filters.teamId
        ? { teamMemberships: { some: { teamId: filters.teamId } } }
        : !isClubManager(actor)
          ? { teamMemberships: { some: { teamId: { in: scope } } } }
          : {}),
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };
    return UserRepository.list(where, filters);
  }

  static async setActive(actor: AuthenticatedUser, id: string, isActive: boolean) {
    if (!isClubManager(actor)) throw new AppError('Club management permission required', 403);
    return prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) throw new AppError('User not found', 404);
      // Role changes belong to the invitation/ownership workflow, not this endpoint.
      if (
        target.id === actor.id ||
        target.role === 'SYSTEM_OWNER' ||
        target.role === 'PRESIDENT' ||
        target.email === env.SYSTEM_OWNER_EMAIL?.trim().toLowerCase()
      ) {
        throw new AppError('This account cannot be changed through member status management', 403);
      }
      return tx.user.update({
        where: { id, role: { in: ['USER', 'ADMIN'] } },
        data: { isActive },
        select: userProfileSelect,
      });
    });
  }
}
