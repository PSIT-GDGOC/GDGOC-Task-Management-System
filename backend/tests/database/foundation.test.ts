import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { seedDatabase } from '../../prisma/seed-data';
import { sessionConnectionOptions } from '../../src/config/session-connection';

const resolveModule = createRequire(`${process.cwd()}/package.json`);
const schema = `gdgoc_test_${randomUUID().replaceAll('-', '')}`;
let prisma: PrismaClient;
let testUrl: string;
let actorId: string;
let memberId: string;
let teamId: string;

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error(
      'Set TEST_DATABASE_URL to a disposable PostgreSQL database to run database tests.',
    );
  }
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('PostgreSQL required.');
  url.searchParams.set('schema', schema);
  testUrl = url.toString();
  prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
  execFileSync(
    process.execPath,
    [resolveModule.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    {
      env: { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: testUrl },
      stdio: 'pipe',
    },
  );
  actorId = (
    await prisma.user.create({ data: { email: 'admin@example.com', name: 'Admin', role: 'ADMIN' } })
  ).id;
  memberId = (await prisma.user.create({ data: { email: 'member@example.com', name: 'Member' } }))
    .id;
  teamId = (await prisma.team.create({ data: { name: 'Test Team', slug: 'test-team' } })).id;
});

afterAll(async () => {
  if (prisma) {
    // Only this run's generated schema is removed; never reset the supplied database.
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await prisma.$disconnect();
    }
  }
});

const taskData = () => ({
  title: 'Database foundation',
  description: 'Test task',
  creatorId: actorId,
});
const invitationData = () => ({
  hashedCode: randomUUID(),
  createdById: actorId,
  expiresAt: new Date(Date.now() + 86_400_000),
});

