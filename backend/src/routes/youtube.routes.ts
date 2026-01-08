import { Router } from 'express';
import { z } from 'zod';

import { buildError, buildResponse } from '../common/response-builder';
import { youtubeTranscriptionQueue } from '../queue/youtube-transcription.queue';
import { logger } from '../utils/logger';

const youtubeRouter = Router();

const TranscribeSchema = z.object({
  videoUrl: z.string().url(),
  recipientEmail: z.string().email(),
});

/**
 * @openapi
 * /youtube/transcribe:
 *   post:
 *     summary: Request a YouTube video transcription
 *     tags: [YouTube]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       202:
 *         description: Transcription job queued
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
youtubeRouter.post('/transcribe', async (req: any, res: any) => {
  const requestId = req.requestId;
  try {
    const validated = TranscribeSchema.safeParse(req.body);
    if (!validated.success) {
      return res
        .status(400)
        .json(
          buildError(
            'Invalid Input',
            'VALIDATION_ERROR',
            400,
            requestId,
            validated.error.flatten().fieldErrors,
          ),
        );
    }

    const { videoUrl, recipientEmail } = validated.data;
    const fileName = `manual_request_${Date.now()}`;

    const job = {
      videoUrl,
      recipientEmail,
      fileName,
      timestamp: new Date().toISOString(),
    };

    const published = await youtubeTranscriptionQueue.publishTranscriptionJob(job);

    if (published) {
      logger.info(`Transcription requested for ${videoUrl} by ${recipientEmail}`);
      return res.json(
        buildResponse({ message: 'Transcription job queued', jobId: fileName }, 202, requestId),
      );
    } else {
      return res.status(500).json(buildError('Failed to queue job', 'QUEUE_ERROR', 500, requestId));
    }
  } catch (error: any) {
    logger.error(error, 'Transcription request failed');
    return res.status(500).json(buildError(error.message, 'INTERNAL_ERROR', 500, requestId));
  }
});

export default youtubeRouter;
