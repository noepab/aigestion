import request from 'supertest';

import { app } from '../../app'; // adjust path to your Express app entry point

describe('Exit Email API', () => {
  test('GET /api/exit-templates returns list of templates', async () => {
    const res = await request(app).get('/api/v1/exit-templates');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('templates');
    expect(Array.isArray(res.body.data.templates)).toBe(true);
    expect(res.body.data.templates).toEqual(expect.arrayContaining(['formal', 'friendly', 'brief', 'creative']));
  });

  test('GET /api/exit-templates/:name returns template content', async () => {
    const res = await request(app).get('/api/v1/exit-templates/formal');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('content');
    expect(res.body.data.content).toContain('# Plantilla Formal');
  });

  test('GET unknown template returns 404', async () => {
    const res = await request(app).get('/api/v1/exit-templates/unknown');
    expect(res.status).toBe(404);
  });
});
