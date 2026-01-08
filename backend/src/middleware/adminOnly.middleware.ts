import type { NextFunction, Request, Response } from 'express-serve-static-core';

import { logger } from '../utils/logger';

/**
 * Allows only users with role 'admin' to proceed.
 * Assumes authentication middleware has already attached `req.user`.
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user?.role !== 'admin') {
    logger.warn(
      {
        path: (req as any).path,
        method: (req as any).method,
      },
      'Forbidden: adminOnly middleware blocked access',
    );
    (res as any).status(403).json({ success: false, message: 'Forbidden – admin only' });
    return;
  }
  next();
};
