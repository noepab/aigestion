import { Router } from 'express';

// import aiRoutes from './ai.routes';
// import analyticsRoutes from './analytics.routes';
import apiV1Routes from './api-v1.routes';
// import authRoutes from './auth.routes';
// import dockerRoutes from './docker.routes';
// import gitRoutes from './git.routes';
// import logsRoutes from './logs.routes';
// import socialRoutes from './social.routes';
// import systemRoutes from './system.routes';
// import briefingRoutes from './briefing.routes';
// import whatsappRoutes from './whatsapp.routes';
// import marketingRoutes from './marketing.routes';

// import simaRoutes from './sima.routes';
// import labsRoutes from './labs.routes';
// import cloudRoutes from './cloud.routes';

const router = Router();
console.log('DEBUG: Index router loaded');

// Health Check
// router.get('/health', healthCheck);

// API v1 - Standardized endpoints
router.use('/', apiV1Routes);

// SIMA Routes (New)
// router.use('/sima', simaRoutes);

// AI Labs Routes (NotebookLM, etc.)
// router.use('/labs', labsRoutes);

// Cloud Management Routes
// router.use('/cloud', cloudRoutes);

// Marketing & Identity Routes
// router.use('/marketing', marketingRoutes);

// Legacy routes (deprecated - use /api/v1 instead)
// router.use('/system', systemRoutes);
// router.use('/docker', dockerRoutes);
// router.use('/logs', logsRoutes);
// router.use('/ai', aiLimiter, aiRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/git', gitRoutes);
// router.use('/auth', authLimiter, authRoutes);
// router.use('/social', socialRoutes);
// router.use('/briefing', briefingRoutes);
// import billingRoutes from './billing.routes';
// router.use('/billing', billingRoutes);
// import kpiRoutes from './kpi.routes';
// router.use('/kpi', kpiRoutes);

export default router;
