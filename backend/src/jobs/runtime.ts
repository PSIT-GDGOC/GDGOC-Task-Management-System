import { DeadlineReminderService } from '../services/deadline-reminder.service';
import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

export async function scanOverdue(database: PrismaClient) {
  let cursor: string | undefined;
  let created = 0;
  while (true) {
    const candidates = await database.task.findMany({
      where: {
        isDeleted: false,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        deadline: { lt: new Date() },
        assigneeId: { not: null },
      },
      orderBy: { id: 'asc' },
      take: 100,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: { id: true },
    });
    if (!candidates.length) break;
    for (const candidate of candidates) {
      created += await database.$transaction(
        async (tx) => {
          const task = await tx.task.findFirst({
            where: {
              id: candidate.id,
              isDeleted: false,
              status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
              deadline: { lt: new Date() },
              assigneeId: { not: null },
            },
          });
          if (!task?.assigneeId) return 0;
          const user = await tx.user.findUnique({ where: { id: task.assigneeId } });
          if (!user?.isActive) return 0;
          if (
            task.teamId &&
            !(await tx.teamMembership.findUnique({
              where: { userId_teamId: { userId: user.id, teamId: task.teamId } },
            }))
          )
            return 0;
          return (
            await tx.notification.createMany({
              data: [{ taskId: task.id, userId: user.id, kind: 'TASK_OVERDUE' }],
              skipDuplicates: true,
            })
          ).count;
        },
        { isolationLevel: 'Serializable' },
      );
    }
    cursor = candidates[candidates.length - 1].id;
  }
  return { created };
}
export async function maintenance(database: PrismaClient) {
  const expired = await database.oAuthAttempt.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  const sessions = await database.session.deleteMany({ where: { expire: { lt: new Date() } } });
  return { oauthStatesRemoved: expired.count, sessionsRemoved: sessions.count };
}
export async function startJobs(
  options: { url?: string; prefix?: string; database?: PrismaClient; schedule?: boolean } = {},
) {
  const url = options.url ?? env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is required for background jobs');
  const prefix = options.prefix ?? env.REDIS_PREFIX;
  const database = options.database ?? prisma;
  const queue = new Queue('maintenance', {
    prefix,
    connection: { url, maxRetriesPerRequest: 1, connectTimeout: 3000 },
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  });
  const worker = new Worker(
    'maintenance',
    async (job) => {
      if (job.name === 'overdue-scan') return scanOverdue(database);
      if (job.name === 'deadline-reminders') return DeadlineReminderService.scanAndSendReminders(database);
      if (job.name === 'cleanup') return maintenance(database);
      throw new Error('Unknown maintenance job');
    },
    { prefix, connection: { url, maxRetriesPerRequest: null }, concurrency: 1 },
  );
  queue.on('error', () => {});
  worker.on('error', () => {});
  worker.on('failed', (job) =>
    console.error(
      `Background job failed: ${job?.name ?? 'unknown'} (attempt ${job?.attemptsMade ?? 0})`,
    ),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      worker.waitUntilReady(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Worker Redis connection timed out')), 10000);
      }),
    ]);
    const connection = await queue.getBackend().connection.client;
    if (!(await connection.info()).includes('maxmemory_policy:noeviction'))
      throw new Error('Redis must use noeviction for background jobs');
    if (options.schedule !== false) {
      await queue.upsertJobScheduler(
        'overdue-scan',
        { every: 300000 },
        { name: 'overdue-scan', data: {} },
      );
      await queue.upsertJobScheduler('cleanup', { every: 3600000 }, { name: 'cleanup', data: {} });
    }
  } catch (error) {
    await Promise.allSettled([worker.disconnect(), queue.disconnect()]);
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
  return {
    queue,
    worker,
    close: async () => {
      await worker.close();
      await queue.close();
    },
  };
}
