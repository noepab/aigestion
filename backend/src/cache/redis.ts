import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    // Construct Redis URL from environment variables
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    const password = process.env.REDIS_PASSWORD;
    const url = password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`;

    redisClient = createClient({
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


// In-memory fallback if Redis is down
const memoryCache = new Map<string, { value: any, expiry: number }>();

export const getCache = async (key: string): Promise<any> => {
  const client = getRedisClient();

  // Try Redis first
  if (client?.isOpen) {
    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      logger.warn({ error, key }, 'Redis get error, falling back to memory');
    }
  }

  // Fallback to memory
  const item = memoryCache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.value;
  }
  return null;
};

export const setCache = async (
  key: string,
  value: any,
  ttlSeconds: number = 3600
): Promise<boolean> => {
  const client = getRedisClient();

  // Try Redis
  if (client?.isOpen) {
    try {
      await client.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
      return true;
    } catch (error) {
        logger.warn({ error, key }, 'Redis set error, falling back to memory');
      }
  }

  // Fallback to memory
  memoryCache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });

  // Cleanup old keys (simple GC)
  if (memoryCache.size > 1000) {
    for (const [k, v] of memoryCache) {
      if (v.expiry < Date.now()) memoryCache.delete(k);
    }
  }

  return true;
};
