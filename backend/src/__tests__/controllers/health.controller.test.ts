/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import mongoose from 'mongoose';

import { healthCheck } from '../../controllers/health.controller';
import { logger } from '../../utils/logger';

jest.mock('../../cache/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue({
    info: jest.fn().mockResolvedValue('redis_version:6.0.0\r\nused_memory_human:100MB\r\nconnected_clients:1\r\nblocked_clients:0'),
    ping: jest.fn().mockResolvedValue('PONG'),
    isOpen: true,
  }),
}));

jest.mock('../../queue/rabbitmq', () => ({
  getRabbitMQChannel: jest.fn(),
}));

// Mock pino to return a logger with spy functions
jest.mock('pino', () => {
  return jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }));
});

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  httpLogger: (_req: any, _res: any, next: any) => next(),
}));

describe('Health Controller', () => {
  let mockRequest: any;
  let mockResponse: any;
  let responseObject: any;

  beforeEach(() => {
    // Clear mocks on the logger instance
    (logger.info as jest.Mock).mockClear();
    (logger.error as jest.Mock).mockClear();
    (logger.warn as jest.Mock).mockClear();

    mockRequest = {};
    responseObject = {};
    mockResponse = {
      status: jest.fn().mockImplementation(function (this: any) {
        return this;
      }) as any,
      json: jest.fn().mockImplementation(function (this: any, result) {
        responseObject = result;
        return this;
      }) as any,
      set: jest.fn().mockImplementation(function (this: any) {
        return this;
      }) as any,
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('healthCheck', () => {
    it('should return 200 and health status when MongoDB is connected', async () => {
      const mockMongoose = {
        connection: {
          readyState: 1,
          db: {
            command: jest.fn().mockResolvedValue({ ok: 1 }),
            collections: jest.fn().mockResolvedValue([{}, {}, {}]),
          },
          host: 'localhost',
          name: 'test-db',
          version: '6.0.0',
        },
        models: {
          User: {},
          Post: {},
          Comment: {},
        },
        version: '6.0.0',
      };

      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: () => 12345678,
        heapTotal: () => 1234567,
        heapUsed: () => 123456,
        external: () => 12345,
        arrayBuffers: () => 1234,
      }) as any;

      Object.defineProperty(mongoose, 'connection', {
        get: () => mockMongoose.connection,
        configurable: true,
      });
      Object.defineProperty(mongoose, 'models', {
        get: () => mockMongoose.models,
        configurable: true,
      });
      (mongoose as any).version = mockMongoose.version;

      await healthCheck(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.status).toBe('ok');
      expect(responseObject.database.status).toBe('connected');
      expect(responseObject.database.readyState).toBe(1);
      expect(responseObject.database.dbState).toBe('connected');
      expect(responseObject.database.collections).toBe(3);
      expect(responseObject.database.models).toBe(3);
      expect(logger.info).toHaveBeenCalled();

      process.memoryUsage = originalMemoryUsage;
    });

    it('should return 503 and degraded status when MongoDB is disconnected', async () => {
      const mockMongoose = {
        connection: {
          readyState: 0,
          db: null,
          host: 'localhost',
          name: 'test-db',
        },
        models: {},
      };

      Object.defineProperty(mongoose, 'connection', {
        get: () => mockMongoose.connection,
        configurable: true,
      });
      Object.defineProperty(mongoose, 'models', {
        get: () => mockMongoose.models,
        configurable: true,
      });

      await healthCheck(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(responseObject.status).toBe('error');
      expect(responseObject.database.status).toBe('disconnected');
      expect(responseObject.database.readyState).toBe(0);
      expect(responseObject.database.dbState).toBe('disconnected');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle errors during database ping', async () => {
      const mockMongoose = {
        connection: {
          readyState: 1,
          db: {
            command: jest.fn().mockRejectedValue(new Error('Connection failed')),
            collections: jest.fn().mockResolvedValue([]),
          },
          host: 'localhost',
          name: 'test-db',
        },
        models: {},
      };

      Object.defineProperty(mongoose, 'connection', {
        get: () => mockMongoose.connection,
        configurable: true,
      });
      Object.defineProperty(mongoose, 'models', {
        get: () => mockMongoose.models,
        configurable: true,
      });

      await healthCheck(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(responseObject.status).toBe('error');
      expect(responseObject.database.status).toBe('error');
      expect(responseObject.database.message).toBe('MongoDB connection is unstable');
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), 'MongoDB ping failed:');
    });
  });
});
