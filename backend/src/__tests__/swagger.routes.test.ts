import request from 'supertest';

import { app } from '../app';

describe('Swagger routes presence', () => {
  it('should include custom routes in OpenAPI JSON', async () => {
    const response = await request(app).get('/api-docs.json');
    expect(response.status).toBe(200);
    const paths = response.body.paths;
    expect(paths).toHaveProperty('/stripe');
    expect(paths).toHaveProperty('/youtube');
    expect(paths).toHaveProperty('/users');
    expect(paths).toHaveProperty('/ai');
    expect(paths).toHaveProperty('/exit-templates');
  });
});
