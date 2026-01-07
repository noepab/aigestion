import type { NextFunction, Request, Response } from 'express-serve-static-core';

import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${(req as any).originalUrl}`);
  logger.warn(`404 Not Found: ${(req as any).originalUrl}`);
  (res as any).status(404);
  next(error);
};
