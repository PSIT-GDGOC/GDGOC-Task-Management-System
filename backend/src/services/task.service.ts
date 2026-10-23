import { PrismaClient, TaskStatus, TaskPriority, TaskScope, TaskAction, SubmissionOutcome, SystemRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateTaskDTO {
  title: string;
  description: string;
  priority?: TaskPriority;
  scope?: TaskScope;
  teamId?: string | null;
  deadline?: string | null;
  tags?: string[];
  assigneeId?: string | null;
}

export interface SubmitTaskReviewDTO {
  note?: string;
  prUrl: string;
}

export interface ReviewTaskDTO {
  outcome: SubmissionOutcome;
  reviewComment?: string;
}

export class TaskService {
  static async getMemberHistory(userId: string) {
    return prisma.task.findMany({
      where: { isDeleted: false, OR: [{ assigneeId: userId }, { activities: { some: { actorId: userId } } }, { submissions: { some: { memberId: userId } } }] },
      include: {
        team: { select: { id: true, name: true } },
        activities: { where: { OR: [{ actorId: userId }, { action: { in: [TaskAction.ASSIGNED, TaskAction.APPROVED, TaskAction.SENT_BACK] } }] }, orderBy: { timestamp: 'desc' } },
        submissions: { where: { memberId: userId }, orderBy: { submittedAt: 'desc' }, include: { reviewer: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
  /**
   * List tasks with filters (board columns, team, assignee, search)
   */
  static async listTasks(filters: {
    teamId?: string;
    assigneeId?: string;
    scope?: TaskScope;
    status?: TaskStatus;
    search?: string;
  }) {
    const where: any = {
      isDeleted: false,
    };

    if (filters.teamId) {
      where.teamId = filters.teamId;
    }
    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }
    if (filters.scope) {
      where.scope = filters.scope;
    }
    if (filters.status) {
      where.status = filters.status;
    }
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

  /**
   * Get single task with full activity timeline and submissions
   */
  static async getTaskById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
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

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  /**
   * Create task - requires Admin or Team Head permissions
   * Wrapped in a transaction with activity log creation
   */
  static async createTask(data: CreateTaskDTO, actorId: string) {
    const scope = data.scope ?? (data.teamId ? TaskScope.TEAM : TaskScope.WHOLE_CLUB);

    // If scope is TEAM, teamId must exist
    if (scope === TaskScope.TEAM && !data.teamId) {
      throw new AppError('A teamId must be provided for team-scoped tasks', 400);
    }

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority ?? TaskPriority.MEDIUM,
          scope,
          teamId: scope === TaskScope.WHOLE_CLUB ? null : data.teamId,
          creatorId: actorId,
          assigneeId: data.assigneeId || null,
          status: data.assigneeId ? TaskStatus.ASSIGNED : TaskStatus.FREE,
          deadline: data.deadline ? new Date(data.deadline) : null,
          tags: data.tags ?? [],
        },
      });

      await tx.taskActivity.create({
        data: {
          taskId: newTask.id,
          actorId,
          action: TaskAction.CREATED,
          newValue: newTask.status,
          details: { title: newTask.title, scope: newTask.scope, priority: newTask.priority },
        },
      });
      if (newTask.assigneeId) {
        await tx.taskActivity.create({
          data: {
            taskId: newTask.id,
            actorId,
            action: TaskAction.ASSIGNED,
            newValue: TaskStatus.ASSIGNED,
            details: { assigneeId: newTask.assigneeId },
          },
        });
      }

      return newTask;
    });

    return task;
  }

  /**
   * Atomic Claim Task:
   * Prevents double-claiming concurrency races.
   * Checks team scope eligibility. Loser receives HTTP 409 Conflict.
   */
  static async claimTask(taskId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId, isDeleted: false },
      });

      if (!task) {
        throw new AppError('Task not found', 404);
      }

      if (task.status !== TaskStatus.FREE) {
        throw new AppError('Task is no longer free to claim', 409);
      }

      // Check team membership for TEAM scoped tasks
      if (task.scope === TaskScope.TEAM && task.teamId) {
        const membership = await tx.teamMembership.findUnique({
          where: {
            userId_teamId: {
              userId,
              teamId: task.teamId,
            },
          },
        });

        if (!membership) {
          throw new AppError('Forbidden: You must be a member of this team to claim this task', 403);
        }
      }

      // Atomic update with status condition in the where clause
      const updateResult = await tx.task.updateMany({
        where: {
          id: taskId,
          status: TaskStatus.FREE,
          isDeleted: false,
        },
        data: {
          status: TaskStatus.ASSIGNED,
          assigneeId: userId,
        },
      });

      if (updateResult.count === 0) {
        throw new AppError('Conflict: Task was claimed by another member simultaneously', 409);
      }

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId: userId,
          action: TaskAction.CLAIMED,
          oldValue: TaskStatus.FREE,
          newValue: TaskStatus.ASSIGNED,
          details: { message: 'Task claimed by member' },
        },
      });

      return tx.task.findUnique({
        where: { id: taskId },
        include: { assignee: true, team: true },
      });
    });
  }

  /**
   * Move task status by assignee (e.g., ASSIGNED -> IN_PROGRESS)
   */
  static async startTask(taskId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId, isDeleted: false },
      });

      if (!task) throw new AppError('Task not found', 404);
      if (task.assigneeId !== userId) {
        throw new AppError('Only the assigned member can transition this task', 403);
      }
      if (task.status !== TaskStatus.ASSIGNED) {
        throw new AppError(`Cannot start task in status ${task.status}. Must be ASSIGNED.`, 400);
      }

      const updated = await tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId: userId,
          action: TaskAction.MOVED_STATUS,
          oldValue: TaskStatus.ASSIGNED,
          newValue: TaskStatus.IN_PROGRESS,
        },
      });

      return updated;
    });
  }

  /**
   * Submit completed work for review: IN_PROGRESS -> IN_REVIEW
   * Requires PR URL and optional note
   */
  static async submitForReview(taskId: string, userId: string, submission: SubmitTaskReviewDTO) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId, isDeleted: false },
      });

      if (!task) throw new AppError('Task not found', 404);
      if (task.assigneeId !== userId) {
        throw new AppError('Only the assigned member can submit this task for review', 403);
      }
      if (task.status !== TaskStatus.IN_PROGRESS) {
        throw new AppError(`Cannot submit task from status ${task.status}. Must be IN_PROGRESS.`, 400);
      }

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_REVIEW },
      });

      await tx.taskSubmission.create({
        data: {
          taskId,
          memberId: userId,
          prUrl: submission.prUrl,
          note: submission.note,
        },
      });

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId: userId,
          action: TaskAction.SUBMITTED_FOR_REVIEW,
          oldValue: TaskStatus.IN_PROGRESS,
          newValue: TaskStatus.IN_REVIEW,
          details: { prUrl: submission.prUrl, note: submission.note },
        },
      });

      return updatedTask;
    });
  }

  /**
   * Admin Review: Approve (-> DONE) or Send Back (-> IN_PROGRESS)
   */
  static async reviewTask(taskId: string, reviewerId: string, review: ReviewTaskDTO) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId, isDeleted: false },
      });

      if (!task) throw new AppError('Task not found', 404);
      if (task.status !== TaskStatus.IN_REVIEW) {
        throw new AppError(`Cannot review a task that is not in IN_REVIEW status.`, 400);
      }

      const isApproval = review.outcome === SubmissionOutcome.APPROVED;
      const newStatus = isApproval ? TaskStatus.DONE : TaskStatus.IN_PROGRESS;
      const now = new Date();
      const isOnTime = task.deadline ? now <= task.deadline : true;

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          ...(isApproval && {
            completedAt: now,
            completedById: task.assigneeId,
            approvedById: reviewerId,
            isOnTime,
          }),
        },
      });

      // Update the latest pending submission record
      const latestSubmission = await tx.taskSubmission.findFirst({
        where: { taskId, outcome: null },
        orderBy: { submittedAt: 'desc' },
      });

      if (latestSubmission) {
        await tx.taskSubmission.update({
          where: { id: latestSubmission.id },
          data: {
            reviewerId,
            reviewComment: review.reviewComment,
            outcome: review.outcome,
            reviewedAt: now,
          },
        });
      }

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId: reviewerId,
          action: isApproval ? TaskAction.APPROVED : TaskAction.SENT_BACK,
          oldValue: TaskStatus.IN_REVIEW,
          newValue: newStatus,
          details: { comment: review.reviewComment, outcome: review.outcome },
        },
      });

      return updatedTask;
    });
  }

  /**
   * Soft delete task
   */
  static async deleteTask(taskId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId, isDeleted: false },
      });

      if (!task) throw new AppError('Task not found', 404);

      const deleted = await tx.task.update({
        where: { id: taskId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      await tx.taskActivity.create({
        data: {
          taskId,
          actorId,
          action: TaskAction.DELETED,
          details: { reason: 'Soft deleted by authorized admin' },
        },
      });

      return deleted;
    });
  }
}
