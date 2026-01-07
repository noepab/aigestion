import request from 'supertest';

import { app } from '../app';

describe('Swagger UI and JSON', () => {
  it('should serve Swagger UI at /api-docs', async () => {
    const response = await request(app).get('/api-docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });

  it('should serve OpenAPI JSON at /api-docs.json', async () => {
    const response = await request(app).get('/api-docs.json');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('openapi');
    expect(response.body).toHaveProperty('info');
    expect(response.body).toHaveProperty('paths');
  });
});
