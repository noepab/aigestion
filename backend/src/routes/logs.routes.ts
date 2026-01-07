import { Router } from 'express';

import { clearLogs, getRecentLogs } from '../controllers/logs.controller';

const router = Router();

router.get('/recent', getRecentLogs);
router.delete('/clear', clearLogs);

export default router;
