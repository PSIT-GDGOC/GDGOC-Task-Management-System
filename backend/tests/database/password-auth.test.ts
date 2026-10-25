import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ApiFixture, createApiFixture, fixturePassword } from './helpers/api-fixture';

let fixture: ApiFixture;
beforeAll(async () => {
  fixture = await createApiFixture();
});
afterAll(async () => {
  if (fixture) await fixture.cleanup();
});
beforeEach(async () => {
  const { authenticationLimit } = await import('../../src/security/rateLimits.js');
  await authenticationLimit.resetKey('::ffff:127.0.0.1');
  await authenticationLimit.resetKey('127.0.0.1');
  await authenticationLimit.resetKey('::/56');
});
const email = () => `audit-${randomUUID()}@example.com`;
const signup = (overrides: Record<string, unknown> = {}) =>
  request(fixture.app)
    .post('/api/v1/auth/dev-login')
    .send({
      email: email(),
      name: 'Audit Member',
      password: ' secure password ',
      isSignUp: true,
      teamSlug: 'tech',
      ...overrides,
    });

describe('Password login permissions and account persistence', () => {
  it('requires a key for every client requested privilege and creates no user on failure', async () => {
    for (const privileges of [
      { role: 'ADMIN' },
      { role: 'SYSTEM_OWNER' },
      { isTeamHead: true },
      { position: 'President' },
      { position: 'Secretary' },
    ]) {
      const target = email();
      expect((await signup({ email: target, ...privileges })).status).toBe(400);
      expect(await fixture.db.user.findUnique({ where: { email: target } })).toBeNull();
    }
  });
  it('rejects previously hardcoded preset keys when no database key exists', async () => {
    expect((await signup({ invitationKey: 'TECH', position: 'Tech Lead' })).status).toBe(400);
  });
  it('keeps sign-in read-only even when the client supplies role, profile, or team-head changes', async () => {
    const before = await fixture.db.user.findUniqueOrThrow({ where: { id: fixture.users.headA } });
    const login = await request(fixture.app).post('/api/v1/auth/dev-login').send({
      email: before.email,
      password: fixturePassword,
      name: 'Changed Name',
      role: 'SYSTEM_OWNER',
      position: 'President',
      teamSlug: 'media',
      isTeamHead: false,
    });
    expect(login.status).toBe(200);
    expect(await fixture.db.user.findUnique({ where: { id: before.id } })).toEqual(before);
    expect(await fixture.db.teamMembership.findMany({ where: { userId: before.id } })).toEqual([
      expect.objectContaining({ teamId: fixture.teamA, isTeamHead: true }),
    ]);
  });
  it('does not promote a regular returning member or join a client selected team', async () => {
    const member = await fixture.db.user.findUniqueOrThrow({
      where: { id: fixture.users.memberA },
    });
    const login = await request(fixture.app).post('/api/v1/auth/dev-login').send({
      email: member.email,
      password: fixturePassword,
      role: 'ADMIN',
      teamSlug: 'media',
      isTeamHead: true,
    });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('USER');
    expect(login.body.user.teamMemberships).toEqual([
      expect.objectContaining({ teamId: fixture.teamA, isTeamHead: false }),
    ]);
  });
  it('enforces password length and rejects missing teams before creating accounts', async () => {
    for (const input of [
      { name: undefined },
      { name: 'member@example.com' },
      { password: '' },
      { password: '12345' },
      { password: 'x'.repeat(129) },
      { teamSlug: 'missing-team' },
    ])
      expect((await signup(input)).status).toBe(400);
  });
  it('preserves exact password characters and rotates a usable CSRF token', async () => {
    const target = email();
    expect((await signup({ email: target })).status).toBe(200);
    const agent = request.agent(fixture.app);
    const login = await agent
      .post('/api/v1/auth/dev-login')
      .send({ email: target, password: ' secure password ' });
    expect(login.status).toBe(200);
    expect(login.body.user).not.toHaveProperty('passwordHash');
    expect(login.body.csrfToken).toBeTruthy();
    expect(
      (
        await agent
          .patch('/api/v1/auth/name')
          .set('X-CSRF-Token', login.body.csrfToken)
          .send({ name: 'Updated Member' })
      ).status,
    ).toBe(200);
    for (const password of [undefined, 'secure password', 'wrong password', ''])
      expect(
        (
          await request(fixture.app)
            .post('/api/v1/auth/dev-login')
            .send({ email: target, password })
        ).status,
      ).toBe(401);
  });
  it('does not bootstrap a legacy account with the shared default password', async () => {
    const member = await fixture.db.user.findUniqueOrThrow({
      where: { id: fixture.users.memberB },
    });
    await fixture.db.user.update({ where: { id: member.id }, data: { passwordHash: null } });
    expect(
      (
        await request(fixture.app)
          .post('/api/v1/auth/dev-login')
          .send({ email: member.email, password: 'Password@123' })
      ).status,
    ).toBe(401);
  });
  it('validates the team and position bound to a database leadership key', async () => {
    const key = `AUDIT-${randomUUID()}`;
    await fixture.db.roleKey.create({
      data: { position: 'Media Lead', keyCode: key, teamSlug: 'media' },
    });
    expect((await signup({ invitationKey: key, position: 'Tech Lead' })).status).toBe(400);
    expect((await signup({ invitationKey: key, position: 'Media Lead' })).status).toBe(400);
    const result = await signup({ invitationKey: key, position: 'Media Lead', teamSlug: 'media' });
    expect(result.status).toBe(200);
    expect(result.body.user).toMatchObject({
      role: 'ADMIN',
      position: 'Media Lead',
      teamMemberships: [expect.objectContaining({ teamId: fixture.teamB, isTeamHead: true })],
    });
    expect(
      (await signup({ invitationKey: key, position: 'Media Lead', teamSlug: 'media' })).status,
    ).toBe(409);
  });
  it('binds legacy invitations to their email and consumes them atomically with the new user', async () => {
    const target = email();
    const created = await fixture.agents.owner
      .post('/api/v1/invitations')
      .send({ role: 'ADMIN', position: 'Secretary', email: target });
    expect(created.status).toBe(201);
    const key = created.body.data.rawCode;
    expect((await signup({ invitationKey: key })).status).toBe(403);
    expect((await signup({ email: target, invitationKey: key, teamSlug: 'missing' })).status).toBe(
      400,
    );
    expect(
      await fixture.db.adminInvitation.findUnique({ where: { id: created.body.data.id } }),
    ).toMatchObject({ usedAt: null, usedById: null });
    const result = await signup({ email: target, invitationKey: key });
    expect(result.status).toBe(200);
    expect(
      await fixture.db.adminInvitation.findUnique({ where: { id: created.body.data.id } }),
    ).toMatchObject({ usedById: result.body.user.id, usedAt: expect.any(Date) });
    expect((await signup({ invitationKey: key })).status).toBe(400);
  });
  it('does not allow a profile position alone to grant access to leadership keys', async () => {
    await fixture.db.user.update({
      where: { id: fixture.users.outsider },
      data: { position: 'President' },
    });
    expect((await fixture.agents.outsider.get('/api/v1/invitations/role-keys')).status).toBe(403);
  });
});

