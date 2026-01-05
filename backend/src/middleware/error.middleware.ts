import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import { logger } from '../utils/logger';

// Not-found handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
};

export { errorHandler };
