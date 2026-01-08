import { Request, Response, NextFunction } from 'express';
import { idempotencyMiddleware } from '../../middleware/idempotency.middleware';
import { cache } from '../../utils/cacheManager';
import { logger } from '../../utils/logger';

jest.mock('../../utils/cacheManager');
jest.mock('../../utils/logger');

describe('Idempotency Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        (cache.set as jest.Mock).mockResolvedValue(true);
        req = {
            headers: {},
            method: 'POST',
            path: '/test',
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
            statusCode: 200,
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should call next() if no idempotency key is provided', async () => {
        await idempotencyMiddleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
        expect(cache.get).not.toHaveBeenCalled();
    });

    it('should call next() for GET requests regardless of key', async () => {
        req.headers['idempotency-key'] = 'test-key';
        req.method = 'GET';
        await idempotencyMiddleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
        expect(cache.get).not.toHaveBeenCalled();
    });

    it('should return cached response on HIT', async () => {
        const key = 'test-key';
        req.headers['idempotency-key'] = key;
        const cachedResponse = {
            status: 201,
            body: { success: true },
        };
        (cache.get as jest.Mock).mockResolvedValue(cachedResponse);

        await idempotencyMiddleware(req as Request, res as Response, next);

        expect(cache.get).toHaveBeenCalledWith(expect.stringContaining(key));
        expect(res.setHeader).toHaveBeenCalledWith('X-Idempotency-Hit', 'true');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: true });
        expect(next).not.toHaveBeenCalled();
    });

    it('should continue and save to cache on MISS', async () => {
        const key = 'test-key';
        req.headers['idempotency-key'] = key;
        (cache.get as jest.Mock).mockResolvedValue(null);

        await idempotencyMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(res.setHeader).toHaveBeenCalledWith('X-Idempotency-Hit', 'false');

        // Simulate response
        const mockBody = { result: 'ok' };
        (res as any).statusCode = 200;
        (res as any).json(mockBody);

        // Wait for the async cache.set call (even though it is backgrounded)
        // In our implementation, res.json is monkey-patched
        expect(cache.set).toHaveBeenCalledWith(
            expect.stringContaining(key),
            { status: 200, body: mockBody },
            { ttl: 86400 }
        );
    });

    it('should NOT save to cache if statusCode >= 500', async () => {
        const key = 'test-key';
        req.headers['idempotency-key'] = key;
        (cache.get as jest.Mock).mockResolvedValue(null);

        await idempotencyMiddleware(req as Request, res as Response, next);

        const mockBody = { error: 'server error' };
        (res as any).statusCode = 500;
        (res as any).json(mockBody);

        expect(cache.set).not.toHaveBeenCalled();
    });
});
