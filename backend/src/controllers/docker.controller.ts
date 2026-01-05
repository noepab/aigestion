import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getCache, setCache } from '../utils/redis';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * Get all Docker containers
 */
export async function getContainers(_req: Request, res: Response): Promise<void> {
  try {
    const cacheKey = 'docker:containers';
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
      res.json(cachedData);
      return;
    }

    const { stdout } = await execAsync('docker ps -a --format "{{json .}}"');

    const containers = stdout
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Cache for 5 seconds (containers change frequently)
    await setCache(cacheKey, JSON.stringify(containers), 5);

    res.json(containers);
  } catch (error: any) {
    console.error('Error getting Docker containers:', error);

    // If Docker is not running or not installed
    if (error.message?.includes('Cannot connect to the Docker daemon')) {
      res.status(503).json({
        error: 'Docker daemon is not running',
        containers: [],
      });
      return;
    }

    res.status(500).json({ error: 'Failed to get containers', containers: [] });
    return;
  }
}

/**
 * Get container stats
 */
export async function getContainerStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { stdout } = await execAsync(`docker stats ${id} --no-stream --format "{{json .}}"`);

    const stats = JSON.parse(stdout.trim());
    res.json(stats);
  } catch (error) {
    logger.error(error, 'Error getting container stats:');
    res.status(500).json({ error: 'Failed to get container stats' });
    return;
  }
}

/**
 * Start a container
 */
export async function startContainer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await execAsync(`docker start ${id}`);

    res.json({ success: true, message: `Container ${id} started` });
  } catch (error) {
    logger.error(error, 'Error starting container:');
    res.status(500).json({ error: 'Failed to start container' });
    return;
  }
}

/**
 * Stop a container
 */
export async function stopContainer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await execAsync(`docker stop ${id}`);

    res.json({ success: true, message: `Container ${id} stopped` });
  } catch (error) {
    logger.error(error, 'Error stopping container:');
    res.status(500).json({ error: 'Failed to stop container' });
    return;
  }
}

/**
 * Restart a container
 */
export async function restartContainer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await execAsync(`docker restart ${id}`);

    res.json({ success: true, message: `Container ${id} restarted` });
  } catch (error) {
    logger.error(error, 'Error restarting container:');
    res.status(500).json({ error: 'Failed to restart container' });
    return;
  }
}

/**
 * Get Docker images
 */
export async function getImages(_req: Request, res: Response): Promise<void> {
  try {
    const { stdout } = await execAsync('docker images --format "{{json .}}"');

    const images = stdout
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    res.json(images);
  } catch (error) {
    console.error('Error getting Docker images:', error);
    res.status(500).json({ error: 'Failed to get images', images: [] });
  }
}

/**
 * Get Docker volumes
 */
export async function getVolumes(_req: Request, res: Response): Promise<void> {
  try {
    const { stdout } = await execAsync('docker volume ls --format "{{json .}}"');

    const volumes = stdout
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    res.json(volumes);
  } catch (error) {
    console.error('Error getting Docker volumes:', error);
    res.status(500).json({ error: 'Failed to get volumes', volumes: [] });
  }
}

/**
 * Get Docker networks
 */
export async function getNetworks(_req: Request, res: Response): Promise<void> {
  try {
    const { stdout } = await execAsync('docker network ls --format "{{json .}}"');

    const networks = stdout
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    res.json(networks);
  } catch (error) {
    console.error('Error getting Docker networks:', error);
    res.status(500).json({ error: 'Failed to get networks', networks: [] });
  }
}
