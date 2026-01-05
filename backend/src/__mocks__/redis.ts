// Jest mock for Redis client used in tests
// This file will be automatically used by Jest when importing '../cache/redis'

export const getRedisClient = () => {
  return {
    isOpen: true,
    // sendCommand mimics the Redis client method used by rate-limit-redis
    sendCommand: (..._args: string[]) => Promise.resolve('OK'),
  } as any;
};

export const closeRedis = async () => {
  // no-op for mock
};
