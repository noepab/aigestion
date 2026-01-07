import type { NextFunction, Request, Response } from 'express-serve-static-core';

import { requestContext } from '../utils/context';

/**
 * Middleware to inject a unique X-Request-Id into every request and store it in context
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Set in header and request object
  (res as any).setHeader('x-request-id', requestId);
  (req as any).requestId = requestId;

  // Store in context
  const store = new Map<string, string>();
  store.set('requestId', requestId);

  requestContext.run(store, () => {
    next();
  });
};
