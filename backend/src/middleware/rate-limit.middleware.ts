import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Dynamic Rate Limiter
 *
 * Applies different rate limits based on user plan/role.
 * Requires user to be authenticated (prop req.user populated).
 * Falls back to IP-based limiting if not authenticated (should be used on protected routes).
 */
export const dynamicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Default 15 minutes
  max: (req: Request | any) => {
    const user = req.user;
    if (!user) {
      return config.rateLimit.plans.default.max;
    }
    if (user.role === 'god' || user.role === 'admin') {
      return config.rateLimit.plans.god.max;
    }
    const plan = user.subscriptionPlan?.toLowerCase();
    switch (plan) {
      case 'pro':
      case 'premium':
        return config.rateLimit.plans.pro.max;
      case 'free':
      default:
        return config.rateLimit.plans.free.max;
    }
  },
  keyGenerator: (req: Request | any) => {
    const user = req.user;
    return user ? `user:${user.id}` : `ip:${req.ip}`;
  },
  handler: (req: Request | any, res: Response | any, _next: any, options: any) => {
    const user = req.user;
    logger.warn(
      `Rate limit exceeded for ${user ? `user ${user.id} (${user.role})` : `IP ${req.ip}`}`,
    );
    res.status(options.statusCode).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
