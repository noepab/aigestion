// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { requestContext } from '../utils/context';

/**
 * HttpError extends the native Error object to include an HTTP status code.
 * It is used throughout the application to throw errors with explicit response
 * semantics. The `statusCode` defaults to 500 (Internal Server Error).
 */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    // Set the prototype explicitly to maintain instanceof checks.
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Central error‑handling middleware for Express.
 *
 * It catches both synchronous and asynchronous errors (the latter when passed
 * to `next(err)`). Operational errors (instances of HttpError) are sent to the
 * client with their status code and message. Unexpected errors are logged and a
 * generic 500 response is returned to avoid leaking implementation details.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    const store = requestContext.getStore?.();
    const requestId = (req as any).requestId || store?.get('requestId');
    const errorPayload: any = { message: err.message };
    if (err.code) errorPayload.code = err.code;
    errorPayload.timestamp = new Date().toISOString();
    if (requestId) errorPayload.requestId = requestId;
    res.status(err.statusCode).json({ error: errorPayload });
    return;
  }

  // For unknown errors, log the stack (could be replaced with Winston later).
  console.error('Unexpected error:', err);
  const store = requestContext.getStore?.();
  const requestId = (req as any).requestId || store?.get('requestId');
  const errorPayload: any = { message: 'Internal Server Error' };
  errorPayload.timestamp = new Date().toISOString();
  if (requestId) errorPayload.requestId = requestId;
  res.status(500).json({ error: errorPayload });
}
