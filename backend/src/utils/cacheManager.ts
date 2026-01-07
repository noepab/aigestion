import { logger } from './logger';
import { getCache, getClient, setCache } from './redis';

/**
 * Cache Manager
 * Wrapper around Redis util to match the interface expected by setupOptimizations.ts
 */
export const cache = {
  /**
   * Get value from cache
   */
  get: async (key: string) => {
    return await getCache(key);
  },

  /**
   * Set value in cache
   */
  set: async (key: string, value: any, options?: { ttl?: number; tags?: string[] }) => {
    // Note: tags are not supported in simple redis implementation, ignoring for now
    return await setCache(key, value, options?.ttl || 300);
  },

  /**
   * Delete value from cache
   */
  delete: async (key: string) => {
    const redisClient = getClient();
    if (!redisClient) { return false; }
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
    const redisClient = getClient();
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
  },

  /**
   * Get stats (mocked for now as redis util doesn't expose stats directly)
   */
  getStats: () => {
    const redisClient = getClient();
    return {
      connected: redisClient?.isOpen || false,
      type: 'redis',
    };
  },

  /**
   * Warm cache with multiple items
   */
  warm: async (
    items: { key: string; value: any; options?: { ttl?: number; tags?: string[] } }[]
  ) => {
    const results = await Promise.all(
      items.map((item) => cache.set(item.key, item.value, item.options))
    );
    return results.every((r) => r);
  },
};
