import type { NextFunction, Request, Response } from 'express-serve-static-core';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { errorHandler } from './errorHandler';

/**
 * Not-found handler for undefined routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`));
};

export { errorHandler };
