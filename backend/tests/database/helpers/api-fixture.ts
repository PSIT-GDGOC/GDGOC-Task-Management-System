import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { PrismaClient, SystemRole } from '@prisma/client';
import type { Express } from 'express';
import request from 'supertest';

/** API suites use a fresh schema and actual middleware/session login, never permission mocks. */
export async function createApiFixture() {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error('TEST_DATABASE_URL is required for database tests.');
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('PostgreSQL required.');
  const schema = `gdgoc_test_${randomUUID().replaceAll('-', '')}`;
  url.searchParams.set('schema', schema);
  const testUrl = url.toString();
  const db = new PrismaClient({ datasources: { db: { url: testUrl } } });
  const environmentKeys = ['DATABASE_URL', 'DIRECT_URL', 'NODE_ENV', 'SYSTEM_OWNER_EMAIL'] as const;
  const previousEnvironment = Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]]),
  );
  const cleanup = async () => {
    try {
      await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await db.$disconnect();
      if (globalThis.prismaGlobal === db) globalThis.prismaGlobal = undefined;
      for (const key of environmentKeys) {
        if (previousEnvironment[key] === undefined) delete process.env[key];
        else process.env[key] = previousEnvironment[key];
      }
    }
  };
  try {
    const resolveModule = createRequire(`${process.cwd()}/package.json`);
    execFileSync(
      process.execPath,
      [resolveModule.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
      {
        env: { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: testUrl },
        stdio: 'pipe',
      },
    );
    process.env.DATABASE_URL = testUrl;
    process.env.DIRECT_URL = testUrl;
    process.env.NODE_ENV = 'test';
    process.env.SYSTEM_OWNER_EMAIL = 'gdgoc.psit@gmail.com';
    globalThis.prismaGlobal = db;
    // Vitest resolves the TS default export; NodeNext types wrap this CommonJS module.
    const app = (await import('../../../src/app.js')).default as unknown as Express;
    const teamA = (await db.team.create({ data: { name: 'Tech', slug: 'tech' } })).id;
    const teamB = (await db.team.create({ data: { name: 'Media', slug: 'media' } })).id;
    const roles: Record<string, SystemRole> = {
      owner: 'SYSTEM_OWNER',
      president: 'PRESIDENT',
      adminA: 'ADMIN',
      adminB: 'ADMIN',
      memberA: 'USER',
      memberB: 'USER',
      headA: 'USER',
      outsider: 'USER',
    };
    const users: Record<string, string> = {};
    const agents: Record<string, ReturnType<typeof request.agent>> = {};
    for (const [name, role] of Object.entries(roles)) {
      const email = name === 'owner' ? 'gdgoc.psit@gmail.com' : `${name.toLowerCase()}@example.com`;
      users[name] = (await db.user.create({ data: { email, name, role } })).id;
      agents[name] = request.agent(app);
      const login = await agents[name].post('/api/v1/auth/dev-login').send({ email });
      if (login.status !== 200) throw new Error('API test fixture login failed');
    }
    for (const name of ['adminA', 'memberA', 'headA', 'adminB', 'memberB']) {
      await db.teamMembership.create({
        data: {
          userId: users[name],
          teamId: name.endsWith('B') ? teamB : teamA,
          isTeamHead: name === 'headA',
        },
      });
    }
    return { db, app, teamA, teamB, users, agents, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
export type ApiFixture = Awaited<ReturnType<typeof createApiFixture>>;
