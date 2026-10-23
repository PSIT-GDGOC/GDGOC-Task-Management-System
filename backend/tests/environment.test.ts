import { describe, expect, it } from 'vitest';
import { parseEnvironment } from '../src/config/env';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://fixture:fake@database.invalid/postgres?sslmode=require',
  DIRECT_URL: 'postgresql://fixture:fake@database.invalid/postgres?sslmode=require',
  SESSION_SECRET: 'fixture-only-0123456789abcdef0123456789abcdef',
  CLIENT_ORIGIN: 'https://member.invalid',
  ADMIN_ORIGIN: 'https://admin.invalid',
  SYSTEM_OWNER_EMAIL: 'gdgoc.psit@gmail.com',
  REDIS_URL: 'rediss://redis.invalid:6379',
  GOOGLE_AUTH_ENABLED: 'false',
};

describe('Production configuration boundaries', () => {
  it('supports a deployment with Google explicitly disabled and registration closed', () => {
    expect(parseEnvironment(production)).toMatchObject({
      GOOGLE_AUTH_ENABLED: false,
      ENABLE_DEV_LOGIN: false,
      ALLOW_SELF_REGISTRATION: false,
    });
    expect(() => parseEnvironment({ ...production, GOOGLE_AUTH_ENABLED: 'true' })).toThrow(
      'GOOGLE_CLIENT_ID',
    );
  });
  it.each([
    ['ENABLE_DEV_LOGIN', 'true'],
    ['SESSION_SECRET', 'super-secret-random-key-at-least-32-chars-long'],
    ['CLIENT_ORIGIN', 'http://member.invalid'],
    ['DATABASE_URL', 'postgresql://fixture:fake@database.invalid/postgres'],
    ['DIRECT_URL', 'postgresql://fixture:fake@database.invalid/postgres'],
    ['REDIS_URL', 'redis://redis.invalid:6379'],
    ['SYSTEM_OWNER_EMAIL', undefined],
  ])('rejects an unsafe/missing %s', (key, value) => {
    expect(() => parseEnvironment({ ...production, [key]: value })).toThrow();
  });
  it('allows only the explicit private Render Redis transport exception', () => {
    const input = {
      ...production,
      RENDER: 'true',
      REDIS_TRANSPORT: 'render-internal',
      REDIS_URL: 'redis://red-fixture:6379',
    };
    expect(parseEnvironment(input).REDIS_TRANSPORT).toBe('render-internal');
    expect(() => parseEnvironment({ ...input, RENDER: undefined })).toThrow();
    expect(() =>
      parseEnvironment({ ...input, REDIS_URL: 'redis://public.invalid:6379' }),
    ).toThrow();
  });
  it('restricts an initial Render deployment to its own origin until frontend origins are set', () => {
    const initial = {
      ...production,
      CLIENT_ORIGIN: undefined,
      ADMIN_ORIGIN: undefined,
      RENDER: 'true',
      RENDER_EXTERNAL_URL: 'https://fixture.onrender.com',
    };
    expect(parseEnvironment(initial)).toMatchObject({
      CLIENT_ORIGIN: initial.RENDER_EXTERNAL_URL,
      ADMIN_ORIGIN: initial.RENDER_EXTERNAL_URL,
    });
    expect(() => parseEnvironment({ ...initial, GOOGLE_AUTH_ENABLED: 'true' })).toThrow();
    expect(() =>
      parseEnvironment({ ...initial, RENDER_EXTERNAL_URL: 'http://fixture.onrender.com' }),
    ).toThrow();
  });
});
