import { Request, Response, NextFunction } from 'express-serve-static-core';
import { errorHandler } from '../../middleware/errorHandler';
import { AppError, HttpStatusCode, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
  }
}));

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      requestId: 'test-request-id',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it('should handle AppError correctly', () => {
    const error = new AppError('Test Error', HttpStatusCode.BAD_REQUEST, 'TEST_CODE');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      status: HttpStatusCode.BAD_REQUEST,
      error: expect.objectContaining({
        code: 'TEST_CODE',
        message: 'Test Error',
        requestId: 'test-request-id'
      })
    }));
  });

  it('should handle NotFoundError correctly', () => {
    const error = new NotFoundError('Not Found');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        code: 'NOT_FOUND'
      })
    }));
  });

  it('should handle ZodError and format details', () => {
    const zodError = {
      name: 'ZodError',
      issues: [
        { path: ['email'], message: 'Invalid email' },
        { path: ['password'], message: 'Too short' }
      ]
    };

    errorHandler(zodError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.code).toBe('VALIDATION_ERROR');
    expect(jsonCall.error.details).toHaveLength(2);
    expect(jsonCall.error.details[0]).toEqual({ path: 'email', message: 'Invalid email' });
  });

  it('should handle Mongoose CastError', () => {
    const castError = {
      name: 'CastError',
      path: '_id',
      value: 'invalid-id'
    };

    errorHandler(castError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.code).toBe('CAST_ERROR');
    expect(jsonCall.error.message).toContain('Invalid _id: invalid-id');
  });

  it('should handle Mongoose Duplicate Key Error', () => {
    const duplicateError = {
      code: 11000,
      errmsg: 'E11000 duplicate key error collection: db.users index: email_1 dup key: { email: "test@example.com" }'
    };

    errorHandler(duplicateError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.CONFLICT);
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.code).toBe('DUPLICATE_KEY_ERROR');
    expect(jsonCall.error.message).toContain('Duplicate field value: "test@example.com"');
  });

  it('should handle Mongoose ValidationError', () => {
    const validationError = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is invalid' },
        password: { message: 'Password is too weak' }
      }
    };

    errorHandler(validationError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.code).toBe('VALIDATION_ERROR');
    expect(jsonCall.error.message).toContain('Email is invalid');
  });

  it('should handle JsonWebTokenError', () => {
    const jwtError = {
      name: 'JsonWebTokenError'
    };

    errorHandler(jwtError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.code).toBe('INVALID_TOKEN');
  });

  it('should handle TokenExpiredError', () => {
    const expiredError = {
      name: 'TokenExpiredError'
    };

    errorHandler(expiredError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.code).toBe('TOKEN_EXPIRED');
  });

  it('should handle unexpected errors by returning 500', () => {
    const error = new Error('Random crash');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatusCode.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalled();
  });
});
