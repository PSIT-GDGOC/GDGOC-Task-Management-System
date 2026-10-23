import Redis from 'ioredis';
import { env } from '../config/env';

export function createRedis(url: string) {
  const client = new Redis(url, {
    lazyConnect: false,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    commandTimeout: 2500,
    retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
  });
  client.on('error', () => {
    /* Connection failures are surfaced by readiness and commands; never log credentials. */
  });
  return client;
}
export const redis = env.REDIS_URL ? createRedis(env.REDIS_URL) : null;
export const redisPrefix = env.REDIS_PREFIX;
export async function closeRedis() {
  if (redis) redis.disconnect();
}
