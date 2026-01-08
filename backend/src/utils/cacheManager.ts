import { logger } from './logger';
import { getCache, getClient, setCache } from './redis';

const l1Cache = new Map<string, { value: any; expires: number }>();
const DEFAULT_L1_TTL = 60; // seconds for L1

/**
 * Cache Manager
 * Wrapper around Redis util with L1 (In-Memory) + L2 (Redis) strategy.
 */
export const cache = {
  /**
   * Get value from cache
   * Checks L1 first, then L2 (Redis). If L2 hit, populates L1.
   */
  get: async (key: string) => {
    const now = Date.now();
    const l1Item = l1Cache.get(key);

    if (l1Item && l1Item.expires > now) {
      logger.debug({ key }, 'Cache L1 HIT');
      return l1Item.value;
    }

    if (l1Item) {
      l1Cache.delete(key); // Cleanup expired
    }

    const value = await getCache(key);
    if (value !== null) {
      logger.debug({ key }, 'Cache L2 HIT');
      // Populate L1 with short TTL
      l1Cache.set(key, {
        value,
        expires: now + DEFAULT_L1_TTL * 1000,
      });
    }

    return value;
  },

  /**
   * Set value in cache
   * Sets in both L1 and L2.
   */
  set: async (key: string, value: any, options?: { ttl?: number; tags?: string[] }) => {
    const ttl = options?.ttl || 300;
    const now = Date.now();

    // Set L1
    l1Cache.set(key, {
      value,
      expires: now + Math.min(ttl, DEFAULT_L1_TTL) * 1000,
    });

    // Set L2
    return await setCache(key, value, ttl);
  },

  /**
   * Delete value from cache
   */
  delete: async (key: string) => {
    l1Cache.delete(key);
    const redisClient = getClient();
    if (!redisClient) {
      return false;
    }
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
      return false;
    }
  },

  /**
   * Close connection
   */
  close: async () => {
    l1Cache.clear();
    const redisClient = getClient();
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
  },

  /**
   * Get stats
   */
  getStats: () => {
    const redisClient = getClient();
    return {
      connected: redisClient?.isOpen || false,
      type: 'layered',
      l1Size: l1Cache.size,
    };
  },

  /**
   * Warm cache with multiple items
   */
  warm: async (
    items: { key: string; value: any; options?: { ttl?: number; tags?: string[] } }[],
  ) => {
    const results = await Promise.all(
      items.map(item => cache.set(item.key, item.value, item.options)),
    );
    return results.every(r => r);
  },
};
