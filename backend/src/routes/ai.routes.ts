// src/routes/ai.routes.ts
import { Router } from 'express';

import { runPrompt, streamChat } from '../controllers/ai.controller';

const router = Router();

// POST /ai/prompt
/**
 * @openapi
 * /ai/prompt:
 *   post:
 *     summary: Run AI prompt
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prompt response
 */
router.post('/prompt', runPrompt);

// POST /ai/chat
router.post('/chat', streamChat);

export default router;
