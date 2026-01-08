import { RedisClientType } from 'redis';

import { logger } from './logger';

/**
 * Cache utility implementing Stale-While-Revalidate (SWR) pattern using Redis.
 */
export class CacheUtil {
  constructor(private client: RedisClientType) {}

  /**
   * Get target value from cache, or fetch it and update cache.
   * @param key Redis key
   * @param fetchFunction Async function to fetch data if cache is missing or stale
   * @param ttl Time to live in seconds
   * @param swrTtl Extra time to allow serving stale data while revalidating (in seconds)
   */
  async getOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl = 300,
    swrTtl = 600,
  ): Promise<T> {
    try {
      const cached = await this.client.get(key);

      if (cached) {
        const { data, expiry } = JSON.parse(cached);
        const now = Date.now();

        if (now < expiry) {
          // Cache is fresh
          return data as T;
        }

        // Cache is stale but within SWR window - serve stale and revalidate in background
        logger.debug(`SWR: Serving stale data for key: ${key}`);
        this.revalidate(key, fetchFunction, ttl, swrTtl);
        return data as T;
      }

      // Cache miss - fetch and wait
      logger.debug(`Cache miss for key: ${key}`);
      return await this.revalidate(key, fetchFunction, ttl, swrTtl);
    } catch (err) {
      logger.error(`Cache error for key ${key}:`, err);
      return await fetchFunction();
    }
  }

  private async revalidate<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number,
    swrTtl: number,
  ): Promise<T> {
    const data = await fetchFunction();
    const expiry = Date.now() + ttl * 1000;

    // Store with total TTL (fresh + SWR window)
    await this.client.setEx(key, ttl + swrTtl, JSON.stringify({ data, expiry }));

    return data;
  }
}
