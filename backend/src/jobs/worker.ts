import { prisma } from '../lib/prisma';
import { startJobs } from './runtime';
import { redis, closeRedis } from '../lib/redis';
async function main() {
  await prisma.$connect();
  await prisma.notification.count();
  if (!redis) throw new Error('REDIS_URL is required');
  await redis.ping();
  const jobs = await startJobs();
  console.log('GDGOC maintenance worker started');
  let closing = false;
  const stop = async () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 20000);
    deadline.unref();
    await jobs.close();
    await closeRedis();
    await prisma.$disconnect();
    clearTimeout(deadline);
  };
  process.on('SIGTERM', () => {
    void stop();
  });
  process.on('SIGINT', () => {
    void stop();
  });
}
void main().catch(() => {
  console.error('Worker startup failed. Check PostgreSQL and Redis configuration.');
  process.exit(1);
});
