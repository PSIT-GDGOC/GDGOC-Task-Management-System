import crypto from 'node:crypto';
import type Redis from 'ioredis';
import { redis, redisPrefix } from '../lib/redis';

/** Cache is an optimization only; DB permission checks and writes never depend on it. */
export class QueryCache {
  constructor(
    private client: Redis | null,
    private prefix: string,
  ) {}
  async remember<T>(scope: unknown, load: () => Promise<T>): Promise<T> {
    if (!this.client) return load();
    let key: string;
    try {
      const revision = (await this.client.get(`${this.prefix}:cache-revision`)) ?? '0';
      key = `${this.prefix}:cache:${crypto
        .createHash('sha256')
        .update(JSON.stringify([revision, scope]))
        .digest('hex')}`;
      const cached = await this.client.get(key);
      if (cached !== null) return JSON.parse(cached) as T;
    } catch {
      return load();
    }
    const value = await load();
    try {
      await this.client.set(key!, JSON.stringify(value), 'EX', 30);
    } catch {
      /* Serve committed DB data on cache failure. */
    }
    return value;
  }
  async invalidate() {
    try {
      await this.client?.incr(`${this.prefix}:cache-revision`);
    } catch {
      /* Entries still expire after 30 seconds. */
    }
  }
}
export const queryCache = new QueryCache(redis, redisPrefix);
