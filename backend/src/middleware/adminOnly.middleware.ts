// Admin-only middleware
import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Allows only users with role 'admin' to proceed.
 * Assumes authentication middleware has already attached `req.user`.
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    logger.warn(
      {
        path: req.path,
        method: req.method,
      },
      'Forbidden: adminOnly middleware blocked access'
    );
    res.status(403).json({ success: false, message: 'Forbidden – admin only' });
    return;
  }
  next();
};
