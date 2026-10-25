import { Prisma, Task, TaskAction, TaskScope, TaskStatus } from '@prisma/client';
import { queryCache } from '../cache/query-cache';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { TaskRepository, taskSummaryInclude } from '../repositories/task.repository';
import { userProfileSelect } from '../repositories/user.repository';
import { EmailService } from './email.service';
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  SubmissionInput,
  ReviewInput,
} from '../schemas/task';
import { AuthenticatedUser } from '../types/auth';
import { canManageTeam, canViewTeam, isClubManager } from '../utils/permissions';

function assertVisible(actor: AuthenticatedUser, task: Pick<Task, 'scope' | 'teamId'>) {
  if (task.scope === TaskScope.TEAM && (!task.teamId || !canViewTeam(actor, task.teamId))) {
    throw new AppError('You cannot view this task', 403);
  }
}
function assertManager(actor: AuthenticatedUser, task: Pick<Task, 'scope' | 'teamId'>) {
  if (
    task.scope === TaskScope.WHOLE_CLUB
      ? !isClubManager(actor)
      : !task.teamId || !canManageTeam(actor, task.teamId)
  ) {
    throw new AppError('You cannot manage tasks in this scope', 403);
  }
}
function assertEditable(task: Task) {
  if (task.status === TaskStatus.IN_REVIEW || task.status === TaskStatus.DONE) {
    throw new AppError('Tasks in review or done cannot be edited, reassigned, or deleted', 409);
  }
}
async function eligible(tx: Prisma.TransactionClient, id: string, teamId: string | null) {
  const user = await tx.user.findUnique({ where: { id }, select: userProfileSelect });
  if (!user) throw new AppError('Assignee not found', 404);
  if (!user.isActive || (teamId && !user.teamMemberships.some((m) => m.teamId === teamId))) {
    throw new AppError('Assignee must be active and eligible for this team', 400);
  }
}
async function log(
  tx: Prisma.TransactionClient,
  taskId: string,
  actorId: string,
  action: TaskAction,
  oldValue: string | null,
  newValue: string | null,
  details?: Prisma.InputJsonValue,
) {
  await tx.taskActivity.create({ data: { taskId, actorId, action, oldValue, newValue, details } });
}

async function notifyUser(
  tx: Prisma.TransactionClient,
  userId: string,
  taskId: string,
  kind: string,
) {
  try {
    await tx.notification.upsert({
      where: {
        userId_taskId_kind: {
          userId,
          taskId,
          kind,
        },
      },
      update: { readAt: null, createdAt: new Date() },
      create: {
        userId,
        taskId,
        kind,
      },
    });
  } catch (err) {
    console.error('[TaskService] Notification creation error:', err);
  }
}

