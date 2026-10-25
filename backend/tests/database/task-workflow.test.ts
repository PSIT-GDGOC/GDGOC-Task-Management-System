import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiFixture, createApiFixture } from './helpers/api-fixture';

let fixture: ApiFixture;
let db: ApiFixture['db'];
let teamA: string;
let teamB: string;
let users: ApiFixture['users'];
let agents: ApiFixture['agents'];

beforeAll(async () => {
  fixture = await createApiFixture();
  ({ db, teamA, teamB, users, agents } = fixture);
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

async function createTask(overrides: Record<string, unknown> = {}, actor = agents.adminA) {
  const response = await actor.post('/api/v1/tasks').send({
    title: `Workflow ${randomUUID()}`,
    description: 'Complete task workflow fixture',
    teamId: teamA,
    scope: 'TEAM',
    ...overrides,
  });
  expect(response.status).toBe(201);
  return response.body.data;
}
async function submitTask(
  overrides: Record<string, unknown> = {},
  evidence: Record<string, unknown> = { note: 'Completed design and shared files' },
) {
  const task = await createTask({ assigneeId: users.memberA, ...overrides });
  expect((await agents.memberA.post(`/api/v1/tasks/${task.id}/start`).send({})).status).toBe(200);
  const submitted = await agents.memberA.post(`/api/v1/tasks/${task.id}/submit`).send(evidence);
  expect(submitted.status).toBe(200);
  return submitted.body.data;
}

describe('Task Board lifecycle through the HTTP API', () => {
  it('creates normalized team tasks with an activity record', async () => {
    const created = await createTask({
      title: '  Prepare event assets  ',
      tags: [' Design ', 'DESIGN', 'Media'],
      priority: 'HIGH',
    });
    expect(created).toMatchObject({
      title: 'Prepare event assets',
      tags: ['design', 'media'],
      status: 'FREE',
      assigneeId: null,
    });
    expect(await db.taskActivity.findMany({ where: { taskId: created.id } })).toEqual([
      expect.objectContaining({ action: 'CREATED', actorId: users.adminA }),
    ]);
  });

  it('validates scope, text, and immutable fields before writing', async () => {
    for (const body of [
      { title: '   ', description: 'Description here' },
      { title: 'Valid task', description: 'Description here', scope: 'TEAM' },
      { title: 'Valid task', description: 'Description here', scope: 'WHOLE_CLUB', teamId: teamA },
      { title: 'Valid task', description: 'Description here', status: 'DONE' },
    ]) {
      expect((await agents.owner.post('/api/v1/tasks').send(body)).status).toBe(400);
    }
    expect(
      (
        await agents.adminA
          .post('/api/v1/tasks')
          .send({ title: 'Club task', description: 'Club-wide task description' })
      ).status,
    ).toBe(403);
    expect((await createTask({ teamId: null, scope: 'WHOLE_CLUB' }, agents.owner)).scope).toBe(
      'WHOLE_CLUB',
    );
  });

  it('returns a description error for the reported input and lets a team head assign corrected work', async () => {
    const input = {
      title: 'New Task',
      description: 'asdasd',
      scope: 'TEAM',
      teamId: teamA,
      assigneeId: users.memberA,
    };
    const before = await db.task.count();
    const invalid = await agents.headA.post('/api/v1/tasks').send(input);
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.description).toEqual([
      'Task description must be at least 10 characters.',
    ]);
    expect(invalid.body.error.details.title).toBeUndefined();
    expect(await db.task.count()).toBe(before);
    const assigned = await agents.headA
      .post('/api/v1/tasks')
      .send({ ...input, description: 'Build a UI' });
    expect(assigned.status).toBe(201);
    expect(assigned.body.data).toMatchObject({
      title: 'New Task',
      status: 'ASSIGNED',
      assigneeId: users.memberA,
      teamId: teamA,
      creatorId: users.headA,
    });
  });

  it('edits metadata, tracks before/after values, and ignores no-op changes', async () => {
    const created = await createTask();
    const path = `/api/v1/tasks/${created.id}`;
    const updated = await agents.adminA
      .patch(path)
      .send({ priority: 'URGENT', deadline: '2026-12-01T10:00:00+05:30', tags: ['Backend'] });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      priority: 'URGENT',
      deadline: '2026-12-01T04:30:00.000Z',
      tags: ['backend'],
    });
    const audit = await db.taskActivity.findFirstOrThrow({
      where: { taskId: created.id, action: 'UPDATED' },
    });
    expect(audit.details).toMatchObject({
      before: { priority: 'MEDIUM' },
      after: { priority: 'URGENT' },
    });
    const before = await db.taskActivity.count({ where: { taskId: created.id } });
    expect((await agents.adminA.patch(path).send({ priority: 'URGENT' })).status).toBe(200);
    expect(await db.taskActivity.count({ where: { taskId: created.id } })).toBe(before);
    expect(
      (await agents.adminA.patch(path).send({ deadline: null })).body.data.deadline,
    ).toBeNull();
    for (const body of [{}, { status: 'DONE' }, { teamId: teamB }, { assigneeId: users.memberA }]) {
      expect((await agents.adminA.patch(path).send(body)).status).toBe(400);
    }
    expect((await agents.memberA.patch(path).send({ title: 'Unauthorized change' })).status).toBe(
      403,
    );
    expect((await agents.adminB.patch(path).send({ title: 'Wrong team change' })).status).toBe(403);
  });

  it('assigns, reassigns and unassigns with correct status and ownership', async () => {
    const created = await createTask();
    const path = `/api/v1/tasks/${created.id}`;
    expect(
      (await agents.adminA.post(path + '/assign').send({ assigneeId: users.memberA })).body.data,
    ).toMatchObject({ assigneeId: users.memberA, status: 'ASSIGNED' });
    const count = await db.taskActivity.count({ where: { taskId: created.id } });
    await agents.adminA.post(path + '/assign').send({ assigneeId: users.memberA });
    expect(await db.taskActivity.count({ where: { taskId: created.id } })).toBe(count);
    expect((await agents.memberA.post(path + '/start').send({})).body.data.status).toBe(
      'IN_PROGRESS',
    );
    expect(
      (await agents.adminA.post(path + '/assign').send({ assigneeId: users.headA })).body.data,
    ).toMatchObject({ assigneeId: users.headA, status: 'ASSIGNED' });
    expect((await agents.memberA.post(path + '/start').send({})).status).toBe(403);
    expect((await agents.headA.post(path + '/start').send({})).status).toBe(200);
    expect(
      (await agents.adminA.post(path + '/assign').send({ assigneeId: null })).body.data,
    ).toMatchObject({ assigneeId: null, status: 'FREE' });
    expect(
      await db.taskActivity.count({ where: { taskId: created.id, action: 'REASSIGNED' } }),
    ).toBe(2);
  });

  it('rejects ineligible assignments and cross-team management', async () => {
    const created = await createTask();
    const path = `/api/v1/tasks/${created.id}/assign`;
    expect((await agents.adminB.post(path).send({ assigneeId: users.memberA })).status).toBe(403);
    expect((await agents.memberA.post(path).send({ assigneeId: users.memberA })).status).toBe(403);
    expect((await agents.adminA.post(path).send({ assigneeId: users.memberB })).status).toBe(400);
    expect((await agents.adminA.post(path).send({ assigneeId: 'missing-user' })).status).toBe(404);
    const inactive = await newUser('Inactive task candidate');
    await db.user.update({ where: { id: inactive.id }, data: { isActive: false } });
    expect((await agents.adminA.post(path).send({ assigneeId: inactive.id })).status).toBe(400);
    const club = await createTask({ scope: 'WHOLE_CLUB', teamId: null }, agents.owner);
    expect(
      (
        await agents.owner
          .post(`/api/v1/tasks/${club.id}/assign`)
          .send({ assigneeId: users.memberB })
      ).status,
    ).toBe(200);
  });

  it('allows exactly one simultaneous claim and one claim event', async () => {
    const created = await createTask();
    const path = `/api/v1/tasks/${created.id}/claim`;
    const results = await Promise.all([
      agents.memberA.post(path).send({}),
      agents.headA.post(path).send({}),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    expect(await db.taskActivity.count({ where: { taskId: created.id, action: 'CLAIMED' } })).toBe(
      1,
    );
  });

  it('blocks skipped/repeated transitions and non-assignee start/submit actions', async () => {
    const created = await createTask();
    const path = `/api/v1/tasks/${created.id}`;
    expect((await agents.adminA.post(path + '/review').send({ outcome: 'APPROVED' })).status).toBe(
      409,
    );
    await agents.memberA.post(path + '/claim').send({});
    expect((await agents.memberA.post(path + '/submit').send({ note: 'Too early' })).status).toBe(
      409,
    );
    expect((await agents.headA.post(path + '/start').send({})).status).toBe(403);
    expect((await agents.memberA.post(path + '/start').send({})).status).toBe(200);
    expect((await agents.memberA.post(path + '/start').send({})).status).toBe(409);
    expect(
      (await agents.headA.post(path + '/submit').send({ note: 'Someone else work' })).status,
    ).toBe(403);
  });

  it('supports note-only submissions and validates/canonicalizes PR URLs', async () => {
    const created = await createTask({ assigneeId: users.memberA });
    const path = `/api/v1/tasks/${created.id}`;
    await agents.memberA.post(path + '/start').send({});
    for (const body of [
      {},
      { note: '   ' },
      { prUrl: 'not a URL' },
      { prUrl: 'https://example.com/org/repo/pull/1' },
      { prUrl: 'https://github.com/org/repo/issues/1' },
      { prUrl: 'http://github.com/org/repo/pull/1' },
    ]) {
      expect((await agents.memberA.post(path + '/submit').send(body)).status).toBe(400);
    }
    const submitted = await agents.memberA.post(path + '/submit').send({
      prUrl: 'https://github.com/PSIT-GDGOC/club/pull/12/?tab=files#review',
      note: ' Ready ',
    });
    expect(submitted.status).toBe(200);
    expect(submitted.body.data.submissions[0]).toMatchObject({
      prUrl: 'https://github.com/PSIT-GDGOC/club/pull/12',
      note: 'Ready',
    });
    const noteOnly = await submitTask();
    expect(noteOnly.submissions[0].prUrl).toBeNull();
  });

  it('allows exactly one simultaneous submission with no orphan records', async () => {
    const created = await createTask({ assigneeId: users.memberA });
    const path = `/api/v1/tasks/${created.id}`;
    await agents.memberA.post(path + '/start').send({});
    const results = await Promise.all(
      [1, 2].map(() => agents.memberA.post(path + '/submit').send({ note: 'Ready for review' })),
    );
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    expect(await db.taskSubmission.count({ where: { taskId: created.id } })).toBe(1);
    expect(
      await db.taskActivity.count({
        where: { taskId: created.id, action: 'SUBMITTED_FOR_REVIEW' },
      }),
    ).toBe(1);
  });

  it('requires send-back feedback and retains each submission/review attempt', async () => {
    const submitted = await submitTask();
    const path = `/api/v1/tasks/${submitted.id}`;
    expect((await agents.adminA.post(path + '/review').send({ outcome: 'SENT_BACK' })).status).toBe(
      400,
    );
    expect(
      (
        await agents.adminA
          .post(path + '/review')
          .send({ outcome: 'SENT_BACK', reviewComment: '   ' })
      ).status,
    ).toBe(400);
    expect(
      (
        await agents.adminA
          .post(path + '/review')
          .send({ outcome: 'SENT_BACK', reviewComment: 'Add the missing assets' })
      ).body.data.status,
    ).toBe('IN_PROGRESS');
    expect(
      (await agents.memberA.post(path + '/submit').send({ note: 'Added the missing assets' }))
        .status,
    ).toBe(200);
    expect(
      (await agents.adminA.post(path + '/review').send({ outcome: 'APPROVED' })).body.data.status,
    ).toBe('DONE');
    const history = (await agents.memberA.get(path)).body.data;
    expect(history.submissions).toHaveLength(2);
    expect(history.submissions.map((entry: { outcome: string }) => entry.outcome).sort()).toEqual([
      'APPROVED',
      'SENT_BACK',
    ]);
    expect(history).toMatchObject({
      completedById: users.memberA,
      approvedById: users.adminA,
      isOnTime: true,
    });
    expect(
      history.activities.some((entry: { action: string }) => entry.action === 'SENT_BACK'),
    ).toBe(true);
  });

  it('rejects self-review even when the assignee is a team administrator', async () => {
    const created = await createTask({ assigneeId: users.adminA });
    const path = `/api/v1/tasks/${created.id}`;
    await agents.adminA.post(path + '/start').send({});
    await agents.adminA.post(path + '/submit').send({ note: 'My completed work' });
    expect((await agents.adminA.post(path + '/review').send({ outcome: 'APPROVED' })).status).toBe(
      403,
    );
    expect((await agents.owner.post(path + '/review').send({ outcome: 'APPROVED' })).status).toBe(
      200,
    );
  });

  it('rejects inconsistent review records without partially completing the task', async () => {
    const inconsistent = await task(teamA, 'IN_REVIEW');
    expect(
      (
        await agents.adminA
          .post(`/api/v1/tasks/${inconsistent.id}/review`)
          .send({ outcome: 'APPROVED' })
      ).status,
    ).toBe(409);
    expect((await db.task.findUniqueOrThrow({ where: { id: inconsistent.id } })).status).toBe(
      'IN_REVIEW',
    );
    expect(
      await db.taskActivity.count({ where: { taskId: inconsistent.id, action: 'APPROVED' } }),
    ).toBe(0);
  });

  it('uses submission time rather than approval time for on-time completion', async () => {
    const submitted = await submitTask({ deadline: new Date(Date.now() - 60000).toISOString() });
    await db.taskSubmission.update({
      where: { id: submitted.submissions[0].id },
      data: { submittedAt: new Date(Date.now() - 120000) },
    });
    const response = await agents.adminA
      .post(`/api/v1/tasks/${submitted.id}/review`)
      .send({ outcome: 'APPROVED' });
    expect(response.status).toBe(200);
    expect(response.body.data.isOnTime).toBe(true);
    const late = await submitTask({ deadline: new Date(Date.now() - 60000).toISOString() });
    expect(
      (await agents.adminA.post(`/api/v1/tasks/${late.id}/review`).send({ outcome: 'APPROVED' }))
        .body.data.isOnTime,
    ).toBe(false);
  });

  it('serializes competing review decisions and records only the winning decision', async () => {
    const submitted = await submitTask();
    const path = `/api/v1/tasks/${submitted.id}/review`;
    const results = await Promise.all([
      agents.adminA.post(path).send({ outcome: 'APPROVED' }),
      agents.owner.post(path).send({ outcome: 'SENT_BACK', reviewComment: 'Needs another pass' }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    expect(
      await db.taskActivity.count({
        where: { taskId: submitted.id, action: { in: ['APPROVED', 'SENT_BACK'] } },
      }),
    ).toBe(1);
    expect(
      await db.taskSubmission.count({ where: { taskId: submitted.id, outcome: { not: null } } }),
    ).toBe(1);
  });

  it('keeps reassignment and a competing submission attached to the correct assignee', async () => {
    const created = await createTask({ assigneeId: users.memberA });
    const path = `/api/v1/tasks/${created.id}`;
    await agents.memberA.post(path + '/start').send({});
    const [submission, assignment] = await Promise.all([
      agents.memberA.post(path + '/submit').send({ note: 'Ready before reassignment' }),
      agents.adminA.post(path + '/assign').send({ assigneeId: users.headA }),
    ]);
    expect([200, 403, 409]).toContain(submission.status);
    expect([200, 409]).toContain(assignment.status);
    expect([submission, assignment].filter((response) => response.status === 200)).toHaveLength(1);
    const saved = await db.task.findUniqueOrThrow({
      where: { id: created.id },
      include: { submissions: true },
    });
    if (saved.status === 'IN_REVIEW') {
      expect(saved.assigneeId).toBe(users.memberA);
      expect(saved.submissions).toEqual([
        expect.objectContaining({ memberId: users.memberA, outcome: null }),
      ]);
    } else {
      expect(saved).toMatchObject({ status: 'ASSIGNED', assigneeId: users.headA });
      expect(saved.submissions).toHaveLength(0);
    }
  });

  it('measures a revised submission independently of an earlier on-time attempt', async () => {
    const submitted = await submitTask({ deadline: new Date(Date.now() - 60000).toISOString() });
    const path = `/api/v1/tasks/${submitted.id}`;
    await db.taskSubmission.update({
      where: { id: submitted.submissions[0].id },
      data: { submittedAt: new Date(Date.now() - 120000) },
    });
    expect(
      (
        await agents.adminA
          .post(path + '/review')
          .send({ outcome: 'SENT_BACK', reviewComment: 'Revise the deliverable' })
      ).status,
    ).toBe(200);
    expect(
      (await agents.memberA.post(path + '/submit').send({ note: 'Revised after deadline' })).status,
    ).toBe(200);
    const approval = await agents.adminA.post(path + '/review').send({ outcome: 'APPROVED' });
    expect(approval.status).toBe(200);
    expect(approval.body.data.isOnTime).toBe(false);
  });

  it('locks in-review and completed tasks against edits, reassignment, and deletion', async () => {
    const submitted = await submitTask();
    const path = `/api/v1/tasks/${submitted.id}`;
    for (let phase = 0; phase < 2; phase++) {
      expect((await agents.adminA.patch(path).send({ deadline: null })).status).toBe(409);
      expect(
        (await agents.adminA.post(path + '/assign').send({ assigneeId: users.headA })).status,
      ).toBe(409);
      expect((await agents.adminA.delete(path)).status).toBe(409);
      if (phase === 0)
        expect(
          (await agents.adminA.post(path + '/review').send({ outcome: 'APPROVED' })).status,
        ).toBe(200);
    }
  });

  it('soft-deletes editable tasks while preserving the audit and hiding all actions', async () => {
    const created = await createTask();
    const path = `/api/v1/tasks/${created.id}`;
    expect((await agents.adminA.delete(path)).body.data.isDeleted).toBe(true);
    expect((await agents.adminA.get(path)).status).toBe(404);
    expect((await agents.memberA.post(path + '/claim').send({})).status).toBe(404);
    expect(
      (await agents.adminA.post(path + '/assign').send({ assigneeId: users.memberA })).status,
    ).toBe(404);
    expect((await agents.adminA.patch(path).send({ title: 'Deleted task edit' })).status).toBe(404);
    expect(
      (await agents.adminA.get(`/api/v1/tasks?search=${encodeURIComponent(created.title)}`)).body
        .pagination.total,
    ).toBe(0);
    expect(await db.taskActivity.count({ where: { taskId: created.id, action: 'DELETED' } })).toBe(
      1,
    );
  });

  it('paginates and filters deterministically without widening visibility', async () => {
    const token = randomUUID();
    const a = await createTask({
      title: `Page ${token} A`,
      priority: 'HIGH',
      tags: ['Pagination'],
    });
    const b = await createTask({
      title: `Page ${token} B`,
      priority: 'URGENT',
      tags: ['Pagination'],
    });
    await createTask(
      { title: `Page ${token} Foreign`, teamId: teamB, tags: ['Pagination'] },
      agents.owner,
    );
    const query = `/api/v1/tasks?search=${token}&tag=PAGINATION&limit=1`;
    const first = await agents.memberA.get(query);
    const second = await agents.memberA.get(query + '&page=2');
    expect(first.body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(first.body.count).toBe(1);
    expect(first.body.data[0].id).toBe(b.id);
    expect(second.body.data[0].id).toBe(a.id);
    expect((await agents.memberA.get(query + '&priority=HIGH')).body.pagination.total).toBe(1);
    expect((await agents.memberA.get(query + '&page=3')).body.data).toEqual([]);
    expect((await agents.memberA.get('/api/v1/tasks?limit=0')).status).toBe(400);
    expect((await agents.memberA.get('/api/v1/tasks?status=INVALID')).status).toBe(400);
  });
});
