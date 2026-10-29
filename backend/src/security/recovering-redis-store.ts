import { RedisStore } from 'rate-limit-redis';

/** Script loading can fail before Render's Redis connection is ready. Retry on
 * later requests, preserving the shared counters and failing closed on outages. */
export class RecoveringRedisStore extends RedisStore {
  private configuration?: Parameters<RedisStore['init']>[0];
  private readyPromise?: Promise<void>;

  override init(configuration: Parameters<RedisStore['init']>[0]) {
    this.configuration = configuration;
    return this.ensureReady();
  }

  private ensureReady(): Promise<void> {
    if (!this.configuration) return Promise.reject(new Error('Rate-limit store is not configured'));
    if (!this.readyPromise) {
      this.readyPromise = super.init(this.configuration).catch(error => {
        this.readyPromise = undefined;
        throw error;
      });
    }
    return this.readyPromise;
  }

  override async increment(key: string) {
    try { await this.ensureReady(); return await super.increment(key); }
    catch (error) { this.readyPromise = undefined; throw error; }
  }

  override async get(key: string) {
    try { await this.ensureReady(); return await super.get(key); }
    catch (error) { this.readyPromise = undefined; throw error; }
  }
}
