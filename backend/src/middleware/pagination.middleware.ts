import type { NextFunction, Request, Response } from 'express-serve-static-core';
import { ValidationError } from '../utils/errors';

/**
 * Middleware to validate pagination query parameters.
 * Ensures `page` >= 1 and `limit` between 1 and 100.
 * On success, attaches `{ page, limit }` to `req.pagination`.
 */
export function validatePagination(req: Request, _res: Response, next: NextFunction) {
  const query = req.query as any;
  const pageRaw = query.page;
  const limitRaw = query.limit;
  const page = pageRaw !== undefined ? Number(pageRaw) : 1;
  const limit = limitRaw !== undefined ? Number(limitRaw) : 10;

  if (isNaN(page) || page < 1) {
    return next(new ValidationError('Invalid page parameter'));
  }
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return next(new ValidationError('Invalid limit parameter'));
  }
  (req as any).pagination = { page, limit };
  next();
}
