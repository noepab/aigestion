import request from 'supertest';

import { app } from '../app';

jest.mock('redis');

describe('Task 1.1 & 1.2: REST API v1 + GraphQL', () => {
  describe('REST API v1 - Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include requestId in all responses', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('REST API v1 - Error Handling', () => {
    it('should return standardized error for 404', async () => {
      const response = await request(app).get('/api/v1/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 404);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');
    });

    it('should validate request body', async () => {
      const response = await request(app).post('/api/v1/users').send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('details');
    });
  });

  describe('GraphQL - Schema Query', () => {
    it('should respond to GraphQL introspection query', async () => {
      const query = `
        {
          __schema {
            types {
              name
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Content-Type', 'application/json')
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.__schema).toBeDefined();
    });

    it('should return GraphQL schema with User type', async () => {
      const query = `
        {
          __type(name: "User") {
            name
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Content-Type', 'application/json')
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body.data.__type.name).toBe('User');
      expect(response.body.data.__type.fields).toBeDefined();
      expect(response.body.data.__type.fields.length).toBeGreaterThan(0);
    });

    it('should handle GraphQL errors gracefully', async () => {
      const query = `
        {
          invalidField
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Content-Type', 'application/json')
        .send({ query });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('message');
    });
  });

  describe('Performance Metrics', () => {
    it('REST endpoint should respond in less than 200ms', async () => {
      const start = Date.now();
      await request(app).get('/api/v1/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('GraphQL introspection should respond in less than 200ms', async () => {
      const query = '{ __typename }';

      const start = Date.now();
      await request(app).post('/graphql').set('Content-Type', 'application/json').send({ query });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('API Versioning', () => {
    it('should route to /api/v1 correctly', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).not.toBe(404);
    });

    it('should separate v1 and future v2 endpoints', async () => {
      const v1Response = await request(app).get('/api/v1/health');

      expect(v1Response.status).not.toBe(404);
    });
  });

  describe('Response Format Compliance', () => {
    it('REST responses should follow standard format', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
      expect(typeof response.body.status).toBe('number');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.requestId).toBe('string');
    });

    it('Error responses should follow standard format', async () => {
      const response = await request(app).get('/api/v1/nonexistent');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');
    });
  });
});
