import { prisma } from '../lib/prisma';
import { TaskStatus, TaskScope, Prisma } from '@prisma/client';

export class TaskRepository {
  static async findActiveTasks(filters: {
    teamId?: string;
    assigneeId?: string;
    scope?: TaskScope;
    status?: TaskStatus;
    search?: string;
  }) {
    const where: Prisma.TaskWhereInput = {
      isDeleted: false,
    };

    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.scope) where.scope = filters.scope;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, slug: true } },
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true, githubUsername: true } },
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  static async findTaskById(id: string) {
    return prisma.task.findUnique({
      where: { id, isDeleted: false },
      include: {
        team: true,
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true, githubUsername: true } },
        completedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        activities: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { timestamp: 'desc' },
        },
        submissions: {
          include: {
            member: { select: { id: true, name: true } },
            reviewer: { select: { id: true, name: true } },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
  }
}
