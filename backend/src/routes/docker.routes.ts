// src/routes/docker.routes.ts
import { Router, Request, Response } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../types';
import { DockerService } from '../infrastructure/docker/DockerService';

const router = Router();
const dockerService = container.get<DockerService>(TYPES.DockerService);

/**
 * @openapi
 * /docker/containers:
 *   get:
 *     summary: List all Docker containers
 *     tags: [Docker]
 *     responses:
 *       200:
 *         description: List of containers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Docker error
 */
// GET /docker/containers - list all containers
router.get('/containers', async (req: Request, res: Response) => {
  try {
    const containers = await dockerService.getContainers();
    res.json({ data: containers });
  } catch (err) {
    res.status(500).json({ error: (err as any).message ?? 'Docker error' });
  }
});

/**
 * @openapi
 * /docker/containers/{id}/stats:
 *   get:
 *     summary: Get stats for a specific container
 *     tags: [Docker]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container ID
 *     responses:
 *       200:
 *         description: Container stats
 *       500:
 *         description: Docker error
 */
// GET /docker/containers/:id/stats - get stats for a container
router.get('/containers/:id/stats', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const stats = await dockerService.getContainerStats(id);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: (err as any).message ?? 'Docker error' });
  }
});

/**
 * @openapi
 * /docker/containers/{id}/start:
 *   post:
 *     summary: Start a specific container
 *     tags: [Docker]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container ID
 *     responses:
 *       200:
 *         description: Container started
 *       500:
 *         description: Docker error
 */
// POST /docker/containers/:id/start - start a container
router.post('/containers/:id/start', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await dockerService.startContainer(id);
    res.json({ message: `Container ${id} started` });
  } catch (err) {
    res.status(500).json({ error: (err as any).message ?? 'Docker error' });
  }
});

/**
 * @openapi
 * /docker/containers/{id}/stop:
 *   post:
 *     summary: Stop a specific container
 *     tags: [Docker]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container ID
 *     responses:
 *       200:
 *         description: Container stopped
 *       500:
 *         description: Docker error
 */
// POST /docker/containers/:id/stop - stop a container
router.post('/containers/:id/stop', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await dockerService.stopContainer(id);
    res.json({ message: `Container ${id} stopped` });
  } catch (err) {
    res.status(500).json({ error: (err as any).message ?? 'Docker error' });
  }
});

export default router;