describe('PostgreSQL database foundation', () => {
  it('applies migrations to an empty schema and supports a no-op redeploy', async () => {
    execFileSync(
      process.execPath,
      [resolveModule.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
      {
        env: { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: testUrl },
        stdio: 'pipe',
      },
    );
    execFileSync(
      process.execPath,
      [
        resolveModule.resolve('prisma/build/index.js'),
        'migrate',
        'diff',
        '--from-schema-datasource',
        'prisma/schema.prisma',
        '--to-schema-datamodel',
        'prisma/schema.prisma',
        '--exit-code',
      ],
      {
        env: { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: testUrl },
        stdio: 'pipe',
      },
    );
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
    expect(migrations.map((row) => row.migration_name)).toContain(
      '20261022170000_database_foundation',
    );
  });

  it('seeds repeatedly without duplicates or overwriting customized profiles and teams', async () => {
    execFileSync(process.execPath, [resolveModule.resolve('prisma/build/index.js'), 'db', 'seed'], {
      env: {
        ...process.env,
        DATABASE_URL: testUrl,
        DIRECT_URL: testUrl,
        SYSTEM_OWNER_EMAIL: 'owner@example.com',
      },
      stdio: 'pipe',
    });
    await seedDatabase(prisma, ' Owner@Example.com ');
    await prisma.user.update({
      where: { email: 'owner@example.com' },
      data: { name: 'Club Owner', isActive: false },
    });
    await prisma.team.update({
      where: { slug: 'tech' },
      data: { description: 'Customized description' },
    });
    const keysBefore = await prisma.roleKey.findMany({ orderBy: { position: 'asc' } });
    expect(keysBefore).toHaveLength(6);
    expect(new Set(keysBefore.map((key) => key.keyCode)).size).toBe(6);
    expect(keysBefore.every((key) => /^[A-F0-9]{48}$/.test(key.keyCode))).toBe(true);
    await seedDatabase(prisma, 'owner@example.com');
    expect(await prisma.roleKey.findMany({ orderBy: { position: 'asc' } })).toEqual(keysBefore);
    expect(await prisma.user.count({ where: { email: 'owner@example.com' } })).toBe(1);
    expect(await prisma.user.findUnique({ where: { email: 'owner@example.com' } })).toMatchObject({
      name: 'Club Owner',
      role: 'SYSTEM_OWNER',
      isActive: false,
    });
    expect(await prisma.team.count({ where: { slug: { in: ['tech', 'media', 'content'] } } })).toBe(
      3,
    );
    expect(await prisma.team.findUnique({ where: { slug: 'tech' } })).toMatchObject({
      description: 'Customized description',
    });
  });

  it('rejects invalid seed configuration before writing', async () => {
    const before = await prisma.user.count();
    await expect(seedDatabase(prisma, 'invalid-email')).rejects.toThrow();
    expect(await prisma.user.count()).toBe(before);
  });

  it('enforces normalized unique emails, unique memberships, and existing invitation teams', async () => {
    await expect(
      prisma.user.create({ data: { email: 'Member@Example.com', name: 'Duplicate' } }),
    ).rejects.toThrow();
    await expect(
      prisma.user.create({ data: { email: 'member@example.com', name: 'Duplicate' } }),
    ).rejects.toThrow();
    await prisma.teamMembership.create({ data: { userId: memberId, teamId } });
    await expect(
      prisma.teamMembership.create({ data: { userId: memberId, teamId } }),
    ).rejects.toThrow();
    await expect(
      prisma.adminInvitation.create({
        data: { ...invitationData(), intendedTeamId: 'missing-team' },
      }),
    ).rejects.toThrow();
  });

  it('enforces task scope, assignee, completion, and soft-deletion consistency', async () => {
    const task = await prisma.task.create({ data: taskData() });
    expect(task).toMatchObject({ status: 'FREE', scope: 'WHOLE_CLUB', teamId: null });
    await expect(prisma.task.create({ data: { ...taskData(), scope: 'TEAM' } })).rejects.toThrow();
    await expect(prisma.task.create({ data: { ...taskData(), teamId } })).rejects.toThrow();
    await expect(
      prisma.task.update({ where: { id: task.id }, data: { status: 'ASSIGNED' } }),
    ).rejects.toThrow();
    await expect(
      prisma.task.update({
        where: { id: task.id },
        data: { status: 'DONE', assigneeId: memberId },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.task.update({ where: { id: task.id }, data: { isDeleted: true } }),
    ).rejects.toThrow();
    await prisma.task.update({
      where: { id: task.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  });

  it('allows only one winner when two members claim a free task concurrently', async () => {
    const task = await prisma.task.create({ data: taskData() });
    const results = await Promise.all(
      [actorId, memberId].map((assigneeId) =>
        prisma.task.updateMany({
          where: { id: task.id, status: 'FREE', isDeleted: false },
          data: { assigneeId, status: 'ASSIGNED' },
        }),
      ),
    );
    expect(results.map((result) => result.count).sort()).toEqual([0, 1]);
  });

  it('retains submission review history and permits resubmission after send-back', async () => {
    const task = await prisma.task.create({
      data: { ...taskData(), assigneeId: memberId, status: 'IN_REVIEW' },
    });
    const submission = await prisma.taskSubmission.create({
      data: { taskId: task.id, memberId, note: 'Work ready' },
    });
    await expect(
      prisma.taskSubmission.create({ data: { taskId: task.id, memberId } }),
    ).rejects.toThrow();
    await expect(
      prisma.taskSubmission.update({ where: { id: submission.id }, data: { outcome: 'APPROVED' } }),
    ).rejects.toThrow();
    await prisma.taskSubmission.update({
      where: { id: submission.id },
      data: {
        outcome: 'SENT_BACK',
        reviewerId: actorId,
        reviewedAt: new Date(),
        reviewComment: 'Please revise',
      },
    });
    await prisma.taskSubmission.create({ data: { taskId: task.id, memberId, note: 'Revised' } });
    expect(await prisma.taskSubmission.count({ where: { taskId: task.id } })).toBe(2);
  });

  it('stores completed work and protects audit references from hard deletion', async () => {
    const task = await prisma.task.create({
      data: {
        ...taskData(),
        status: 'DONE',
        assigneeId: memberId,
        completedById: memberId,
        approvedById: actorId,
        completedAt: new Date(),
        isOnTime: true,
      },
    });
    await prisma.taskActivity.create({ data: { taskId: task.id, actorId, action: 'APPROVED' } });
    await expect(prisma.task.delete({ where: { id: task.id } })).rejects.toThrow();
    await expect(prisma.user.delete({ where: { id: memberId } })).rejects.toThrow();
    expect(
      await prisma.task.findMany({ where: { completedById: memberId, status: 'DONE' } }),
    ).toHaveLength(1);
  });

  it('validates invitation roles, expiry, token uniqueness, and redemption fields', async () => {
    await expect(
      prisma.adminInvitation.create({
        data: { ...invitationData(), intendedRole: 'SYSTEM_OWNER' },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.adminInvitation.create({ data: { ...invitationData(), expiresAt: new Date(0) } }),
    ).rejects.toThrow();
    const invite = await prisma.adminInvitation.create({
      data: { ...invitationData(), intendedTeamId: teamId },
    });
    await expect(
      prisma.adminInvitation.create({
        data: { ...invitationData(), hashedCode: invite.hashedCode },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.adminInvitation.update({ where: { id: invite.id }, data: { usedById: memberId } }),
    ).rejects.toThrow();
    await prisma.adminInvitation.update({
      where: { id: invite.id },
      data: { usedById: memberId, usedAt: new Date() },
    });
  });

  it('rolls back related writes together when an invariant fails', async () => {
    const id = randomUUID();
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.task.create({ data: { ...taskData(), id } });
        await tx.taskActivity.create({
          data: { taskId: id, actorId: 'missing-user', action: 'CREATED' },
        });
      }),
    ).rejects.toThrow();
    expect(await prisma.task.findUnique({ where: { id } })).toBeNull();
  });

  it('persists and reads sessions using the actual connect-pg-simple adapter', async () => {
    const Store = pgSession(session);
    const store = new Store({
      conObject: sessionConnectionOptions(testUrl),
      schemaName: schema,
      tableName: 'session',
      createTableIfMissing: false,
      pruneSessionInterval: false,
    });
    const sid = randomUUID();
    const cookie = new session.Cookie();
    cookie.maxAge = 60_000;
    const payload = {
      cookie,
      userId: memberId,
    };
    try {
      await new Promise<void>((resolve, reject) =>
        store.set(sid, payload, (error) => (error ? reject(error) : resolve())),
      );
      const saved = await new Promise<session.SessionData | null | undefined>((resolve, reject) =>
        store.get(sid, (error, value) => (error ? reject(error) : resolve(value))),
      );
      expect(saved).toMatchObject({ userId: memberId });
      expect(await prisma.session.count({ where: { sid } })).toBe(1);
      await new Promise<void>((resolve, reject) =>
        store.destroy(sid, (error) => (error ? reject(error) : resolve())),
      );
      expect(await prisma.session.count({ where: { sid } })).toBe(0);
    } finally {
      await store.close();
    }
  });
});
