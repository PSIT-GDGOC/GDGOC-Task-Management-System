import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { QueueEvents } from 'bullmq';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import express from 'express';
import request from 'supertest';
import type Redis from 'ioredis';
import { ApiFixture, createApiFixture } from '../database/helpers/api-fixture';
import type { startJobs as StartType } from '../../src/jobs/runtime';
import type { QueryCache as CacheType } from '../../src/cache/query-cache';
let fixture: ApiFixture;
let jobs: Awaited<ReturnType<typeof StartType>>;
let events: QueueEvents;
let client: Redis;
let Cache: typeof CacheType;
const prefix = `gdgoc-test-${randomUUID().slice(0, 8)}`;
let overdueId: string;
const previousUrl = process.env.REDIS_URL;
const previousPrefix = process.env.REDIS_PREFIX;
beforeAll(async () => {
  if (!process.env.TEST_REDIS_URL) throw new Error('TEST_REDIS_URL is required for Redis tests.');
  process.env.REDIS_URL = process.env.TEST_REDIS_URL;
  process.env.REDIS_PREFIX = prefix;
  fixture = await createApiFixture();
  client = (await import('../../src/lib/redis.js')).redis!;
  Cache = (await import('../../src/cache/query-cache.js')).QueryCache;
  const startJobs = (await import('../../src/jobs/runtime.js')).startJobs;
  jobs = await startJobs({
    url: process.env.TEST_REDIS_URL,
    prefix,
    database: fixture.db,
    schedule: false,
  });
  events = new QueueEvents('maintenance', {
    prefix,
    connection: { url: process.env.TEST_REDIS_URL },
  });
  events.on('error', () => {});
  await events.waitUntilReady();
  overdueId = (
    await fixture.db.task.create({
      data: {
        title: 'Overdue fixture',
        description: 'An overdue task for reminder checks',
        creatorId: fixture.users.owner,
        assigneeId: fixture.users.memberA,
        scope: 'TEAM',
        teamId: fixture.teamA,
        status: 'ASSIGNED',
        deadline: new Date(Date.now() - 60000),
      },
    })
  ).id;
});
afterAll(async () => {
  await jobs?.close();
  await events?.close();
  if (client) {
    let cursor = '0';
    do {
      const [next, keys] = await client.scan(cursor, 'MATCH', prefix + ':*', 'COUNT', 100);
      if (keys.length) await client.del(...keys);
      cursor = next;
    } while (cursor !== '0');
  }
  if (fixture) await fixture.cleanup();
  if (previousUrl === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = previousUrl;
  if (previousPrefix === undefined) delete process.env.REDIS_PREFIX;
  else process.env.REDIS_PREFIX = previousPrefix;
});
describe('Real Redis, BullMQ, caching and notifications', () => {
  it('processes idempotent overdue jobs without producing duplicate alerts', async () => {
    const first = await jobs.queue.add('overdue-scan', {});
    expect(first.opts.attempts).toBe(5);
    expect(await first.waitUntilFinished(events, 10000)).toMatchObject({ created: 1 });
    const second = await jobs.queue.add('overdue-scan', {});
    expect(await second.waitUntilFinished(events, 10000)).toMatchObject({ created: 0 });
    expect(await fixture.db.notification.count({ where: { taskId: overdueId } })).toBe(1);
  });
  it('isolates personal notifications and marks them read idempotently', async () => {
    const own = await fixture.agents.memberA.get('/api/v1/notifications?unreadOnly=true');
    expect(own.status).toBe(200);
    expect(own.body.unreadCount).toBe(1);
    const id = own.body.data[0].id;
    expect((await fixture.agents.memberB.get('/api/v1/notifications')).body.data).toEqual([]);
    expect(
      (await fixture.agents.memberB.patch(`/api/v1/notifications/${id}/read`).send({})).status,
    ).toBe(404);
    expect(
      (await fixture.agents.memberA.patch(`/api/v1/notifications/${id}/read`).send({})).status,
    ).toBe(200);
    expect((await fixture.agents.memberA.get('/api/v1/notifications')).body.unreadCount).toBe(0);
  });
  it('retries failed jobs and retains bounded failure metadata', async () => {
    const failed = await jobs.queue.add(
      'unknown-job',
      {},
      { attempts: 3, backoff: { type: 'fixed', delay: 20 } },
    );
    await expect(failed.waitUntilFinished(events, 10000)).rejects.toThrow(
      'Unknown maintenance job',
    );
    const saved = await jobs.queue.getJob(failed.id!);
    expect(saved!.attemptsMade).toBe(3);
    expect(await saved!.getState()).toBe('failed');
  });
  it('cleans expired OAuth state while retaining valid attempts', async () => {
    await fixture.db.oAuthAttempt.createMany({
      data: [
        {
          stateHash: prefix + '-expired',
          sessionHash: 'test',
          expiresAt: new Date(Date.now() - 10000),
        },
        {
          stateHash: prefix + '-valid',
          sessionHash: 'test',
          expiresAt: new Date(Date.now() + 60000),
        },
      ],
    });
    const job = await jobs.queue.add('cleanup', {});
    expect(await job.waitUntilFinished(events, 10000)).toMatchObject({ oauthStatesRemoved: 1 });
    expect(
      await fixture.db.oAuthAttempt.findUnique({ where: { stateHash: prefix + '-valid' } }),
    ).not.toBeNull();
  });
  it('separates cached permissions, invalidates revisions and falls back to DB on failure', async () => {
    const cache = new Cache(client, prefix + '-cache');
    let loads = 0;
    const load = async () => ({ value: ++loads });
    expect(await cache.remember(['user-A', 'USER'], load)).toEqual({ value: 1 });
    expect(await cache.remember(['user-A', 'USER'], load)).toEqual({ value: 1 });
    expect(await cache.remember(['user-A', 'ADMIN'], load)).toEqual({ value: 2 });
    await cache.invalidate();
    expect(await cache.remember(['user-A', 'USER'], load)).toEqual({ value: 3 });
    const ttlKeys = await client.keys(prefix + '-cache:cache:*');
    expect(await client.ttl(ttlKeys[0])).toBeGreaterThan(0);
    const create = (await import('../../src/lib/redis.js')).createRedis;
    const disconnected = create(process.env.TEST_REDIS_URL!);
    disconnected.disconnect();
    expect(await new Cache(disconnected, prefix).remember('fallback', load)).toEqual({ value: 4 });
    await client.del(prefix + '-cache:cache-revision', ...ttlKeys);
  });
  it('shares rate limits across independent HTTP instances', async () => {
    const make = () => {
      const app = express();
      app.use(
        rateLimit({
          windowMs: 60000,
          limit: 2,
          keyGenerator: () => 'shared-user',
          store: new RedisStore({
            prefix: prefix + ':shared-limit:',
            sendCommand: async (...args) => (await client.call(args[0], ...args.slice(1))) as never,
          }),
        }),
      );
      app.get('/', (_req, res) => res.json({ ok: true }));
      return app;
    };
    const a = make();
    const b = make();
    expect((await request(a).get('/')).status).toBe(200);
    expect((await request(b).get('/')).status).toBe(200);
    expect((await request(a).get('/')).status).toBe(429);
  });
  it('registers both recurring jobs and preserves one schedule each across worker restarts', async () => {
    const start = (await import('../../src/jobs/runtime.js')).startJobs;
    for (let restart = 0; restart < 2; restart++) {
      await jobs.close();
      jobs = await start({ url: process.env.TEST_REDIS_URL, prefix, database: fixture.db });
      expect(await jobs.queue.getJobSchedulersCount()).toBe(2);
      expect(await jobs.queue.getJobScheduler('overdue-scan')).toBeDefined();
      expect(await jobs.queue.getJobScheduler('cleanup')).toBeDefined();
    }
  });
  it('reports readiness and fails closed if distributed limits lose Redis', async () => {
    expect((await request(fixture.app).get('/health/ready')).status).toBe(200);
    client.disconnect();
    expect((await request(fixture.app).get('/health/ready')).status).toBe(503);
    expect((await fixture.agents.memberA.get('/api/v1/users/me')).status).toBe(503);
    await client.connect();
  });
});
