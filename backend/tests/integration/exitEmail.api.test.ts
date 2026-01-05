import request from 'supertest';
import app from '../../src/app'; // adjust path to your Express app entry point

describe('Exit Email API', () => {
  test('GET /api/exit-templates returns list of templates', async () => {
    const res = await request(app).get('/api/exit-templates');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('templates');
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates).toEqual(expect.arrayContaining(['formal', 'friendly', 'brief', 'creative']));
  });

  test('GET /api/exit-templates/:name returns template content', async () => {
    const res = await request(app).get('/api/exit-templates/formal');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('content');
    expect(res.body.content).toContain('# Plantilla Formal');
  });

  test('GET unknown template returns 404', async () => {
    const res = await request(app).get('/api/exit-templates/unknown');
    expect(res.status).toBe(404);
  });
});
