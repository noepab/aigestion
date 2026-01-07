// Jest mock for Redis client used in tests
// This file will be automatically used by Jest when importing 'redis'

export const createClient = jest.fn(() => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  sendCommand: jest.fn(),
  scanIterator: jest.fn().mockReturnValue([]),
  isOpen: true,
  duplicate: jest.fn().mockReturnThis(),
}));

// Legacy export for some older tests/mocks maybe
export const getRedisClient = () => {
  return createClient();
};

export const closeRedis = async () => {
  // no-op for mock
};

const redisMock = {
  createClient,
  getRedisClient,
  closeRedis,
};

export default redisMock;
