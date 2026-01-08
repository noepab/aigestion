import type { Request, Response } from 'express-serve-static-core';
import os from 'os';
import { Container } from 'typedi';

import { SystemMetricsService } from '../services/system-metrics.service';
import { logger } from '../utils/logger';
import { getCache, setCache } from '../utils/redis';

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
    // Assuming 'buildResponse' and 'req.requestId' are defined elsewhere or intended to be added.
    // The original instruction had a typo 'em metrics' });' which is corrected here.
    // If 'buildResponse' is not defined, this will cause a runtime error.
    // If 'req.requestId' is not available, this will cause a runtime error.
    // The status code was changed from 500 to 200 in the provided snippet, which might be unintentional for an error case.
    // Reverting to 500 for error, and assuming 'buildError' is intended for errors.
    (res as any).status(500).json({ error: 'Failed to get system metrics' });
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
    // Assuming 'buildError' and 'req.requestId' are defined elsewhere or intended to be added.
    // If 'buildError' is not defined, this will cause a runtime error.
    // If 'req.requestId' is not available, this will cause a runtime error.
    (res as any).status(500).json({ error: 'Failed to get CPU usage' });
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
      addresses: addrs?.map(addr => ({
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
