
import request from 'supertest';
import { app } from '../../../app';
import { User } from '../../../models/User';
import mongoose from 'mongoose';

// Variables prefixed with 'mock' are available in jest.mock
const mockUsers: any[] = [];

// Mock Mongoose User Model
jest.mock('../../../models/User', () => {
    // Helper to simulate Mongoose Query
    const createQuery = (dataOrPromise: any) => {
        const promise = Promise.resolve(dataOrPromise);
        (promise as any).select = jest.fn().mockReturnThis();
        return promise;
    };

    class MockUser {
        _id: string;
        name: string;
        email: string;
        password: string;
        role: string;
        refreshTokens: any[];
        loginAttempts: number;

        constructor(data: any) {
            this._id = data._id || data.id || new mongoose.Types.ObjectId().toString();
            this.name = data.name;
            this.email = data.email;
            this.password = data.password;
            this.role = data.role || 'user';
            this.refreshTokens = data.refreshTokens || [];
            this.loginAttempts = 0;
            if (data.toObject) {
                Object.assign(this, data.toObject());
            }
        }

        async save() {
            // @ts-ignore
            const index = mockUsers.findIndex(u => u._id === this._id);
            // We store a CLONE to simulate DB persistence and avoid reference leakage
            const clone = JSON.parse(JSON.stringify(this));
            if (index >= 0) {
                // @ts-ignore
                mockUsers[index] = clone;
            } else {
                // @ts-ignore
                mockUsers.push(clone);
            }
            return this;
        }

        toObject() {
            return JSON.parse(JSON.stringify(this));
        }

        static findOne = jest.fn().mockImplementation((query: any) => {
            let result = null;
            // @ts-ignore
            if (query.email) result = mockUsers.find(u => u.email === query.email);
            else if (query['refreshTokens.token']) {
                const searchToken = query['refreshTokens.token'];
                // @ts-ignore
                result = mockUsers.find(u => u.refreshTokens.some((t: any) => t.token === searchToken));
            }
            else if (query['refreshTokens.familyId']) {
                // @ts-ignore
                result = mockUsers.find(u => u.refreshTokens.some((t: any) => t.familyId === query['refreshTokens.familyId']));
            }

            // Return a NEW instance (like Mongoose does)
            return createQuery(result ? new MockUser(result) : null);
        });

        static findById = jest.fn().mockImplementation((id: string) => {
            // @ts-ignore
            const result = mockUsers.find(u => u._id === id);
            return createQuery(result ? new MockUser(result) : null);
        });

        static updateOne = jest.fn().mockImplementation(async (query: any, update: any) => {
            // @ts-ignore
            const index = mockUsers.findIndex(u => {
                if (query._id) return u._id === query._id;
                if (query['refreshTokens.token']) return u.refreshTokens.some((t: any) => t.token === query['refreshTokens.token']);
                return false;
            });

            if (index >= 0) {
                if (update.$pull && update.$pull.refreshTokens) {
                    const tokenToRemove = update.$pull.refreshTokens.token;
                    // @ts-ignore
                    mockUsers[index].refreshTokens = mockUsers[index].refreshTokens.filter((t: any) => t.token !== tokenToRemove);
                }
                // Handle basic update
                if (update.$set) {
                    // @ts-ignore
                    Object.assign(mockUsers[index], update.$set);
                }
            }
            return Promise.resolve({ nModified: 1 });
        });

        static deleteMany = jest.fn().mockImplementation(() => {
            // @ts-ignore
            mockUsers.length = 0;
            return Promise.resolve();
        });
    }

    return {
        User: MockUser
    };
});

// Mock UserRepository to use the same mockUsers array
jest.mock('../../../infrastructure/repository/UserRepository', () => {
    return {
        UserRepository: class {
            async findByEmail(email: string) {
                // @ts-ignore
                const user = mockUsers.find(u => u.email === email);
                return user ? new (require('../../../models/User').User)(user) : null;
            }
            // @ts-ignore
            async findAll() { return mockUsers; }
            async findById(id: string) {
                // @ts-ignore
                const user = mockUsers.find(u => u._id === id);
                return user ? new (require('../../../models/User').User)(user) : null;
            }
            async create(item: any) {
                const clone = JSON.parse(JSON.stringify(item));
                if (!clone._id) clone._id = new mongoose.Types.ObjectId().toString();
                // @ts-ignore
                mockUsers.push(clone);
                return item;
            }
            async save() { return {}; }
        }
    };
});

describe('Refresh Token Rotation', () => {
    let authCookie: string;

    beforeAll(async () => {
        jest.clearAllMocks();
        // @ts-ignore
        await User.deleteMany({});
    });

    it('should set httpOnly cookie on login', async () => {
        await request(app).post('/api/v1/auth/register').send({
            name: 'Cookie Monster',
            email: 'cookie@test.com',
            password: 'AIGestion123!'
        });

        const response = await request(app).post('/api/v1/auth/login').send({
            email: 'cookie@test.com',
            password: 'AIGestion123!'
        });

        expect(response.status).toBe(200);
        const cookies = response.headers['set-cookie'];
        authCookie = cookies.find((c: string) => c.startsWith('refresh_token'));
    });

    it('should rotate token on refresh', async () => {
        await new Promise(r => setTimeout(r, 10));

        const response = await request(app)
            .get('/api/v1/auth/refresh')
            .set('Cookie', [authCookie]);

        expect(response.status).toBe(200);
        const newCookies = response.headers['set-cookie'];
        const newAuthCookie = newCookies.find((c: string) => c.startsWith('refresh_token'));

        expect(newAuthCookie).not.toEqual(authCookie);
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

        // Should fail
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
        await request(app).post('/api/v1/auth/register').send({
            name: 'Cookie Monster 2',
            email: 'cookie2@test.com',
            password: 'AIGestion123!'
        });

        const loginResponse = await request(app).post('/api/v1/auth/login').send({
            email: 'cookie2@test.com',
            password: 'AIGestion123!'
        });
        const cookie = loginResponse.headers['set-cookie'][0];

        const logoutResponse = await request(app)
            .post('/api/v1/auth/logout')
            .set('Cookie', [cookie]);

        expect(logoutResponse.status).toBe(200);
        const setCookie = logoutResponse.headers['set-cookie'][0];
        expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
    });
});
