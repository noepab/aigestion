import { Router } from 'express';

import {
  exportReport,
  getAnalyticsOverview,
  getDashboardData,
  getErrorRates,
  getSystemUsage,
  getUserActivity,
} from '../controllers/analytics.controller';

import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

router.get('/overview', cacheMiddleware(600), getAnalyticsOverview);
router.get('/user-activity', cacheMiddleware(300), getUserActivity);
router.get('/system-usage', cacheMiddleware(120), getSystemUsage);
router.get('/error-rates', cacheMiddleware(60), getErrorRates);
router.get('/dashboard-data', cacheMiddleware(300), getDashboardData);
router.get('/export', exportReport);

export default router;