export class TaskService {
  /** Refresh grants inside the transaction, including membership eligibility used by writes. */
  private static mutate<T>(
    actor: AuthenticatedUser,
    action: (tx: Prisma.TransactionClient, current: AuthenticatedUser) => Promise<T>,
  ) {
    const result = prisma.$transaction(
      async (tx) => {
        const current = await tx.user.findUnique({
          where: { id: actor.id },
          select: userProfileSelect,
        });
        if (!current) throw new AppError('Authentication required', 401);
        if (!current.isActive) throw new AppError('Your account has been deactivated', 403);
        return action(tx, current);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return result.then(async (value) => {
      await queryCache.invalidate();
      return value;
    });
  }

  static listTasks(filters: TaskFilters, actor: AuthenticatedUser) {
    const where: Prisma.TaskWhereInput = {
      isDeleted: false,
      ...(!isClubManager(actor) && {
        AND: [
          {
            OR: [
              { scope: TaskScope.WHOLE_CLUB },
              { scope: TaskScope.TEAM, teamId: { in: actor.teamMemberships.map((m) => m.teamId) } },
            ],
          },
        ],
      }),
      ...(filters.teamId && { teamId: filters.teamId }),
      ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
      ...(filters.scope && { scope: filters.scope }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.tag && { tags: { has: filters.tag } }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };
    return queryCache.remember(
      ['board', actor.id, actor.role, actor.teamMemberships, filters],
      () => TaskRepository.findActiveTasks(where, filters),
    );
  }

  static async getTaskById(id: string, actor: AuthenticatedUser) {
    const task = await TaskRepository.findTaskById(id);
    if (!task) throw new AppError('Task not found', 404);
    assertVisible(actor, task);
    return task;
  }

  static createTask(data: CreateTaskInput, actor: AuthenticatedUser) {
    return this.mutate(actor, async (tx, current) => {
      const scope = data.scope ?? (data.teamId ? TaskScope.TEAM : TaskScope.WHOLE_CLUB);
      const teamId = data.teamId ?? null;
      if ((scope === TaskScope.TEAM) !== Boolean(teamId))
        throw new AppError('Team scope requires a teamId; club scope requires no teamId', 400);
      assertManager(current, { scope, teamId });
      if (teamId && !(await tx.team.findUnique({ where: { id: teamId } })))
        throw new AppError('Team not found', 404);
      if (data.assigneeId) await eligible(tx, data.assigneeId, teamId);
      const task = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          scope,
          teamId,
          creatorId: current.id,
          assigneeId: data.assigneeId ?? null,
          status: data.assigneeId ? TaskStatus.ASSIGNED : TaskStatus.FREE,
          deadline: data.deadline ? new Date(data.deadline) : null,
          tags: data.tags ?? [],
        },
        include: taskSummaryInclude,
      });
      await log(tx, task.id, current.id, TaskAction.CREATED, null, task.status, {
        title: task.title,
        scope,
        teamId,
        assigneeId: task.assigneeId,
      });
      if (task.assigneeId) {
        await notifyUser(tx, task.assigneeId, task.id, 'TASK_ASSIGNED');
        const assignee = await tx.user.findUnique({
          where: { id: task.assigneeId },
          select: { name: true, email: true },
        });
        if (assignee?.email) {
          const teamName = task.team?.name;
          setImmediate(() => {
            EmailService.sendTaskAssignedEmail(
              { name: assignee.name, email: assignee.email },
              {
                id: task.id,
                title: task.title,
                description: task.description,
                deadline: task.deadline,
                priority: task.priority,
                teamName,
              },
              { name: current.name, position: current.position },
            ).catch((err) => console.error('[EmailService] Task assigned email error:', err));
          });
        }
      }
      return task;
    });
  }

