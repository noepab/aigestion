// src/controllers/ai.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';
import { validate } from '../middleware/validation.middleware';
import { AIPromptDto } from '../dto/dtoSchemas';

import { container } from '../config/inversify.config';
import { TYPES } from '../types';

export const runPrompt = [
  validate(AIPromptDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt } = (req as any).validatedBody as { prompt: string };
      // Get the service from the container to ensure dependencies (Analytics, Search, etc.) are injected
      const aiService = container.get<AIService>(TYPES.AIService);

      const result = await aiService.generateContent(prompt);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
];
