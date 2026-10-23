import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiFixture, createApiFixture } from './helpers/api-fixture';
let fixture: ApiFixture;
beforeAll(async () => {
  fixture = await createApiFixture();
  const { db, users, teamA, teamB } = fixture;
  const createdAt = new Date('2026-10-01T00:00:00Z');
  for (const [title, user, teamId, deadline, isOnTime, completedAt] of [
    [
      'On time',
      users.memberA,
      teamA,
      new Date('2026-10-02T00:00:00Z'),
      true,
      new Date('2026-10-02T00:00:00Z'),
    ],
    [
      'Late',
      users.memberA,
      teamA,
      new Date('2026-10-02T00:00:00Z'),
      false,
      new Date('2026-10-03T00:00:00Z'),
    ],
    ['No deadline', users.memberA, null, null, true, new Date('2026-10-04T00:00:00Z')],
    ['Other team', users.memberB, teamB, null, true, new Date('2026-10-04T00:00:00Z')],
  ] as const) {
    await db.task.create({
      data: {
        title,
        description: 'Completed history fixture',
        creatorId: users.owner,
        assigneeId: user,
        completedById: user,
        approvedById: users.owner,
        teamId,
        scope: teamId ? 'TEAM' : 'WHOLE_CLUB',
        deadline,
        status: 'DONE',
        completedAt,
        isOnTime,
        createdAt,
      },
    });
  }
  await db.task.create({
    data: { title: 'Unfinished', description: 'Not a completed task', creatorId: users.owner },
  });
});
afterAll(async () => {
  if (fixture) await fixture.cleanup();
});
describe('Work history and completion statistics', () => {
  it('limits personal history to the member and requires authentication', async () => {
    expect((await fixture.agents.memberA.get('/api/v1/history/me')).body.pagination.total).toBe(3);
    expect(
      (await fixture.agents.memberA.get('/api/v1/history/me?userId=' + fixture.users.memberB))
        .status,
    ).toBe(403);
    expect((await fixture.agents.memberA.get('/api/v1/history')).status).toBe(403);
  });
  it('allows admin roles club-wide audit while USER heads are scoped to headed teams', async () => {
    expect((await fixture.agents.adminA.get('/api/v1/history')).body.pagination.total).toBe(4);
    expect((await fixture.agents.headA.get('/api/v1/history')).body.pagination.total).toBe(2);
    expect((await fixture.agents.headA.get('/api/v1/history?teamId=' + fixture.teamB)).status).toBe(
      403,
    );
  });
  it('calculates deadline-aware rates and defined lead time without counting unfinished tasks', async () => {
    const response = await fixture.agents.memberA.get('/api/v1/history/me/statistics');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      totalCompleted: 3,
      onTime: 1,
      late: 1,
      noDeadline: 1,
      onTimeRate: 50,
      averageLeadTimeHours: 48,
    });
    expect(response.body.data.byTeam).toHaveLength(2);
    expect(response.body.data.topContributors).toBeUndefined();
  });
  it('uses the same date, member, team, timing and pagination filters for lists and statistics', async () => {
    const query = '/api/v1/history?from=2026-10-02T00:00:00Z&to=2026-10-04T00:00:00Z&limit=1';
    expect((await fixture.agents.owner.get(query)).body.pagination).toMatchObject({
      total: 2,
      totalPages: 2,
    });
    expect(
      (await fixture.agents.owner.get('/api/v1/history/statistics?timing=late')).body.data
        .totalCompleted,
    ).toBe(1);
    expect(
      (await fixture.agents.owner.get('/api/v1/history?timing=no-deadline')).body.pagination.total,
    ).toBe(2);
    expect(
      (
        await fixture.agents.owner.get(
          '/api/v1/history/statistics?teamId=' + fixture.teamA + '&userId=' + fixture.users.memberA,
        )
      ).body.data.totalCompleted,
    ).toBe(2);
    expect(
      (
        await fixture.agents.owner.get(
          '/api/v1/history?from=2026-10-04T00:00:00Z&to=2026-10-01T00:00:00Z',
        )
      ).status,
    ).toBe(400);
  });
  it('returns explicit empty statistics and does not expand history through filters', async () => {
    const empty = await fixture.agents.outsider.get('/api/v1/history/me/statistics');
    expect(empty.body.data).toMatchObject({
      totalCompleted: 0,
      onTimeRate: null,
      averageLeadTimeHours: null,
      byTeam: [],
    });
    const audit = await fixture.agents.owner.get('/api/v1/history/statistics');
    expect(audit.body.data.topContributors[0]).toMatchObject({
      userId: fixture.users.memberA,
      completed: 3,
    });
  });
});
