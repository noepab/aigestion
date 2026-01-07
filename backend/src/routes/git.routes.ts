import { Router } from 'express';

import { getBranches, getGitStats, getRecentCommits } from '../controllers/git.controller';

const router = Router();

router.get('/commits', getRecentCommits);
router.get('/branches', getBranches);
router.get('/stats', getGitStats);

export default router;
