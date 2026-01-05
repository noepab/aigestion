import { Request, Response, NextFunction } from 'express';

/**
 * Base Response Builder
 * Estandariza todas las respuestas de la API
 */
export interface ApiResponse<T = any> {
  status: number;
  data: T;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  status: number;
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId: string;
    details?: Record<string, any>;
  };
}

export function buildResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId: string
): ApiResponse<T> {
  return {
    status: statusCode,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function buildError(
  message: string,
  code: string,
  statusCode: number = 400,
  requestId: string,
  details?: Record<string, any>
): ApiError {
  return {
    status: statusCode,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId,
      details,
    },
  };
}

/**
 * Middleware para generar Request ID
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Error Handler para validaciones
 */
export class ValidationError extends Error {
  constructor(
    public code: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super();
    this.name = 'ValidationError';
  }
}

/**
 * Error Handler Global
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.status || 500;
  res
    .status(statusCode)
    .json(
      buildError(
        err.message || 'Internal Server Error',
        err.code || 'INTERNAL_ERROR',
        statusCode,
        (req as any).requestId || '',
        err.details
      )
    );
}
