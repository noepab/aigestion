import rateLimit from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express-serve-static-core';
import RedisStore from 'rate-limit-redis';

import { getRedisClient } from '../cache/redis';
import { config } from '../config/index';
import { logger } from '../utils/logger';

// User role type from auth context
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'guest' | 'authenticated' | 'premium' | 'admin';
  };
}

/**
 * Create a rate limiter with memory store
 * (Redis disabled for local development - use memory store always)
 */
const createRateLimiter = (
  windowMs: number,
  max: number,
  message = 'Too many requests, please try again later.',
) => {
  // Use memory store for development (simpler, no Redis dependency)
  // In production, Redis store can be enabled via environment variable
  const useRedis = process.env.USE_REDIS_RATE_LIMIT === 'true';

  let store;
  if (useRedis) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && redisClient.isOpen) {
        store = new RedisStore({
          sendCommand: (...args: string[]) => redisClient.sendCommand(args),
          prefix: 'rl:',
        });
        logger.info('Rate limiter using Redis store');
      }
    } catch (error) {
      logger.warn('Redis not available, using memory store for rate limiting');
    }
  }

  if (!store) {
    logger.info('Rate limiter using memory store (local development mode)');
  }

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    store, // undefined = memory store
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    skip: () => process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID,
    keyGenerator: (req: any) => {
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.id || req.ip || 'unknown';
    },
  });
};

/**
 * General API rate limiter
 * Default: 100 requests per 15 minutes
 */
export const generalLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.max,
  'Too many requests from this IP, please try again later.',
);

/**
 * Strict limiter for sensitive endpoints (auth, admin)
 * 5 requests per 15 minutes
 */
export const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  'Too many attempts, please try again in 15 minutes.',
);

/**
 * Auth limiter for login/register endpoints
 * 10 requests per hour to prevent brute force
 */
export const authLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  'Too many authentication attempts, please try again in an hour.',
);

/**
 * File upload limiter
 * 20 uploads per hour
 */
export const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20,
  'Upload limit exceeded, please try again later.',
);

/**
 * AI/Gemini API limiter
 * 30 requests per 10 minutes
 */
export const aiLimiter = createRateLimiter(
  10 * 60 * 1000, // 10 minutes
  30,
  'AI request limit exceeded, please try again in 10 minutes.',
);

/**
 * Dynamic rate limiter based on user role
 * - Guest: 30 requests per 15 minutes
 * - Authenticated: 100 requests per 15 minutes
 * - Premium: 300 requests per 15 minutes
 * - Admin: no limit
 */
// Define limiters per role outside the request handler to persist state
const roleLimiters: Record<string, any> = {
  guest: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    30,
    'Rate limit exceeded for guest users. Please try again later.',
  ),
  authenticated: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100,
    'Rate limit exceeded for authenticated users. Please try again later.',
  ),
  premium: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    300,
    'Rate limit exceeded for premium users. Please try again later.',
  ),
};

export const dynamicRoleLimiter = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const userRole = authReq.user?.role || 'guest';

  // Admin users bypass rate limiting
  if (userRole === 'admin') {
    return next();
  }

  const limiter = roleLimiters[userRole] || roleLimiters.guest;

  // Apply the limiter and then call next if the limiter didn't end the response
  return limiter(req, res, (err?: any) => {
    if (err) {
      return next(err);
    }
    // Call next only if response not already sent by the limiter
    if (!res.headersSent) {
      return next();
    }
    // otherwise do nothing (response already handled)
  });
};

/**
 * WebSocket connection rate limiter
 * 10 connections per minute per IP
 */
export const websocketLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many WebSocket connection attempts, please try again later.',
);

export default {
  generalLimiter,
  strictLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter,
  dynamicRoleLimiter,
  websocketLimiter,
};
