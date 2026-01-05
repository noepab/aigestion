import { Router, Request, Response } from 'express';
import { buildResponse } from '../common/response-builder';
// import { buildError, buildResponse, requestIdMiddleware } from '../common/response-builder';
import { requestIdMiddleware } from '../common/response-builder';
// import gmailRoutes from './gmail.routes';
// import bigqueryRoutes from './bigquery.routes';
// import cloudMonitoringRoutes from './cloudMonitoring.routes';
// import jwt from 'jsonwebtoken';
// import { env } from '../config/env.schema';
// import { dashboardAuth } from '../middleware/dashboardAuth';
import stripeRouter from './stripe.routes';
import youtubeRouter from './youtube.routes';
import usersRouter from './users.routes';
import aiRouter from './ai.routes';
import exitEmailRouter from '../controllers/exitEmail.controller';
// import { getEmailTracking } from '../controllers/email-tracking.controller';
// import briefingRoutes from './briefing.routes';

import { container } from '../config/inversify.config';
import { TYPES } from '../types';
import { CredentialManagerService } from '../services/credential-manager.service';
import { HistoryService } from '../services/history.service';

/**
 * API v1 Router
 * Base estandarizada para todas las rutas versionadas
 */
const apiV1Router = Router();

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
apiV1Router.post('/system/credentials/verify', async (_req: any, res: any) => {
  try {
    const credManager = container.get<CredentialManagerService>(TYPES.CredentialManagerService);
    const report = await credManager.verifyAll();
    res.json(report);
  } catch (err) {
    console.error('Credential verification failed:', err);
    res.status(500).json({ error: 'Verification failed' });
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
  try {
    const { metric } = req.params;
    const historyService = container.get<HistoryService>(TYPES.HistoryService);
    const history = await historyService.getHistory(metric);
    res.json(history);
  } catch (err) {
    console.error('Failed to get history:', err);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Middleware
apiV1Router.use(requestIdMiddleware);
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

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Utility]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
apiV1Router.get('/health', (req: Request, res: Response) => {
  const { requestId } = req as any;
  return res.status(200).json(
    buildResponse(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
      },
      200,
      requestId
    )
  );
});

// Users routes
// Users routes
/**
 * @openapi
 * /users:
 *   get:
 *     summary: Users related endpoints (placeholder)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Successful response
 */
apiV1Router.use('/users', usersRouter);

// AI routes
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
apiV1Router.use('/ai', aiRouter);
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
