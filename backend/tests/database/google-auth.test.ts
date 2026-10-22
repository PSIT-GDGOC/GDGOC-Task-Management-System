import { generateKeyPairSync, sign } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ipKeyGenerator } from 'express-rate-limit';
import request from 'supertest';
import { ApiFixture, createApiFixture } from './helpers/api-fixture';
import type { googleClient as GoogleClientType } from '../../src/services/google-auth.service';

let fixture: ApiFixture;
let client: typeof GoogleClientType;
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const cert = keys.publicKey.export({ format: 'pem', type: 'spki' }).toString();
const now = () => Math.floor(Date.now() / 1000);
function jwt(nonce: string, overrides: Record<string, unknown> = {}) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', kid: 'test-key', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      iss: 'https://accounts.google.com',
      aud: 'fixture.apps.googleusercontent.com',
      sub: 'google-test-subject',
      email: 'google-user@gmail.com',
      email_verified: true,
      name: 'Google User',
      nonce,
      iat: now(),
      exp: now() + 3600,
      ...overrides,
    }),
  ).toString('base64url');
  return `${header}.${payload}.${sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), keys.privateKey).toString('base64url')}`;
}
function mockProvider(token: string) {
  // Mock Google's network responses, not the official library's signature/claim verification.
  vi.spyOn(client, 'getToken').mockResolvedValue({
    tokens: { id_token: token, access_token: 'must-not-persist' },
    res: null,
  } as never);
  vi.spyOn(client, 'getFederatedSignonCertsAsync').mockResolvedValue({
    certs: { 'test-key': cert },
    format: 'PEM',
  } as never);
}
async function begin(agent: ReturnType<typeof request.agent>, portal = 'member') {
  const response = await agent.get('/api/v1/auth/google/url?portal=' + portal);
  expect(response.status).toBe(200);
  const url = new URL(response.body.url);
  return { state: url.searchParams.get('state')!, nonce: url.searchParams.get('nonce')!, url };
}
beforeAll(async () => {
  fixture = await createApiFixture();
  client = (await import('../../src/services/google-auth.service.js')).googleClient;
});
afterEach(() => vi.restoreAllMocks());
beforeEach(async () => {
  const limit = (await import('../../src/security/rateLimits.js')).authenticationLimit;
  for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', '::1'])
    await limit.resetKey(ipKeyGenerator(ip));
});
afterAll(async () => {
  if (fixture) await fixture.cleanup();
});

