import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { EmailService } from './email.service';

export interface ScanResult {
  scanned: number;
  eligible: number;
  emailsSent: number;
  skippedAlreadySentToday: number;
  details: Array<{
    taskId: string;
    taskTitle: string;
    assigneeEmail: string;
    daysRemaining: number;
    status: 'SENT' | 'SKIPPED_TODAY' | 'FAILED';
  }>;
}

export class DeadlineReminderService {
  /**
   * Scans active tasks and sends deadline warning emails to assignees
   * starting from 3 days before the deadline until task is completed.
   */
  static async scanAndSendReminders(database: PrismaClient = prisma): Promise<ScanResult> {
    const now = new Date();
    // 3 days horizon: now + 3 days (72 hours)
    const threeDaysHorizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Start of current day (midnight UTC / local) to enforce max 1 reminder per day
    const todayMidnight = new Date(now);
    todayMidnight.setUTCHours(0, 0, 0, 0);

    // 1. Fetch active, in-progress tasks approaching deadline
    const tasks = await database.task.findMany({
      where: {
        isDeleted: false,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        deadline: {
          not: null,
          lte: threeDaysHorizon, // Deadline is within 3 days or already due/overdue
        },
        assigneeId: { not: null },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, isActive: true } },
        team: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { deadline: 'asc' },
    });

    const result: ScanResult = {
      scanned: tasks.length,
      eligible: 0,
      emailsSent: 0,
      skippedAlreadySentToday: 0,
      details: [],
    };

    for (const task of tasks) {
      if (!task.assignee || !task.assignee.email || !task.assignee.isActive || !task.deadline) {
        continue;
      }

      result.eligible++;

      // Check if a reminder was already sent today for this task
      const alreadySent = await database.notification.findFirst({
        where: {
          userId: task.assignee.id,
          taskId: task.id,
          kind: 'DEADLINE_REMINDER',
          createdAt: { gte: todayMidnight },
        },
      });

      const msDiff = task.deadline.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msDiff / (24 * 60 * 60 * 1000));

      if (alreadySent) {
        result.skippedAlreadySentToday++;
        result.details.push({
          taskId: task.id,
          taskTitle: task.title,
          assigneeEmail: task.assignee.email,
          daysRemaining,
          status: 'SKIPPED_TODAY',
        });
        continue;
      }

      // Send email reminder
      try {
      await EmailService.sendDeadlineReminder(
        {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
        },
        {
          id: task.id,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          teamName: task.team?.name,
        },
        daysRemaining
      );

      } catch {
        result.details.push({ taskId: task.id, taskTitle: task.title, assigneeEmail: task.assignee.email, daysRemaining, status: 'FAILED' });
        continue;
      }

      // Record in-app notification so member sees it in NotificationBell and we don't repeat today
      if (typeof (database.notification as { upsert?: unknown }).upsert === 'function') {
        await database.notification.upsert({
          where: {
            userId_taskId_kind: {
              userId: task.assignee.id,
              taskId: task.id,
              kind: 'DEADLINE_REMINDER',
            },
          },
          update: {
            readAt: null,
            createdAt: now,
          },
          create: {
            userId: task.assignee.id,
            taskId: task.id,
            kind: 'DEADLINE_REMINDER',
            createdAt: now,
          },
        });
      } else {
        await database.notification.create({
          data: {
            userId: task.assignee.id,
            taskId: task.id,
            kind: 'DEADLINE_REMINDER',
          },
        });
      }

      result.emailsSent++;
      result.details.push({
        taskId: task.id,
        taskTitle: task.title,
        assigneeEmail: task.assignee.email,
        daysRemaining,
        status: 'SENT',
      });
    }

    console.log(
      `[DeadlineReminderService] Scan complete: ${result.emailsSent} emails sent (${result.skippedAlreadySentToday} skipped as already sent today, ${result.eligible} eligible within 3 days)`
    );

    return result;
  }
}