  static updateTask(id: string, data: UpdateTaskInput, actor: AuthenticatedUser) {
    return this.mutate(actor, async (tx, current) => {
      const task = await TaskRepository.active(tx, id);
      assertManager(current, task);
      assertEditable(task);
      const updated: Prisma.TaskUncheckedUpdateManyInput = {
        ...data,
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
      };
      // Only record fields whose value changed; timestamps alone are not an edit.
      const before: Record<string, Prisma.InputJsonValue | null> = {};
      const after: Record<string, Prisma.InputJsonValue | null> = {};
      for (const field of Object.keys(data) as Array<keyof UpdateTaskInput>) {
        const oldValue =
          field === 'deadline' ? (task.deadline?.toISOString() ?? null) : task[field];
        const newValue =
          field === 'deadline'
            ? data.deadline
              ? new Date(data.deadline).toISOString()
              : null
            : data[field];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue) && newValue !== undefined) {
          before[field] = oldValue;
          after[field] = newValue;
        }
      }
      if (!Object.keys(after).length) return TaskRepository.summary(tx, id);
      await TaskRepository.update(tx, task, updated);
      await log(tx, id, current.id, TaskAction.UPDATED, task.status, task.status, {
        before,
        after,
      });
      return TaskRepository.summary(tx, id);
    });
  }

  static assignTask(id: string, assigneeId: string | null, actor: AuthenticatedUser) {
    return this.mutate(actor, async (tx, current) => {
      const task = await TaskRepository.active(tx, id);
      assertManager(current, task);
      assertEditable(task);
      if (assigneeId) await eligible(tx, assigneeId, task.teamId);
      if (task.assigneeId === assigneeId) return TaskRepository.summary(tx, id);
      const status = assigneeId ? TaskStatus.ASSIGNED : TaskStatus.FREE;
      await TaskRepository.update(tx, task, { assigneeId, status });
      await log(
        tx,
        id,
        current.id,
        task.assigneeId ? TaskAction.REASSIGNED : TaskAction.ASSIGNED,
        task.assigneeId,
        assigneeId,
        { previousStatus: task.status, status },
      );
      if (assigneeId && assigneeId !== task.assigneeId) {
        await notifyUser(tx, assigneeId, id, 'TASK_ASSIGNED');
        const assignee = await tx.user.findUnique({
          where: { id: assigneeId },
          select: { name: true, email: true },
        });
        if (assignee?.email) {
          let teamName: string | undefined;
          if (task.teamId) {
            const team = await tx.team.findUnique({ where: { id: task.teamId }, select: { name: true } });
            teamName = team?.name;
          }
          setImmediate(() => {
            EmailService.sendTaskAssignedEmail(
              { name: assignee.name, email: assignee.email },
              {
                id: task.id,
                title: task.title,
                description: task.description,
                deadline: task.deadline,
                priority: task.priority,
                teamName,
              },
              { name: current.name, position: current.position },
            ).catch((err) => console.error('[EmailService] Task assigned email error:', err));
          });
        }
      }
      return TaskRepository.summary(tx, id);
    });
  }

  static claimTask(id: string, actor: AuthenticatedUser) {
    return this.mutate(actor, async (tx, current) => {
      const task = await TaskRepository.active(tx, id);
      assertVisible(current, task);
      if (task.status !== TaskStatus.FREE)
        throw new AppError('Task is no longer free to claim', 409);
      await eligible(tx, current.id, task.teamId);
      await TaskRepository.update(tx, task, {
        assigneeId: current.id,
        status: TaskStatus.ASSIGNED,
      });
      await log(tx, id, current.id, TaskAction.CLAIMED, task.status, TaskStatus.ASSIGNED);
      return TaskRepository.summary(tx, id);
    });
  }

  static startTask(id: string, actor: AuthenticatedUser) {
    return this.mutate(actor, async (tx, current) => {
      const task = await TaskRepository.active(tx, id);
      assertVisible(current, task);
      if (task.assigneeId !== current.id)
        throw new AppError('Only the assignee can start this task', 403);
      if (task.status !== TaskStatus.ASSIGNED)
        throw new AppError('Only assigned tasks can be started', 409);
      await TaskRepository.update(tx, task, { status: TaskStatus.IN_PROGRESS });
      await log(tx, id, current.id, TaskAction.MOVED_STATUS, task.status, TaskStatus.IN_PROGRESS);
      return TaskRepository.summary(tx, id);
    });
  }

  static submitForReview(id: string, actor: AuthenticatedUser, submission: SubmissionInput) {
    return this.mutate(actor, async (tx, current) => {
      const task = await TaskRepository.active(tx, id);
      assertVisible(current, task);
      if (task.assigneeId !== current.id)
        throw new AppError('Only the assignee can submit this task', 403);
      if (task.status !== TaskStatus.IN_PROGRESS)
        throw new AppError('Only in-progress tasks can be submitted', 409);
      if (await tx.taskSubmission.findFirst({ where: { taskId: id, outcome: null } })) {
        throw new AppError('This task already has a pending submission', 409);
      }
      await TaskRepository.update(tx, task, { status: TaskStatus.IN_REVIEW });
      const saved = await tx.taskSubmission.create({
        data: {
          taskId: id,
          memberId: current.id,
          prUrl: submission.prUrl,
          note: submission.note,
        },
      });
      await log(
        tx,
        id,
        current.id,
        TaskAction.SUBMITTED_FOR_REVIEW,
        task.status,
        TaskStatus.IN_REVIEW,
        { submissionId: saved.id },
      );
      const recipients: Array<{ id: string; name: string; email: string }> = [];
      if (task.creatorId && task.creatorId !== current.id) {
        const creator = await tx.user.findUnique({
          where: { id: task.creatorId },
          select: { id: true, name: true, email: true },
        });
        if (creator) recipients.push(creator);
      }
      if (task.teamId) {
        const teamHeads = await tx.teamMembership.findMany({
          where: { teamId: task.teamId, isTeamHead: true, userId: { not: current.id } },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        for (const th of teamHeads) {
          if (th.user && !recipients.some((r) => r.id === th.user.id)) {
            recipients.push(th.user);
          }
        }
      }

      // Notify all Super Admins, Presidents, and Executive Admins
      const superAdmins = await tx.user.findMany({
        where: {
          role: { in: ['SYSTEM_OWNER', 'PRESIDENT', 'ADMIN'] },
          id: { not: current.id },
          isActive: true,
        },
        select: { id: true, name: true, email: true },
      });
      for (const sa of superAdmins) {
        if (!recipients.some((r) => r.id === sa.id)) {
          recipients.push(sa);
        }
      }

      for (const r of recipients) {
        await notifyUser(tx, r.id, id, 'TASK_SUBMITTED');
      }

      if (recipients.length > 0) {
        let teamName: string | undefined;
        if (task.teamId) {
          const team = await tx.team.findUnique({ where: { id: task.teamId }, select: { name: true } });
          teamName = team?.name;
        }
        for (const r of recipients) {
          setImmediate(() => {
            EmailService.sendTaskSubmittedEmail(
              { name: r.name, email: r.email },
              { id: task.id, title: task.title, teamName },
              { name: current.name },
              submission.note,
              submission.prUrl,
            ).catch((err) => console.error('[EmailService] Task submitted email error:', err));
          });
        }
      }
      return TaskRepository.summary(tx, id);
    });
  }

  static reviewTask(id: string, actor: AuthenticatedUser, review: ReviewInput) {
    return this.mutate(actor, async (tx, current) => {
      const task = await TaskRepository.active(tx, id);
      assertManager(current, task);
      if (task.assigneeId === current.id)
        throw new AppError('You cannot review your own work', 403);
      if (task.status !== TaskStatus.IN_REVIEW)
        throw new AppError('Only tasks in review can be reviewed', 409);
      if (review.outcome === 'SENT_BACK' && !review.reviewComment?.trim())
        throw new AppError('Send-back feedback is required', 400);
      const submission = await tx.taskSubmission.findFirst({
        where: { taskId: id, outcome: null },
        orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
      });
      if (!submission || submission.memberId !== task.assigneeId)
        throw new AppError('A pending submission from the current assignee is required', 409);
      const [{ now }] = await tx.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS "now"`;
      const approved = review.outcome === 'APPROVED';
      const status = approved ? TaskStatus.DONE : TaskStatus.IN_PROGRESS;
      await TaskRepository.update(tx, task, {
        status,
        ...(approved && {
          completedAt: now,
          completedById: task.assigneeId,
          approvedById: current.id,
          isOnTime: task.deadline ? submission.submittedAt <= task.deadline : true,
        }),
      });
      await tx.taskSubmission.update({
        where: { id: submission.id },
        data: {
          reviewerId: current.id,
          reviewedAt: now,
          outcome: review.outcome,
          reviewComment: review.reviewComment,
        },
      });
      await log(
        tx,
        id,
        current.id,
        approved ? TaskAction.APPROVED : TaskAction.SENT_BACK,
        task.status,
        status,
        { submissionId: submission.id, reviewComment: review.reviewComment ?? null },
      );
      if (task.assigneeId) {
        const kind = approved ? 'TASK_APPROVED' : 'CHANGES_REQUESTED';
        await notifyUser(tx, task.assigneeId, id, kind);
        const assignee = await tx.user.findUnique({
          where: { id: task.assigneeId },
          select: { name: true, email: true },
        });
        if (assignee?.email) {
          setImmediate(() => {
            EmailService.sendTaskReviewedEmail(
              { name: assignee.name, email: assignee.email },
              { title: task.title },
              { name: current.name, position: current.position },
              approved,
              review.reviewComment,
            ).catch((err) => console.error('[EmailService] Task review email error:', err));
          });
        }
      }
      return TaskRepository.summary(tx, id);
    });
  }

  static deleteTask(id: string, actor: AuthenticatedUser) {
    return this.mutate(actor, async (tx, current) => {
      const task = await TaskRepository.active(tx, id);
      assertManager(current, task);
      assertEditable(task);
      await TaskRepository.update(tx, task, { isDeleted: true, deletedAt: new Date() });
      await log(tx, id, current.id, TaskAction.DELETED, task.status, task.status);
      return TaskRepository.summary(tx, id);
    });
  }
}
