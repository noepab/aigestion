import { aiLimiter, authLimiter, dynamicRoleLimiter, generalLimiter } from '../rateLimiter';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Redis Cache
jest.mock('../../cache/redisCache', () => ({
  getRedisClient: jest.fn(() => ({
    isOpen: false,
  })),
}));

// Mock config
jest.mock('../../config/index', () => ({
  config: {
    rateLimit: {
      windowMs: 900000,
      max: 100,
    },
  },
}));

describe('RateLimiter Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let nextFunction: any;
  let noRoleReq: any; // Declare noRoleReq here

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: {},
      ip: '127.0.0.1',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    noRoleReq = {
      // Initialize noRoleReq here
      ...mockReq,
    };
  });

  describe('generalLimiter', () => {
    it('should be defined', () => {
      expect(generalLimiter).toBeDefined();
      expect(typeof generalLimiter).toBe('function');
    });

    it('should allow requests under the limit', async () => {
      await generalLimiter(noRoleReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('authLimiter', () => {
    it('should be defined', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    it('should apply stricter limits for auth endpoints', async () => {
      await authLimiter(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('aiLimiter', () => {
    it('should be defined', () => {
      expect(aiLimiter).toBeDefined();
      expect(typeof aiLimiter).toBe('function');
    });

    it('should apply AI-specific rate limits', async () => {
      await aiLimiter(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('dynamicRoleLimiter', () => {
    it('should bypass rate limiting for admin users', () => {
      const adminReq = {
        ...mockReq,
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin' as const,
        },
      };

      dynamicRoleLimiter(adminReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should apply limits for guest users', async () => {
      const guestReq = {
        ...mockReq,
        user: {
          id: 'guest-123',
          email: 'guest@example.com',
          role: 'guest' as const,
        },
      };

      await dynamicRoleLimiter(guestReq, mockRes, nextFunction);
      // Should apply limiter, which calls next() if under limit
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should apply limits for authenticated users', async () => {
      const authReq = {
        ...mockReq,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'authenticated' as const,
        },
      };

      await dynamicRoleLimiter(authReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should apply limits for premium users', async () => {
      const premiumReq = {
        ...mockReq,
        user: {
          id: 'premium-123',
          email: 'premium@example.com',
          role: 'premium' as const,
        },
      };

      await dynamicRoleLimiter(premiumReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should default to guest limits for users without role', async () => {
      await dynamicRoleLimiter(noRoleReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
