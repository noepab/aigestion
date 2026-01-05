import request from 'supertest';
import { app } from '../app';
import fetch, { Response } from 'node-fetch';

jest.mock('node-fetch', () => jest.fn());

describe('MCP health route', () => {
  beforeAll(() => {
    process.env.MCP_SERVER_URL = 'http://dummy-mcp.local';
  });

  it('should return ok when MCP server responds', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
    );
    const response = await request(app).get('/mcp/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('mcp');
    expect(response.body.mcp).toHaveProperty('status', 'ok');
  });

  it('should return 502 when MCP server is unreachable', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));
    const response = await request(app).get('/mcp/health');
    expect(response.status).toBe(502);
    expect(response.body).toHaveProperty('error', 'Failed to reach MCP server');
  });
});
