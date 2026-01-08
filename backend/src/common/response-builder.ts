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

export function buildResponse<T>(data: T, statusCode = 200, requestId: string): ApiResponse<T> {
  return {
    status: statusCode,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Build an error response.
 */
export function buildError(
  message: string,
  code: string,
  statusCode = 400,
  requestId: string,
  details?: Record<string, any>,
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
