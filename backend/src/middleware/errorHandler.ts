import type { NextFunction, Request, Response } from 'express-serve-static-core';
import { logger } from '../utils/logger';
import { AppError, HttpStatusCode } from '../utils/errors';

/**
 * Central error-handling middleware for Express.
 *
 * It catches synchronous and asynchronous errors. Operational errors (AppError)
 * are sent to the client with their status code and code. External errors
 * (Zod, Mongoose, JWT) are transformed into operational AppErrors for consistency.
 */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // 1. Handle specific error types

  // Zod Validation Errors
  if (err.name === 'ZodError') {
    const message = 'Validation Failed';
    const details = err.issues.map((i: any) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    error = new AppError(message, HttpStatusCode.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }

  // Mongoose Cast Error (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, HttpStatusCode.BAD_REQUEST, 'CAST_ERROR');
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = new AppError(message, HttpStatusCode.CONFLICT, 'DUPLICATE_KEY_ERROR');
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    error = new AppError(message, HttpStatusCode.BAD_REQUEST, 'VALIDATION_ERROR');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError(
      'Invalid token. Please log in again!',
      HttpStatusCode.UNAUTHORIZED,
      'INVALID_TOKEN',
    );
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError(
      'Your token has expired! Please log in again.',
      HttpStatusCode.UNAUTHORIZED,
      'TOKEN_EXPIRED',
    );
  }

  // 2. Final Error Response
  const statusCode = err.status || error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const requestId = (req as any).requestId || '';

  // Log non-operational (unexpected) errors
  if (!error.isOperational) {
    logger.error('ERROR 💥:', err);
  } else {
    logger.warn(`Operational Error: ${error.message} [${error.code}]`);
  }

  // Use standardized builder for consistent error format
  const { buildError } = require('../common/response-builder');
  const response = buildError(
    error.message || 'Something went wrong!',
    error.code || 'INTERNAL_ERROR',
    statusCode,
    requestId,
    error.details,
  );

  // Add stack trace in development
  if (isDevelopment && !error.isOperational) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// Exporting HttpError for legacy compatibility if needed, but AppError is preferred.
export { AppError as HttpError };
