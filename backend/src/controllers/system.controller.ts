import { Request, Response } from 'express';
import os from 'os';
import { Container } from 'typedi';
import { SystemMetricsService } from '../services/system-metrics.service';
import { getCache, setCache } from '../utils/redis';
import { logger } from '../utils/logger';

/**
 * Get system metrics (CPU, Memory, Disk, Network)
 */
export async function getSystemMetrics(_req: Request, res: Response): Promise<void> {
  try {
    const cacheKey = 'system:metrics:real';
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }

    const metricsService = Container.get(SystemMetricsService);
    const metrics = await metricsService.getSystemMetrics();

    await setCache(cacheKey, JSON.stringify(metrics), 2);
    res.json(metrics);
  } catch (error) {
    logger.error(error, 'Error getting system metrics');
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
}

/**
 * Get CPU usage
 */
export async function getCPUUsage(_req: Request, res: Response) {
  try {
    const metricsService = Container.get(SystemMetricsService);
    const cpuUsage = await metricsService.getCPUUsage();
    const cpus = os.cpus();

    res.json({
      usage: cpuUsage,
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get CPU usage' });
  }
}

/**
 * Get memory usage
 */
export async function getMemoryUsage(_req: Request, res: Response) {
  try {
    const metricsService = Container.get(SystemMetricsService);
    const usagePercent = await metricsService.getMemoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    res.json({
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usagePercent: usagePercent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get memory usage' });
  }
}

/**
 * Get disk usage
 */
export async function getDiskUsage(_req: Request, res: Response) {
  try {
    const metricsService = Container.get(SystemMetricsService);
    const usage = await metricsService.getDiskUsage();
    res.json({ usage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get disk usage' });
  }
}

/**
 * Get network stats
 */
export async function getNetworkStats(_req: Request, res: Response) {
  try {
    const networkInterfaces = os.networkInterfaces();
    const interfaces = Object.entries(networkInterfaces).map(([name, addrs]) => ({
      name,
      addresses: addrs?.map((addr) => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal,
      })),
    }));

    res.json({ interfaces });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get network stats' });
  }
}
