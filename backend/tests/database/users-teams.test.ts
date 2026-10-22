import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ApiFixture, createApiFixture } from './helpers/api-fixture';

let fixture: ApiFixture;
let db: ApiFixture['db'];
let app: ApiFixture['app'];
let teamA: string;
let teamB: string;
let users: ApiFixture['users'];
let agents: ApiFixture['agents'];

beforeAll(async () => {
  fixture = await createApiFixture();
  ({ db, app, teamA, teamB, users, agents } = fixture);
});
afterAll(async () => {
  if (fixture) await fixture.cleanup();
});

async function newUser(name: string) {
  return db.user.create({
    data: { email: `${name.toLowerCase().replaceAll(' ', '-')}-${randomUUID()}@example.com`, name },
  });
}
async function task(teamId: string | null, status: 'FREE' | 'IN_REVIEW' = 'FREE') {
  return db.task.create({
    data: {
      title: `Task ${randomUUID()}`,
      description: 'Task permission regression fixture',
      creatorId: users.owner,
      teamId,
      scope: teamId ? 'TEAM' : 'WHOLE_CLUB',
      status,
      ...(status === 'IN_REVIEW' && {
        assigneeId: teamId === teamB ? users.memberB : users.memberA,
      }),
    },
  });
}

describe('Users and team permissions through the HTTP API', () => {
  it('requires a session for profiles, directories, teams, and task reads', async () => {
    for (const path of ['/users/me', '/users', '/teams', '/tasks', '/tasks/missing']) {
      expect((await request(app).get('/api/v1' + path)).status).toBe(401);
    }
  });

  it('returns the current profile with live team memberships', async () => {
    const response = await agents.memberA.get('/api/v1/users/me');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: users.memberA, role: 'USER' });
    expect(response.body.data.teamMemberships).toEqual([
      expect.objectContaining({ teamId: teamA, isTeamHead: false }),
    ]);
  });

  it('updates only editable profile fields and normalizes GitHub identity', async () => {
    const updated = await agents.memberA
      .patch('/api/v1/users/me')
      .send({ position: ' Developer ', githubUsername: 'Team-Dev' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ position: 'Developer', githubUsername: 'team-dev' });
    for (const body of [
      { role: 'SYSTEM_OWNER' },
      { email: 'spoof@example.com' },
      { isActive: true },
      { name: 'Spoof' },
      {},
      { githubUsername: 'bad--name' },
    ]) {
      expect((await agents.memberA.patch('/api/v1/users/me').send(body)).status).toBe(400);
    }
    const duplicate = await agents.memberB
      .patch('/api/v1/users/me')
      .send({ githubUsername: 'TEAM-DEV' });
    expect(duplicate.status).toBe(409);
    expect(JSON.stringify(duplicate.body)).not.toContain('Prisma');
    expect(
      (await agents.memberA.patch('/api/v1/users/me').send({ githubUsername: null })).status,
    ).toBe(200);
  });

  it('restricts member directories to club managers and scoped admins/heads', async () => {
    expect((await agents.memberA.get('/api/v1/users')).status).toBe(403);
    const scoped = await agents.adminA.get('/api/v1/users?limit=100');
    expect(scoped.status).toBe(200);
    expect(scoped.body.data.map((user: { id: string }) => user.id).sort()).toEqual(
      [users.adminA, users.memberA, users.headA].sort(),
    );
    expect((await agents.adminA.get(`/api/v1/users?teamId=${teamB}`)).status).toBe(403);
    expect((await agents.headA.get('/api/v1/users')).status).toBe(200);
    const all = await agents.president.get('/api/v1/users?limit=1&page=2');
    expect(all.status).toBe(200);
    expect(all.body.pagination).toMatchObject({ page: 2, limit: 1, total: 8 });
    expect(
      (await agents.owner.get('/api/v1/users?role=ADMIN&isActive=true&search=admin')).body
        .pagination.total,
    ).toBe(2);
    expect((await agents.owner.get('/api/v1/users?isActive=invalid')).status).toBe(400);
    expect((await agents.owner.get('/api/v1/users?limit=1000')).status).toBe(400);
  });

  it('lets authenticated members see team summaries and only their own roster', async () => {
    expect((await agents.outsider.get('/api/v1/teams')).body.pagination.total).toBe(2);
    expect((await agents.memberA.get(`/api/v1/teams/${teamA}`)).status).toBe(200);
    expect((await agents.memberA.get(`/api/v1/teams/${teamA}/members`)).body.pagination.total).toBe(
      3,
    );
    expect((await agents.memberA.get(`/api/v1/teams/${teamB}/members`)).status).toBe(403);
    expect((await agents.owner.get(`/api/v1/teams/${teamB}/members`)).status).toBe(200);
  });

  it('allows club managers to create/edit teams and maps duplicates to conflicts', async () => {
    const body = { name: 'Content', slug: ' Content ', description: 'Club writing' };
    expect((await agents.adminA.post('/api/v1/teams').send(body)).status).toBe(403);
    const created = await agents.president.post('/api/v1/teams').send(body);
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe('content');
    expect((await agents.owner.post('/api/v1/teams').send(body)).status).toBe(409);
    expect(
      (
        await agents.owner
          .patch(`/api/v1/teams/${created.body.data.id}`)
          .send({ description: 'Updated' })
      ).status,
    ).toBe(200);
    expect(
      (await agents.headA.patch(`/api/v1/teams/${teamA}`).send({ name: 'Spoof' })).status,
    ).toBe(403);
    expect(
      (await agents.owner.patch('/api/v1/teams/missing').send({ name: 'Missing' })).status,
    ).toBe(404);
    expect((await agents.owner.patch(`/api/v1/teams/${teamA}`).send({})).status).toBe(400);
  });

  it('lets admins manage ordinary members in their team but cannot appoint heads or cross teams', async () => {
    const member = await newUser('New member');
    const own = `/api/v1/teams/${teamA}/members/${member.id}`;
    expect((await agents.memberA.put(own).send({})).status).toBe(403);
    expect(
      (await agents.adminA.put(`/api/v1/teams/${teamB}/members/${member.id}`).send({})).status,
    ).toBe(403);
    expect((await agents.adminA.put(own).send({ isTeamHead: true })).status).toBe(403);
    expect((await agents.adminA.put(own).send({})).status).toBe(200);
    expect((await agents.adminA.put(own).send({})).status).toBe(200);
    expect(await db.teamMembership.count({ where: { userId: member.id, teamId: teamA } })).toBe(1);
    expect((await agents.headA.delete(own)).status).toBe(200);
    expect((await agents.headA.delete(own)).status).toBe(404);
    expect((await agents.owner.put(`/api/v1/teams/${teamA}/members/missing`).send({})).status).toBe(
      404,
    );
  });

  it('reserves team-head and privileged membership changes to club managers', async () => {
    const member = await newUser('New head');
    const path = `/api/v1/teams/${teamA}/members/${member.id}`;
    expect((await agents.owner.put(path).send({ isTeamHead: true })).status).toBe(200);
    expect((await agents.adminA.delete(path)).status).toBe(403);
    expect((await agents.adminA.put(path).send({})).status).toBe(403);
    expect(
      (await agents.headA.delete(`/api/v1/teams/${teamA}/members/${users.adminA}`)).status,
    ).toBe(403);
    expect((await agents.president.put(path).send({ isTeamHead: false })).status).toBe(200);
    expect((await agents.adminA.delete(path)).status).toBe(200);
  });

  it('rejects inactive membership targets and removal while team tasks are assigned', async () => {
    const member = await newUser('Assigned member');
    const path = `/api/v1/teams/${teamA}/members/${member.id}`;
    await agents.owner.put(path).send({});
    const active = await db.task.create({
      data: {
        title: 'Active team task',
        description: 'Must reassign before removal',
        creatorId: users.owner,
        assigneeId: member.id,
        teamId: teamA,
        scope: 'TEAM',
        status: 'ASSIGNED',
      },
    });
    expect((await agents.owner.delete(path)).status).toBe(409);
    await db.task.update({
      where: { id: active.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    expect((await agents.owner.delete(path)).status).toBe(200);
    await db.user.update({ where: { id: member.id }, data: { isActive: false } });
    expect((await agents.owner.put(path).send({})).status).toBe(409);
  });

  it('refreshes role and membership grants on existing sessions', async () => {
    await db.user.update({ where: { id: users.adminA }, data: { role: 'USER' } });
    try {
      expect((await agents.adminA.get('/api/v1/users')).status).toBe(403);
    } finally {
      await db.user.update({ where: { id: users.adminA }, data: { role: 'ADMIN' } });
    }
    expect((await agents.adminA.get('/api/v1/users')).status).toBe(200);
    await db.teamMembership.update({
      where: { userId_teamId: { userId: users.headA, teamId: teamA } },
      data: { isTeamHead: false },
    });
    try {
      expect((await agents.headA.get('/api/v1/users')).status).toBe(403);
    } finally {
      await db.teamMembership.update({
        where: { userId_teamId: { userId: users.headA, teamId: teamA } },
        data: { isTeamHead: true },
      });
    }
  });

  it('enforces deactivation immediately and protects club leadership accounts', async () => {
    const path = `/api/v1/users/${users.memberB}/status`;
    expect((await agents.adminA.patch(path).send({ isActive: false })).status).toBe(403);
    for (const name of ['owner', 'president']) {
      expect(
        (await agents.owner.patch(`/api/v1/users/${users[name]}/status`).send({ isActive: false }))
          .status,
      ).toBe(403);
    }
    expect((await agents.owner.patch(path).send({ isActive: false })).status).toBe(200);
    try {
      expect((await agents.memberB.get('/api/v1/users/me')).status).toBe(403);
      const denied = await request(app)
        .post('/api/v1/auth/dev-login')
        .send({ email: 'memberb@example.com', role: 'ADMIN' });
      expect(denied.status).toBe(403);
      expect((await db.user.findUniqueOrThrow({ where: { id: users.memberB } })).role).toBe('USER');
    } finally {
      await agents.owner.patch(path).send({ isActive: true });
    }
    expect((await agents.memberB.get('/api/v1/users/me')).status).toBe(200);
  });

  it('filters task lists and denies task details outside the caller team scope', async () => {
    const own = await task(teamA);
    const other = await task(teamB);
    const club = await task(null);
    const board = await agents.memberA.get('/api/v1/tasks');
    expect(board.status).toBe(200);
    const ids = board.body.data.map((row: { id: string }) => row.id);
    expect(ids).toContain(own.id);
    expect(ids).toContain(club.id);
    expect(ids).not.toContain(other.id);
    expect((await agents.memberA.get(`/api/v1/tasks/${other.id}`)).status).toBe(403);
    expect((await agents.memberA.get(`/api/v1/tasks?teamId=${teamB}`)).body.data).toEqual([]);
    expect((await agents.owner.get(`/api/v1/tasks/${other.id}`)).status).toBe(200);
    expect((await agents.memberA.post(`/api/v1/tasks/${other.id}/claim`).send({})).status).toBe(
      403,
    );
  });

  it('scopes task creation/deletion and supports USER team heads', async () => {
    const body = {
      title: 'Permission test',
      description: 'Create task permission test',
      teamId: teamA,
      scope: 'TEAM',
    };
    expect((await agents.memberA.post('/api/v1/tasks').send(body)).status).toBe(403);
    expect((await agents.adminB.post('/api/v1/tasks').send(body)).status).toBe(403);
    expect(
      (await agents.adminA.post('/api/v1/tasks').send({ ...body, assigneeId: users.memberB }))
        .status,
    ).toBe(400);
    expect(
      (
        await agents.adminA
          .post('/api/v1/tasks')
          .send({ title: body.title, description: body.description })
      ).status,
    ).toBe(403);
    const created = await agents.headA.post('/api/v1/tasks').send(body);
    expect(created.status).toBe(201);
    expect((await agents.adminB.delete(`/api/v1/tasks/${created.body.data.id}`)).status).toBe(403);
    expect((await agents.headA.delete(`/api/v1/tasks/${created.body.data.id}`)).status).toBe(200);
  });

  it('scopes review actions to the owning team and reserves club reviews to leadership', async () => {
    const own = await task(teamA, 'IN_REVIEW');
    await db.taskSubmission.create({
      data: { taskId: own.id, memberId: users.memberA, note: 'Ready' },
    });
    const path = `/api/v1/tasks/${own.id}/review`;
    expect(
      (
        await agents.adminB
          .post(path)
          .send({ outcome: 'SENT_BACK', reviewComment: 'Please revise' })
      ).status,
    ).toBe(403);
    expect(
      (
        await agents.memberA
          .post(path)
          .send({ outcome: 'SENT_BACK', reviewComment: 'Please revise' })
      ).status,
    ).toBe(403);
    expect(
      (await agents.headA.post(path).send({ outcome: 'SENT_BACK', reviewComment: 'Revise' }))
        .status,
    ).toBe(200);
    const club = await task(null, 'IN_REVIEW');
    await db.taskSubmission.create({ data: { taskId: club.id, memberId: users.memberA } });
    expect(
      (await agents.adminA.post(`/api/v1/tasks/${club.id}/review`).send({ outcome: 'APPROVED' }))
        .status,
    ).toBe(403);
    expect(
      (await agents.owner.post(`/api/v1/tasks/${club.id}/review`).send({ outcome: 'APPROVED' }))
        .status,
    ).toBe(200);
  });

  it('keeps task eligibility consistent when a claim races membership removal', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const member = await newUser('Concurrent member');
      await agents.owner.put(`/api/v1/teams/${teamA}/members/${member.id}`).send({});
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/dev-login').send({ email: member.email });
      const free = await task(teamA);
      const [claim, removal] = await Promise.all([
        agent.post(`/api/v1/tasks/${free.id}/claim`).send({}),
        agents.owner.delete(`/api/v1/teams/${teamA}/members/${member.id}`),
      ]);
      expect([200, 403, 409]).toContain(claim.status);
      expect([200, 409]).toContain(removal.status);
      const saved = await db.task.findUniqueOrThrow({ where: { id: free.id } });
      const membership = await db.teamMembership.findUnique({
        where: { userId_teamId: { userId: member.id, teamId: teamA } },
      });
      if (saved.assigneeId) expect(membership).not.toBeNull();
      if (!membership) expect(saved.status).toBe('FREE');
    }
  });

  it('publishes the users and teams API contract without requiring a session', async () => {
    const contract = await request(app).get('/api/v1/docs/openapi.json');
    expect(contract.status).toBe(200);
    expect(contract.body.paths['/users/me'].patch.requestBody).toBeDefined();
    expect(contract.body.paths['/teams/{teamId}/members/{userId}'].put).toBeDefined();
    expect(contract.body.components.securitySchemes.sessionCookie.name).toBe('gdgoc.sid');
  });

  it('rejects development login when running in production', async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(
        (await request(app).post('/api/v1/auth/dev-login').send({ email: 'membera@example.com' }))
          .status,
      ).toBe(403);
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it('rejects sessions whose user has been removed', async () => {
    await db.user.delete({ where: { id: users.outsider } });
    expect((await agents.outsider.get('/api/v1/users/me')).status).toBe(401);
  });

  it('rotates the session identifier on development login', async () => {
    const agent = request.agent(app);
    const first = await agent.post('/api/v1/auth/dev-login').send({ email: 'membera@example.com' });
    const second = await agent
      .post('/api/v1/auth/dev-login')
      .send({ email: 'membera@example.com' });
    expect(second.headers['set-cookie'][0]).not.toBe(first.headers['set-cookie'][0]);
  });

  it('destroys logout sessions and clears the configured cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/dev-login').send({ email: 'membera@example.com' });
    const logout = await agent.post('/api/v1/auth/logout').send({});
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie'][0]).toContain('gdgoc.sid=;');
    expect((await agent.get('/api/v1/users/me')).status).toBe(401);
  });
});
