import app, { closeSessionStore } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function start() {
  try {
    await prisma.$connect();
    // Verify migrations have created the tables required by the app and sessions.
    await prisma.user.count();
    await prisma.session.count();
  } catch {
    console.error('Database startup check failed. Check DATABASE_URL and run prisma:deploy.');
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
