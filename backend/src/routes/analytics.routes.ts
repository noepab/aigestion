import { Router } from 'express';
import {
  getAnalyticsOverview,
  getErrorRates,
  getSystemUsage,
  getUserActivity,
  getDashboardData,
  exportReport,
} from '../controllers/analytics.controller';

const router = Router();

router.get('/overview', getAnalyticsOverview);
router.get('/user-activity', getUserActivity);
router.get('/system-usage', getSystemUsage);
router.get('/error-rates', getErrorRates);
router.get('/dashboard-data', getDashboardData);
router.get('/export', exportReport);

export default router;