describe('Google OAuth and browser security', () => {
  it('uses state, nonce, PKCE and verifies a signed identity before rotating the session', async () => {
    const agent = request.agent(fixture.app);
    const attempt = await begin(agent);
    expect(attempt.url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(attempt.url.searchParams.get('code_challenge')).toBeTruthy();
    mockProvider(jwt(attempt.nonce));
    const response = await agent
      .get('/api/v1/auth/google/callback')
      .query({ state: attempt.state, code: 'one-time-code' });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('http://localhost:5173');
    expect(JSON.stringify(response.body)).not.toContain('must-not-persist');
    const me = await agent.get('/api/v1/auth/me');
    expect(me.body.user).toMatchObject({ email: 'google-user@gmail.com', role: 'USER' });
    expect(
      await fixture.db.user.findUnique({ where: { googleSubject: 'google-test-subject' } }),
    ).not.toBeNull();
    expect(
      (
        await agent
          .get('/api/v1/auth/google/callback')
          .query({ state: attempt.state, code: 'replay' })
      ).status,
    ).toBe(400);
  });

  it('rejects mismatched browser state and unsafe redirect selections', async () => {
    const agent = request.agent(fixture.app);
    await begin(agent);
    expect(
      (
        await agent
          .get('/api/v1/auth/google/callback')
          .query({ state: 'wrong-state-long-enough', code: 'fake' })
      ).status,
    ).toBe(400);
    expect((await agent.get('/api/v1/auth/google/url?portal=https://evil.example')).status).toBe(
      400,
    );
  });

  it.each([
    ['nonce', { nonce: 'wrong-nonce' }],
    ['audience', { aud: 'attacker-client' }],
    ['issuer', { iss: 'https://evil.example' }],
    ['unverified email', { email_verified: false }],
    ['expired token', { exp: now() - 3600, iat: now() - 7200 }],
  ])('rejects an invalid %s using real ID-token verification', async (_name, overrides) => {
    const agent = request.agent(fixture.app);
    const attempt = await begin(agent);
    mockProvider(jwt(attempt.nonce, overrides));
    expect(
      (
        await agent
          .get('/api/v1/auth/google/callback')
          .query({ state: attempt.state, code: 'code' })
      ).status,
    ).toBe(401);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });

  it('rejects an altered signature', async () => {
    const agent = request.agent(fixture.app);
    const attempt = await begin(agent);
    const parts = jwt(attempt.nonce).split('.');
    parts[2] = Buffer.from('invalid-signature').toString('base64url');
    mockProvider(parts.join('.'));
    expect(
      (
        await agent
          .get('/api/v1/auth/google/callback')
          .query({ state: attempt.state, code: 'code' })
      ).status,
    ).toBe(401);
  });

  it('blocks state reuse even for competing callbacks', async () => {
    const agent = request.agent(fixture.app);
    const attempt = await begin(agent, 'admin');
    mockProvider(
      jwt(attempt.nonce, { sub: 'other-google-subject', email: 'other-google@gmail.com' }),
    );
    const responses = await Promise.all(
      [1, 2].map(() =>
        agent
          .get('/api/v1/auth/google/callback')
          .query({ state: attempt.state, code: 'same-code' }),
      ),
    );
    expect(responses.map((res) => res.status).sort()).toEqual([302, 400]);
    expect(responses.find((res) => res.status === 302)!.headers.location).toBe(
      'http://localhost:5174',
    );
    expect(client.getToken).toHaveBeenCalledTimes(1);
  });

  it('requires CSRF tokens on cookie-authenticated writes and rejects foreign origins', async () => {
    const agent = request.agent(fixture.app);
    await agent.post('/api/v1/auth/dev-login').send({ email: 'membera@example.com' });
    expect((await agent.patch('/api/v1/users/me').send({ position: 'Forged change' })).status).toBe(
      403,
    );
    const csrf = await agent.get('/api/v1/auth/csrf');
    expect(
      (
        await agent
          .patch('/api/v1/users/me')
          .set('X-CSRF-Token', csrf.body.csrfToken)
          .set('Origin', 'https://evil.example')
          .send({ position: 'Forged' })
      ).status,
    ).toBe(403);
    expect(
      (
        await agent
          .patch('/api/v1/users/me')
          .set('X-CSRF-Token', csrf.body.csrfToken)
          .set('Origin', 'http://localhost:5173')
          .send({ position: 'Developer' })
      ).status,
    ).toBe(200);
  });

  it('blocks unregistered identities when registration is closed and links preregistered members', async () => {
    const { env } = await import('../../src/config/env.js');
    const { AuthService } = await import('../../src/services/auth.service.js');
    const previous = env.ALLOW_SELF_REGISTRATION;
    env.ALLOW_SELF_REGISTRATION = false;
    const identity = {
      email: 'preregistered@gmail.com',
      name: 'New Member',
      subject: 'new-preregistered-subject',
      authoritativeEmail: true,
    };
    try {
      await expect(AuthService.handleVerifiedGoogleUser(identity)).rejects.toMatchObject({
        statusCode: 403,
      });
      await fixture.agents.owner
        .post('/api/v1/users')
        .send({ email: identity.email, name: identity.name })
        .expect(201);
      expect(await AuthService.handleVerifiedGoogleUser(identity)).toMatchObject({
        googleSubject: identity.subject,
        role: 'USER',
      });
    } finally {
      env.ALLOW_SELF_REGISTRATION = previous;
    }
  });

  it('fails closed when Google login is explicitly disabled', async () => {
    const { env } = await import('../../src/config/env.js');
    const previous = env.GOOGLE_AUTH_ENABLED;
    env.GOOGLE_AUTH_ENABLED = false;
    try {
      expect((await request(fixture.app).get('/api/v1/auth/google')).status).toBe(503);
    } finally {
      env.GOOGLE_AUTH_ENABLED = previous;
    }
  });
});
