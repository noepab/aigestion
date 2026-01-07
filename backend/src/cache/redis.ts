import * as redis from 'redis';
import type { RedisClientType } from 'redis';

import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    // Construct Redis URL from environment variables
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    const password = process.env.REDIS_PASSWORD;
    const url = password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`;

    redisClient = redis.createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('Max Redis reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 5000);
        },
      },
    }) as RedisClientType;

    redisClient.on('error', (err: Error) => {
      logger.error(err, 'Redis Client Error:');
    });

    // Connect in the background
    (async () => {
      try {
        await redisClient.connect();
        logger.info('Connected to Redis');
      } catch (err) {
        logger.error(err, 'Failed to connect to Redis:');
      }
    })();
  }
  return redisClient;
};


// Utility function to safely close the Redis connection
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};


// In-memory L1 cache
const l1Cache = new Map<string, { value: any, expiry: number }>();
const MAX_L1_SIZE = 1000;

/**
 * Get value from layered cache
 * L1: Memory (fastest)
 * L2: Redis (distributed)
 */
export const getCache = async (key: string): Promise<any> => {
  // Check L1 first
  const l1Item = l1Cache.get(key);
  if (l1Item && l1Item.expiry > Date.now()) {
    logger.debug({ key }, 'L1 Cache Hit');
    return l1Item.value;
  }

  // L1 Miss or Expired, try L2 (Redis)
  const client = getRedisClient();
  if (client?.isOpen) {
    try {
      const data = await client.get(key);
      if (data) {
        const parsed = JSON.parse(data);

        // Populate L1 for subsequent requests
        // We don't have the original TTL here safely from Redis 'get',
        // so we assume a default or check 'ttl' if we had it.
        // For simplicity, we use a 5-minute local L1 mirror of the L2 data.
        l1Cache.set(key, {
          value: parsed,
          expiry: Date.now() + (5 * 60 * 1000)
        });

        logger.debug({ key }, 'L2 Cache Hit (Mirroring to L1)');
        return parsed;
      }
    } catch (error) {
      logger.warn({ error, key }, 'Redis get error');
    }
  }

  return null;
};

/**
 * Set value in layered cache
 * Sets both L1 and L2
 */
export const setCache = async (
  key: string,
  value: any,
  ttlSeconds = 3600
): Promise<boolean> => {
  // Set L1
  l1Cache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });

  // Simple L1 GC
  if (l1Cache.size > MAX_L1_SIZE) {
    const now = Date.now();
    for (const [k, v] of l1Cache) {
      if (v.expiry < now) { l1Cache.delete(k); }
    }
  }

  // Set L2 (Redis)
  const client = getRedisClient();
  if (client?.isOpen) {
    try {
      await client.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
      return true;
    } catch (error) {
      logger.warn({ error, key }, 'Redis set error');
    }
  }

  return true;
};
