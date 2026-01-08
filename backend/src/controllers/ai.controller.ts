// src/controllers/ai.controller.ts
import type { NextFunction, Request, Response } from 'express-serve-static-core';

import { container } from '../config/inversify.config';
import { validate, schemas } from '../middleware/validation.middleware';
import { AIService } from '../services/ai.service';
import { TYPES } from '../types';

export const runPrompt = [
  validate({ body: schemas.ai.prompt }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt } = req.body;
      const userId = (req as any).user?.id || 'anonymous';
      // Get the service from the container to ensure dependencies (Analytics, Search, etc.) are injected
      const aiService = container.get<AIService>(TYPES.AIService);

      const result = await aiService.generateContent(prompt, userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
];

export const streamChat = [
  // validate({ body: schemas.ai.chat }), // TODO: Add chat schema
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt, history } = req.body;
      const userId = (req as any).user?.id || 'anonymous';
      const aiService = container.get<AIService>(TYPES.AIService);

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const stream = await aiService.streamChat({ prompt, history, userId });

        for await (const chunk of stream) {
          res.write(chunk);
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ type: 'error', content: 'Streaming failed' })}\n\n`);
        res.end();
      }
    } catch (err) {
      next(err);
    }
  },
];
