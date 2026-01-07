
import request from 'supertest';
import { app } from '../../../app';
import { User } from '../../../models/User';
import mongoose from 'mongoose';

// Mock Mongoose User Model
jest.mock('../../../models/User', () => {
    const mockUsers: any[] = [];

    // Helper to simulate Mongoose Query
    const createQuery = (dataOrPromise: any) => {
        const promise = Promise.resolve(dataOrPromise);
        (promise as any).select = jest.fn().mockReturnThis(); // Valid chaining
        return promise;
    };

    // Mock Instance
    class MockUser {
        _id: string;
        name: string;
        email: string;
        password: string;
        role: string;
        refreshTokens: any[];
        loginAttempts: number;

        static mockUsers = mockUsers; // Expose for debugging if needed

        constructor(data: any) {
            this._id = data._id || new mongoose.Types.ObjectId().toString();
            this.name = data.name;
            this.email = data.email;
            this.password = data.password;
            this.role = data.role || 'user';
            this.refreshTokens = data.refreshTokens || [];
            this.loginAttempts = 0;
        }

        async save() {
            const index = mockUsers.findIndex(u => u._id === this._id);
            if (index >= 0) {
                mockUsers[index] = this;
            } else {
                mockUsers.push(this);
            }
            return this;
        }

        toObject() {
            return { ...this };
        }

        // Static Methods
        static findOne = jest.fn().mockImplementation((query: any) => {
            let result = null;
            if (query.email) result = mockUsers.find(u => u.email === query.email);
            else if (query['refreshTokens.token']) result = mockUsers.find(u => u.refreshTokens.some((t: any) => t.token === query['refreshTokens.token']));
            else if (query['refreshTokens.familyId']) result = mockUsers.find(u => u.refreshTokens.some((t: any) => t.familyId === query['refreshTokens.familyId']));

            return createQuery(result);
        });

        static findById = jest.fn().mockImplementation((id: string) => {
            const result = mockUsers.find(u => u._id === id);
            return createQuery(result);
        });

        static updateOne = jest.fn().mockImplementation(async (query: any, update: any) => {
            // Simplistic update for logout test
            if (query['refreshTokens.token'] && update.$pull) {
                const tokenToRemove = query['refreshTokens.token'];
                const user = mockUsers.find(u => u.refreshTokens.some((t: any) => t.token === tokenToRemove));
                if (user) {
                    user.refreshTokens = user.refreshTokens.filter((t: any) => t.token !== tokenToRemove);
                }
            }
            return Promise.resolve({ nModified: 1 });
        });

        static deleteMany = jest.fn().mockImplementation(() => {
            mockUsers.length = 0;
            return Promise.resolve();
        });
    }

    return {
        User: MockUser
    };
});

// We need to import the mocked class to use in tests if we want to spy?
// No, the mock above replaces the import.

describe('Refresh Token Rotation', () => {
    let authCookie: string;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // We mocked User, so no need to connect/disconnect mongoose real DB
    // But we might need to reset the array if we exposed it.
    // deleteMany implementation handles reset.

    it('should set httpOnly cookie on login', async () => {
        // Register
        await request(app).post('/api/v1/auth/register').send({
            name: 'Cookie Monster',
            email: 'cookie@test.com',
            password: 'password123'
        });

        // Login
        const response = await request(app).post('/api/v1/auth/login').send({
            email: 'cookie@test.com',
            password: 'password123'
        });

        expect(response.status).toBe(200);
        expect(response.body.data.token).toBeDefined();

        // Check for cookie
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        // Just verify it exists for now, supertest parsing can be tricky
        const hasRefreshToken = cookies.some((c: string) => c.includes('refresh_token') && c.includes('HttpOnly'));
        expect(hasRefreshToken).toBe(true);

        // Save cookie for next test
        authCookie = cookies.find((c: string) => c.startsWith('refresh_token'));
    });

    it('should rotate token on refresh', async () => {
        // Wait 10ms
        await new Promise(r => setTimeout(r, 10));

        const response = await request(app)
            .get('/api/v1/auth/refresh')
            .set('Cookie', [authCookie]);

        expect(response.status).toBe(200);
        expect(response.body.data.accessToken).toBeDefined();

        // Should have a NEW cookie
        const newCookies = response.headers['set-cookie'];
        expect(newCookies).toBeDefined();
        const newAuthCookie = newCookies.find((c: string) => c.startsWith('refresh_token'));

        // Cookie string comparison might include different expires etc, but token value inside should differ?
        // Actually since we mock, the token generation is real (AuthService uses jwt.sign)
        expect(newAuthCookie).not.toEqual(authCookie);

        // Update valid cookie
        authCookie = newAuthCookie;
    });

    it('should detect reuse and invalidate family', async () => {
        // 1. Get current valid cookie (Family A, generation 2)
        const checkResponse = await request(app)
            .get('/api/v1/auth/refresh')
            .set('Cookie', [authCookie]);
        expect(checkResponse.status).toBe(200);
        const validCookie = checkResponse.headers['set-cookie'][0];

        // 2. Legit refresh (switches to generation 3)
        const legitResponse = await request(app)
            .get('/api/v1/auth/refresh')
            .set('Cookie', [validCookie]);
        expect(legitResponse.status).toBe(200);

        // 3. ATTACK: Re-use generation 2 cookie
        const attackResponse = await request(app)
            .get('/api/v1/auth/refresh')
            .set('Cookie', [validCookie]);

        // Should fail (403 or 500 from error throw)
        // AuthService throws "REFRESH_TOKEN_REUSE_DETECTED" or "INVALID_REFRESH_TOKEN", mapped to 500?
        expect(attackResponse.status).not.toBe(200);

        // 4. Legit user tries to use generation 3 cookie (should now be invalid due to family wipe)
        const nextGenCookie = legitResponse.headers['set-cookie'][0];
        const victimResponse = await request(app)
            .get('/api/v1/auth/refresh')
            .set('Cookie', [nextGenCookie]);

        // Should fail
        expect(victimResponse.status).not.toBe(200);
    });

    it('should logout correctly', async () => {
        // Register new user to ensure clean state
        await request(app).post('/api/v1/auth/register').send({
            name: 'Cookie Monster 2',
            email: 'cookie2@test.com',
            password: 'password123'
        });

        const loginResponse = await request(app).post('/api/v1/auth/login').send({
            email: 'cookie2@test.com',
            password: 'password123'
        });
        const cookie = loginResponse.headers['set-cookie'][0];

        const logoutResponse = await request(app)
            .post('/api/v1/auth/logout')
            .set('Cookie', [cookie]);

        expect(logoutResponse.status).toBe(200);

        // Cookie should be cleared
        const clearCookie = logoutResponse.headers['set-cookie'][0];
        // Express clearCookie sets Max-Age=0 or Expires=past
        expect(clearCookie).toContain('Max-Age=0');
    });
});
