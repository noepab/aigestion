// Tests for error utilities and catchAsync
import { Request, Response, NextFunction } from 'express-serve-static-core';
import { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, ValidationError, HttpStatusCode, catchAsync } from '../../utils/errors';

describe('Error Classes', () => {
    test('AppError sets defaults correctly', () => {
        const err = new AppError('msg');
        expect(err.message).toBe('msg');
        expect(err.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
        expect(err.code).toBe('INTERNAL_ERROR');
        expect(err.isOperational).toBe(true);
    });

    test('AppError uses provided code and status', () => {
        const err = new AppError('msg', HttpStatusCode.BAD_REQUEST, 'CUSTOM_CODE');
        expect(err.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
        expect(err.code).toBe('CUSTOM_CODE');
    });

    test('AppError uses NOT_FOUND code when status is 404 and no code provided', () => {
        const err = new AppError('msg', HttpStatusCode.NOT_FOUND);
        expect(err.statusCode).toBe(HttpStatusCode.NOT_FOUND);
        expect(err.code).toBe('NOT_FOUND');
    });

    test('BadRequestError inherits correctly', () => {
        const err = new BadRequestError('bad');
        expect(err.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
        expect(err.code).toBe('BAD_REQUEST');
    });

    test('UnauthorizedError inherits correctly', () => {
        const err = new UnauthorizedError('unauth');
        expect(err.statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
        expect(err.code).toBe('UNAUTHORIZED');
    });

    test('ForbiddenError inherits correctly', () => {
        const err = new ForbiddenError('forbid');
        expect(err.statusCode).toBe(HttpStatusCode.FORBIDDEN);
        expect(err.code).toBe('FORBIDDEN');
    });

    test('NotFoundError inherits correctly', () => {
        const err = new NotFoundError('missing');
        expect(err.statusCode).toBe(HttpStatusCode.NOT_FOUND);
        expect(err.code).toBe('NOT_FOUND');
    });

    test('ConflictError inherits correctly', () => {
        const err = new ConflictError('conflict');
        expect(err.statusCode).toBe(HttpStatusCode.CONFLICT);
        expect(err.code).toBe('CONFLICT');
    });

    test('ValidationError inherits correctly', () => {
        const err = new ValidationError('invalid');
        expect(err.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
        expect(err.code).toBe('VALIDATION_ERROR');
    });
});

describe('catchAsync wrapper', () => {
    test('passes errors to next', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('boom'));
        const middleware = catchAsync(fn as any);
        const next = jest.fn();
        await middleware({} as Request, {} as Response, next as NextFunction);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('calls function when resolved', async () => {
        const fn = jest.fn().mockResolvedValue('ok');
        const middleware = catchAsync(fn as any);
        const next = jest.fn();
        await middleware({} as Request, {} as Response, next as NextFunction);
        expect(fn).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });
});
