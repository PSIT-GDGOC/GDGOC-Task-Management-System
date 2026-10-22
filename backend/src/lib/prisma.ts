import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    // Avoid logging SQL parameters containing session data or personal information.
    log: ['warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
