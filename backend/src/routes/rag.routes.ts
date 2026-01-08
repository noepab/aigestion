import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = Router();

// GET /rag?query=... -> forwards to ml-service recall
router.get('/', async (req: Request, res: Response) => {
  const query = req.query.query as string;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }
  try {
    const mlResponse = await axios.post('http://localhost:8000/recall', { query, limit: 5 }, { timeout: 3000 });
    res.json(mlResponse.data);
  } catch (error: any) {
    logger.warn(`[RagRoute] Failed to contact ml-service: ${error.message}`);
    res.status(502).json({ error: 'Failed to retrieve documentation context' });
  }
});

export default router;