describe('Activity and reminder access', () => {
  it('hides other teams and deleted tasks from scoped admins', async () => {
    const activity = async (teamId: string, deleted = false) => {
      const task = await fixture.db.task.create({
        data: {
          title: 'Audit task',
          description: 'Activity visibility regression',
          scope: 'TEAM',
          teamId,
          creatorId: fixture.users.owner,
          isDeleted: deleted,
          deletedAt: deleted ? new Date() : null,
        },
      });
      return fixture.db.taskActivity.create({
        data: { taskId: task.id, actorId: fixture.users.owner, action: 'CREATED' },
      });
    };
    const visible = await activity(fixture.teamA);
    const hidden = await activity(fixture.teamB);
    const deleted = await activity(fixture.teamA, true);
    const feed = await fixture.agents.adminA.get('/api/v1/tasks/activity/feed');
    expect(feed.status).toBe(200);
    const ids = feed.body.data.map((row: { id: string }) => row.id);
    expect(ids).toContain(visible.id);
    expect(ids).not.toContain(hidden.id);
    expect(ids).not.toContain(deleted.id);
    const ownerFeed = await fixture.agents.owner.get('/api/v1/tasks/activity/feed');
    expect(ownerFeed.body.data.map((row: { id: string }) => row.id)).not.toContain(deleted.id);
  });
  it('rejects manual reminder triggering by members and team admins', async () => {
    for (const actor of ['memberA', 'adminA'])
      expect((await fixture.agents[actor].post('/api/v1/tasks/reminders/trigger')).status).toBe(
        403,
      );
  });
});

describe('Same-origin frontend session transport', () => {
  it('keeps sessions usable across reload/history and uses the same trusted preview origin for CSRF', async () => {
    const origin = 'https://gdgoc-task-management-system-git-fix-session-gdg-o-c-psit.vercel.app';
    const member = await fixture.db.user.findUniqueOrThrow({
      where: { id: fixture.users.memberA },
    });
    const browser = request.agent(fixture.app);
    const login = await browser
      .post('/api/v1/auth/dev-login')
      .set('Origin', origin)
      .send({ email: member.email, password: fixturePassword });
    expect(login.status).toBe(200);
    expect(login.headers['access-control-allow-origin']).toBe(origin);
    expect((await browser.get('/api/v1/auth/me')).body.user.id).toBe(member.id);
    expect((await browser.get('/api/v1/history/me')).status).toBe(200);
    expect(
      (
        await browser
          .post('/api/v1/auth/logout')
          .set('Origin', origin)
          .set('X-CSRF-Token', login.body.csrfToken)
      ).status,
    ).toBe(200);
    expect((await browser.get('/api/v1/auth/me')).status).toBe(401);
    expect(
      (
        await request(fixture.app)
          .post('/api/v1/auth/dev-login')
          .set('Origin', 'https://unrelated.vercel.app')
          .send({ email: member.email, password: fixturePassword })
      ).status,
    ).toBe(403);
  });
});
