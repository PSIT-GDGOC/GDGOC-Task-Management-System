import app, { closeSessionStore } from './app';
import { env } from './config/env';
import { redis, closeRedis } from './lib/redis';
import { startJobs } from './jobs/runtime';
import { prisma } from './lib/prisma';

async function start() {
  let jobs: Awaited<ReturnType<typeof startJobs>> | undefined;
  try {
    await prisma.$connect();
    // Verify migrations have created the tables required by the app and sessions.
    await prisma.user.count();
    await prisma.session.count();
    await prisma.notification.count();
    if (redis) {
      await redis.ping();
      const memory = await redis.info('memory');
      if (!memory.includes('maxmemory_policy:noeviction'))
        throw new Error('Redis must use noeviction for durable jobs');
    }
    if (env.REDIS_URL && env.WORKER_MODE === 'embedded') jobs = await startJobs();
  } catch {
    console.error('Service startup failed. Check database migrations and Redis configuration.');
    await jobs?.close();
    await closeRedis();
    await closeSessionStore();
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  const server = app.listen(env.PORT, () => {
    console.log(`GDGOC Task Management Server running on port ${env.PORT}`);
  });

  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10_000);
    timeout.unref();
    server.close(async () => {
      try {
        await jobs?.close();
        await closeRedis();
        await closeSessionStore();
        await prisma.$disconnect();
      } catch {
        console.error('Database shutdown failed.');
        process.exitCode = 1;
      } finally {
        clearTimeout(timeout);
      }
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

void start();
