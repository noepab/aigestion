import { Router } from 'express';

import {
  getCPUUsage,
  getDiskUsage,
  getMemoryUsage,
  getNetworkStats,
  getSystemMetrics,
} from '../controllers/system.controller';

const router = Router();

router.get('/metrics', getSystemMetrics);
router.get('/cpu', getCPUUsage);
router.get('/memory', getMemoryUsage);
router.get('/disk', getDiskUsage);
router.get('/network', getNetworkStats);

export default router;
