/**
 * Sprint 1: Task 1.1 - REST API Refactoring Tests
 *
 * Tests para validar:
 * - Formato de respuestas estandarizado
 * - Validación de entrada
 * - Códigos de error RFC 7807
 * - Performance (<200ms p95)
 */

import request from 'supertest';



import { app } from '../app';

describe('API v1 - REST Refactoring', () => {
  let requestId: string;

  describe('GET /health', () => {
    it('should return standardized health response', async () => {
      const response = await request(app).get('/api/v1/health').expect(200);
      console.log('DEBUG: /health response', JSON.stringify(response.body, null, 2));

      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');

      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('version');

      requestId = response.body.requestId;
      expect(requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });

    it('response time should be < 200ms', async () => {
      const start = Date.now();
      await request(app).get('/api/v1/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('should include X-Request-ID header', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });
  });

  describe('GET /users/{userId}', () => {
    it('should retrieve user with standardized response', async () => {
      const response = await request(app).get('/api/v1/users/1').expect(200);

      expect(response.body.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should validate userId format', async () => {
      const response = await request(app).get('/api/v1/users/invalid-id').expect(400);

      expect(response.body.status).toBe(400);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');
    });

    it('response time should be < 200ms', async () => {
      const start = Date.now();
      await request(app).get('/api/v1/users/1');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('GET /users (list)', () => {
    it('should return paginated users list', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    it('should validate pagination parameters', async () => {
      // Page < 1
      let response = await request(app)
        .get('/api/v1/users')
        .query({ page: 0, limit: 10 })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');

      // Limit > 100
      response = await request(app).get('/api/v1/users').query({ page: 1, limit: 101 }).expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should use default pagination if not provided', async () => {
      const response = await request(app).get('/api/v1/users').expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe('POST /users (create)', () => {
    it('should create user with valid input', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'AIGestion123!',
        })
        .expect(201);

      expect(response.body.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('Test User');
    });

    it('should validate required fields', async () => {
      // Missing email
      let response = await request(app)
        .post('/api/v1/users')
        .send({
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(response.body.error.details)).toBe(true);
      const emailError = response.body.error.details.find((d: any) => d.path === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.message).toContain('Required');

      // Missing name
      response = await request(app)
        .post('/api/v1/users')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      const nameError = response.body.error.details.find((d: any) => d.path === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.message).toContain('Required');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({
          email: 'invalid-email',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      // Check details for specific message
      const emailError = response.body.error.details.find((d: any) => d.path === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.message).toContain('email');
    });

    it('response time should be < 200ms', async () => {
      const start = Date.now();
      await request(app).post('/api/v1/users').send({
        email: 'test@example.com',
        name: 'Test User',
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Response format standardization', () => {
    it('all responses should include requestId', async () => {
      const endpoints = [
        { method: 'get', path: '/health' },
        { method: 'get', path: '/users' },
        { method: 'get', path: '/users/1' },
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app))[endpoint.method]('/api/v1' + endpoint.path);
        expect(response.body).toHaveProperty('requestId');
        expect(response.body.requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
      }
    });

    it('error responses should follow RFC 7807', async () => {
      const response = await request(app).get('/api/v1/users/invalid').expect(400);

      // RFC 7807 Problem Details
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should include timestamps in ISO 8601 format', async () => {
      const response = await request(app).get('/api/v1/health');

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(response.body.timestamp).toMatch(iso8601Regex);
    });
  });

  describe('Performance metrics', () => {
    it('GET /health should average < 100ms', async () => {
      const times: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app).get('/api/v1/health');
        times.push(Date.now() - start);
      }

      const average = times.reduce((a, b) => a + b) / iterations;
      expect(average).toBeLessThan(100);
    });

    it('GET /users should average < 150ms', async () => {
      const times: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app).get('/api/v1/users');
        times.push(Date.now() - start);
      }

      const average = times.reduce((a, b) => a + b) / iterations;
      expect(average).toBeLessThan(150);
    });

    it('POST /users should average < 200ms', async () => {
      const times: number[] = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app)
          .post('/api/v1/users')
          .send({
            email: `test${i}@example.com`,
            name: 'Test User',
          });
        times.push(Date.now() - start);
      }

      const average = times.reduce((a, b) => a + b) / iterations;
      expect(average).toBeLessThan(200);
    });
  });
});
