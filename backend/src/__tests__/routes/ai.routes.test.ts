// src/__tests__/routes/ai.routes.test.ts
import request from 'supertest';
import { app } from '../../app';
import { AIService } from '../../services/ai.service';

// Mock AIService.streamChat to return a simple async generator
jest.mock('../../services/ai.service');

function* mockStreamGenerator() {
  // First chunk: text token
  yield 'data: {"type":"text","content":"Hello"}\n\n';
  // End marker
  yield 'data: [DONE]\n\n';
}

describe('POST /api/v1/ai/chat (SSE streaming)', () => {
  beforeAll(() => {
    // @ts-ignore – we replace the method with a mock implementation
    (AIService.prototype as any).streamChat = jest.fn().mockImplementation(() => {
      return mockStreamGenerator();
    });
  });

  it('should stream tokens and finish with DONE', async () => {
    const response = await request(app)
      .post('/api/v1/ai/chat')
      .send({ prompt: 'Hi', history: [] })
      .set('Accept', 'text/event-stream')
      .expect('Content-Type', /text\/event-stream/)
      .expect(200);

    // The response text contains the raw SSE payload
    const payload = response.text;
    expect(payload).toContain('"type":"text"');
    expect(payload).toContain('Hello');
    expect(payload).toContain('[DONE]');
  });
});
