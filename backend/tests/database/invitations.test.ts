import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ApiFixture, createApiFixture } from './helpers/api-fixture';
import type { invitationLimit as LimitType } from '../../src/security/rateLimits';
let fixture: ApiFixture;
let limit: typeof LimitType;
const base = '/api/v1/auth/invitations';
beforeAll(async () => {
  fixture = await createApiFixture();
  limit = (await import('../../src/security/rateLimits.js')).invitationLimit;
});
beforeEach(async () => {
  for (const id of Object.values(fixture.users)) await limit.resetKey(id);
});
afterAll(async () => {
  if (fixture) await fixture.cleanup();
});
async function create(body: Record<string, unknown> = {}, agent = fixture.agents.owner) {
  const response = await agent.post(base).send(body);
  expect(response.status).toBe(201);
  return response.body.data;
}
describe('Admin invitation lifecycle', () => {
  it('restricts issuing/listing, returns raw codes once, and stores only a digest', async () => {
    const invite = await create({ teamId: fixture.teamA, email: ' MEMBERA@EXAMPLE.COM ' });
    expect(invite).toMatchObject({
      intendedEmail: 'membera@example.com',
      intendedRole: 'ADMIN',
      status: 'ACTIVE',
    });
    expect(invite.rawCode).toMatch(/^inv_[A-Za-z0-9_-]{43}$/);
    const stored = await fixture.db.adminInvitation.findUniqueOrThrow({ where: { id: invite.id } });
    expect(stored.hashedCode).toHaveLength(64);
    expect(stored.hashedCode).not.toBe(invite.rawCode);
    const list = await fixture.agents.owner.get(base);
    expect(list.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toContain(invite.rawCode);
    expect(JSON.stringify(list.body)).not.toContain(stored.hashedCode);
    expect((await fixture.agents.adminA.get(base)).status).toBe(403);
    expect((await fixture.agents.memberA.post(base).send({})).status).toBe(403);
  });
  it('allows only owners to grant/manage president invitations and rejects owner-role grants', async () => {
    expect((await fixture.agents.president.post(base).send({ role: 'PRESIDENT' })).status).toBe(
      403,
    );
    expect((await fixture.agents.owner.post(base).send({ role: 'SYSTEM_OWNER' })).status).toBe(400);
    const invite = await create({ role: 'PRESIDENT' });
    expect(
      (await fixture.agents.president.post(`${base}/${invite.id}/revoke`).send({})).status,
    ).toBe(403);
    const list = await fixture.agents.president.get(base);
    expect(list.body.data.some((row: { id: string }) => row.id === invite.id)).toBe(false);
  });
  it('binds intended recipients and atomically grants the role plus team-head membership', async () => {
    const invite = await create({
      teamId: fixture.teamA,
      email: 'membera@example.com',
      position: 'Tech Head',
    });
    expect(
      (await fixture.agents.memberB.post(base + '/redeem').send({ code: invite.rawCode })).status,
    ).toBe(403);
    const redeemed = await fixture.agents.memberA
      .post(base + '/redeem')
      .send({ code: invite.rawCode });
    expect(redeemed.status).toBe(200);
    expect(redeemed.body.user).toMatchObject({ role: 'ADMIN', position: 'Tech Head' });
    fixture.agents.memberA.set('X-CSRF-Token', redeemed.body.csrfToken);
    expect(
      await fixture.db.teamMembership.findUnique({
        where: { userId_teamId: { userId: fixture.users.memberA, teamId: fixture.teamA } },
      }),
    ).toMatchObject({ isTeamHead: true });
    expect(
      (await fixture.agents.memberA.post(base + '/redeem').send({ code: invite.rawCode })).status,
    ).toBe(409);
    expect(
      await fixture.db.adminEvent.count({
        where: { resourceId: invite.id, action: 'INVITATION_REDEEMED' },
      }),
    ).toBe(1);
  });
  it('permits exactly one competing redemption without granting the losing account', async () => {
    const invite = await create();
    const beforeA = await fixture.db.user.findUniqueOrThrow({ where: { id: fixture.users.headA } });
    const beforeB = await fixture.db.user.findUniqueOrThrow({
      where: { id: fixture.users.outsider },
    });
    const results = await Promise.all(
      [fixture.agents.headA, fixture.agents.outsider].map((agent) =>
        agent.post(base + '/redeem').send({ code: invite.rawCode }),
      ),
    );
    expect(results.map((res) => res.status).sort()).toEqual([200, 409]);
    const inviteRow = await fixture.db.adminInvitation.findUniqueOrThrow({
      where: { id: invite.id },
    });
    const loserId = inviteRow.usedById === beforeA.id ? beforeB.id : beforeA.id;
    expect((await fixture.db.user.findUniqueOrThrow({ where: { id: loserId } })).role).toBe('USER');
    for (let index = 0; index < results.length; index++)
      if (results[index].status === 200)
        [fixture.agents.headA, fixture.agents.outsider][index].set(
          'X-CSRF-Token',
          results[index].body.csrfToken,
        );
  });
  it('revokes idempotently, tracks status, and prevents future redemption', async () => {
    const invite = await create();
    expect((await fixture.agents.owner.post(`${base}/${invite.id}/revoke`).send({})).status).toBe(
      200,
    );
    expect((await fixture.agents.owner.post(`${base}/${invite.id}/revoke`).send({})).status).toBe(
      200,
    );
    expect(
      (await fixture.agents.memberB.post(base + '/redeem').send({ code: invite.rawCode })).status,
    ).toBe(400);
    expect(
      await fixture.db.adminEvent.count({
        where: { resourceId: invite.id, action: 'INVITATION_REVOKED' },
      }),
    ).toBe(1);
    expect(
      (await fixture.agents.owner.get(base + '?status=REVOKED')).body.data.some(
        (row: { id: string }) => row.id === invite.id,
      ),
    ).toBe(true);
  });
  it('rejects expired codes, leadership downgrades, and invalid/missing teams', async () => {
    const invite = await create();
    await fixture.db.adminInvitation.update({
      where: { id: invite.id },
      data: {
        createdAt: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000),
      },
    });
    expect(
      (await fixture.agents.memberB.post(base + '/redeem').send({ code: invite.rawCode })).status,
    ).toBe(400);
    const active = await create();
    expect(
      (await fixture.agents.owner.post(base + '/redeem').send({ code: active.rawCode })).status,
    ).toBe(403);
    expect(
      (await fixture.agents.president.post(base + '/redeem').send({ code: active.rawCode })).status,
    ).toBe(403);
    expect((await fixture.agents.owner.post(base).send({ teamId: 'missing-team' })).status).toBe(
      404,
    );
    expect((await fixture.agents.owner.post(base).send({ expiresInHours: 0 })).status).toBe(400);
    expect(
      (await fixture.agents.memberB.post(base + '/redeem').send({ code: 'invalid' })).status,
    ).toBe(400);
  });
  it('invalidates outstanding authority when the issuer is deactivated', async () => {
    const invite = await create({}, fixture.agents.president);
    await fixture.db.user.update({
      where: { id: fixture.users.president },
      data: { isActive: false },
    });
    try {
      expect(
        (await fixture.agents.memberB.post(base + '/redeem').send({ code: invite.rawCode })).status,
      ).toBe(409);
    } finally {
      await fixture.db.user.update({
        where: { id: fixture.users.president },
        data: { isActive: true },
      });
    }
  });
});
