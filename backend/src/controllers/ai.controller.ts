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
