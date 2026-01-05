
import { jest } from '@jest/globals';

const mockClient = {
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  sendCommand: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  isOpen: true,
};

export const createClient = () => mockClient;

export const getRedisClient = () => mockClient;
export const getCache = jest.fn().mockResolvedValue(null);
export const setCache = jest.fn().mockResolvedValue(true);
export const closeRedis = jest.fn().mockResolvedValue(undefined);

export default {
  createClient,
  getRedisClient,
  getCache,
  setCache,
  closeRedis,
};
