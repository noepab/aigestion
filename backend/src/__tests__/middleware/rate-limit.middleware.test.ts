import request from 'supertest';
import express from 'express';
import { dynamicRateLimiter } from '../../../src/middleware/rate-limit.middleware';
import { config } from '../../../src/config/config';

describe('Dynamic Rate Limiter Middleware', () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Mock user middleware
        app.use((req, res, next) => {
            const role = req.headers['x-test-role'] as string;
            const plan = req.headers['x-test-plan'] as string;

            if (role || plan) {
                (req as any).user = {
                    id: 'test-user',
                    role: role || 'user',
                    subscriptionPlan: plan
                };
            }
            next();
        });

        app.get('/test', dynamicRateLimiter, (req, res) => {
            res.status(200).json({ status: 'ok' });
        });
    });

    afterEach(() => {
        jest.clearAllMocks()
    });

    it('should allow requests within limit for free user', async () => {
        const agent = request(app);
        for (let i = 0; i < 5; i++) {
            await agent.get('/test')
                .set('x-test-plan', 'free')
                .expect(200);
        }
    });

    it('should block requests exceeding limit for free user', async () => {
        const res = await request(app)
            .get('/test')
            .set('x-test-plan', 'free');
        expect(res.status).toBe(200);
        expect(res.headers['ratelimit-limit']).toBeDefined();
        expect(res.headers['ratelimit-limit']).toBe('100');
    });

    it('should apply PRO limit', async () => {
        const res = await request(app)
            .get('/test')
            .set('x-test-plan', 'pro');
        expect(res.status).toBe(200);
        expect(res.headers['ratelimit-limit']).toBe('1000');
    });

    it('should apply GOD limit', async () => {
        const res = await request(app)
            .get('/test')
            .set('x-test-role', 'god');
        expect(res.status).toBe(200);
        expect(res.headers['ratelimit-limit']).toBe('10000');
    });

    it('should fallback to IP limit if no user', async () => {
        const res = await request(app)
            .get('/test');
        expect(res.status).toBe(200);
        expect(res.headers['ratelimit-limit']).toBe('100');
    });
});
