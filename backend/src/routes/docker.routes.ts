import { Router } from 'express';
import {
  getContainers,
  getContainerStats,
  getImages,
  getNetworks,
  getVolumes,
  restartContainer,
  startContainer,
  stopContainer,
} from '../controllers/docker.controller';

const router = Router();

router.get('/containers', getContainers);
router.get('/containers/:id/stats', getContainerStats);
router.post('/containers/:id/start', startContainer);
router.post('/containers/:id/stop', stopContainer);
router.post('/containers/:id/restart', restartContainer);
router.get('/images', getImages);
router.get('/volumes', getVolumes);
router.get('/networks', getNetworks);

export default router;
