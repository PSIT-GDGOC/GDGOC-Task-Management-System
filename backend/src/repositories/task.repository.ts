import { Prisma, Task } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { Pagination } from '../schemas/directory';
import { AppError } from '../middleware/errorHandler';

const userSelect = { id: true, name: true, email: true, githubUsername: true };
export const taskSummaryInclude = {
  team: { select: { id: true, name: true, slug: true } },
  creator: { select: userSelect },
  assignee: { select: userSelect },
  submissions: { orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }], take: 1 },
} satisfies Prisma.TaskInclude;

export class TaskRepository {
  static async findActiveTasks(where: Prisma.TaskWhereInput, { page, limit }: Pagination) {
    const [data, total] = await prisma.$transaction(
      [
        prisma.task.findMany({
          where,
          include: taskSummaryInclude,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
        prisma.task.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return {
      data,
      count: data.length,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static findTaskById(id: string) {
    return prisma.task.findUnique({
      where: { id, isDeleted: false },
      include: {
        ...taskSummaryInclude,
        completedBy: { select: userSelect },
        approvedBy: { select: userSelect },
        activities: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
        },
        submissions: {
          include: { member: { select: userSelect }, reviewer: { select: userSelect } },
          orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
        },
      },
    });
  }

  static async active(tx: Prisma.TransactionClient, id: string) {
    const task = await tx.task.findUnique({ where: { id, isDeleted: false } });
    if (!task) throw new AppError('Task not found', 404);
    return task;
  }

  /** The state guard and transaction ensure actions never overwrite a concurrent transition. */
  static async update(
    tx: Prisma.TransactionClient,
    task: Task,
    data: Prisma.TaskUncheckedUpdateManyInput,
  ) {
    const changed = await tx.task.updateMany({
      where: {
        id: task.id,
        status: task.status,
        assigneeId: task.assigneeId,
        isDeleted: false,
      },
      data,
    });
    if (!changed.count) throw new AppError('Task changed; refresh before trying again', 409);
  }

  static summary(tx: Prisma.TransactionClient, id: string) {
    return tx.task.findUniqueOrThrow({ where: { id }, include: taskSummaryInclude });
  }
}
