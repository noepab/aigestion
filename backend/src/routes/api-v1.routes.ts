import { Router } from 'express';
import type { Request, Response } from 'express-serve-static-core';

import { buildResponse, buildError } from '../common/response-builder';
// import { buildError, buildResponse, requestIdMiddleware } from '../common/response-builder';

// import { getEmailTracking } from '../controllers/email-tracking.controller';
// import briefingRoutes from './briefing.routes';
import { container } from '../config/inversify.config';
import exitEmailRouter from '../controllers/exitEmail.controller';
import { CredentialManagerService } from '../services/credential-manager.service';
import { HistoryService } from '../services/history.service';
import { TYPES } from '../types';
import aiRouter from './ai.routes';
import ragRoutes from './rag.routes';
// import gmailRoutes from './gmail.routes';
// import bigqueryRoutes from './bigquery.routes';
// import cloudMonitoringRoutes from './cloudMonitoring.routes';
// import jwt from 'jsonwebtoken';
// import { env } from '../config/env.schema';
// import { dashboardAuth } from '../middleware/dashboardAuth';
import stripeRouter from './stripe.routes';
import usersRouter from './users.routes';
import youtubeRouter from './youtube.routes';
import authRouter from './auth.routes';
import dockerRouter from './docker.routes';

import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

/**
 * API v1 Router
 * Base estandarizada para todas las rutas versionadas
 */
const apiV1Router = Router();

// Aplicar middleware de idempotencia globalmente para proteger todos los POST/PUT/PATCH
apiV1Router.use(idempotencyMiddleware);

console.log('DEBUG: API V1 router loaded');

// Mount Auth Routes
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/docker', dockerRouter);

/**
 * @openapi
 * /system/credentials/verify:
 *   post:
 *     summary: Verify all configured credentials and API keys
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Verification report
 *       500:
 *         description: Internal server error
 */
apiV1Router.post('/system/credentials/verify', async (req: any, res: any) => {
  const requestId = req.requestId;
  try {
    const credManager = container.get<CredentialManagerService>(TYPES.CredentialManagerService);
    const report = await credManager.verifyAll();
    res.json(buildResponse(report, 200, requestId));
  } catch (err) {
    const requestId = req.requestId;
    res.status(500).json(buildError('Verification failed', 'VERIFICATION_ERROR', 500, requestId));
  }
});

/**
 * @openapi
 * /system/history/{metric}:
 *   get:
 *     summary: Retrieve history for a specific metric
 *     tags: [System]
 *     parameters:
 *       - in: path
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the metric (e.g., cpu, memory)
 *     responses:
 *       200:
 *         description: List of metric snapshots
 *       500:
 *         description: Internal server error
 */
apiV1Router.get('/system/history/:metric', async (req: any, res: any) => {
  const requestId = req.requestId;
  try {
    const { metric } = req.params;
    const historyService = container.get<HistoryService>(TYPES.HistoryService);
    const history = await historyService.getHistory(metric);
    res.json(buildResponse(history, 200, requestId));
  } catch (err) {
    const requestId = req.requestId;
    res.status(500).json(buildError('Internal server error', 'INTERNAL_ERROR', 500, requestId));
  }
});

// Standard API Routes

// Users (Prueba poniéndolo arriba)
apiV1Router.use('/users', usersRouter);

// Health check
apiV1Router.get('/health', (req: Request, res: Response) => {
  console.log('DEBUG: Health handler hit');
  const { requestId } = req as any;
  return res.status(200).json(
    buildResponse(
      {
        status: 'healthy',
        uptime: process.uptime(),
        version: '1.0.0',
      },
      200,
      requestId,
    ),
  );
});

// Other services
/**
 * @openapi
 * /stripe:
 *   get:
 *     summary: Stripe related endpoints (placeholder)
 *     tags: [Stripe]
 *     responses:
 *       200:
 *         description: Successful response
 */
apiV1Router.use('/stripe', stripeRouter);
/**
 * @openapi
 * /youtube:
 *   get:
 *     summary: YouTube related endpoints (placeholder)
 *     tags: [YouTube]
 *     responses:
 *       200:
 *         description: Successful response
 */
apiV1Router.use('/youtube', youtubeRouter);
// apiV1Router.use('/gmail', gmailRoutes);
// apiV1Router.use('/bigquery', bigqueryRoutes);
// apiV1Router.use('/cloud-monitoring', cloudMonitoringRoutes);
// apiV1Router.use('/youtube', youtubeRoutes);
// apiV1Router.use('/briefing', briefingRoutes);

// Dashboard Auth routes (refresh token, etc.)
// apiV1Router.post('/auth/refresh', dashboardAuth, (req, res) => {
//   const { user } = req as any;
//   const newToken = jwt.sign({ user: user.user, role: user.role }, env.JWT_SECRET, {
//     expiresIn: '7d',
//   });
//   res.json({ token: newToken });
// });

// Nueva ruta para el tracking de emails
// apiV1Router.get('/email/tracking', getEmailTracking);

import { dynamicRateLimiter } from '../middleware/rate-limit.middleware';

/**
 * @openapi
 * /ai:
 *   get:
 *     summary: AI related endpoints (placeholder)
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Successful response
 */
apiV1Router.use('/ai', dynamicRateLimiter, aiRouter);
apiV1Router.use('/rag', ragRoutes);
/**
 * @openapi
 * /exit-templates:
 *   get:
 *     summary: Exit email templates endpoints (placeholder)
 *     tags: [ExitEmail]
 *     responses:
 *       200:
 *         description: Successful response
 */
apiV1Router.use('/exit-templates', exitEmailRouter);

export default apiV1Router;
