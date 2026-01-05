import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from '../utils/context';

/**
 * Middleware to inject a unique X-Request-Id into every request and store it in context
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  // Set in header and request object
  res.setHeader('x-request-id', requestId);
  (req as any).requestId = requestId;

  // Store in context
  const store = new Map<string, string>();
  store.set('requestId', requestId);

  requestContext.run(store, () => {
    next();
  });
};
