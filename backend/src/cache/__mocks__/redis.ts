// Jest manual mock for Redis client used by rateLimiter and cache utilities
export const getRedisClient = () => {
  return {
    isOpen: true,
    sendCommand: (..._args: string[]) => Promise.resolve('OK'),
  } as any;
};
export const closeRedis = async () => {};
