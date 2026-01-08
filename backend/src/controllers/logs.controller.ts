import type { Request, Response } from 'express-serve-static-core';

import { buildError, buildResponse } from '../common/response-builder';
import Log from '../models/Log';

/**
 * Add a log entry (Internal use)
 */
export async function addLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  metadata?: any,
  source = 'system',
) {
  try {
    const log = await Log.create({
      level,
      message,
      metadata,
      source,
      timestamp: new Date(),
    });
    return log;
  } catch (error) {
    console.error('Failed to write log to DB:', error);
    return null;
  }
}

/**
 * Get recent logs
 */
export async function getRecentLogs(req: Request, res: Response) {
  try {
    const limit = parseInt((req as any).query.limit as string) || 100;
    const level = ((req as any).query.level as string) || 'info';
    const source = req.query.source as string; // Keep this line from original

    const query: any = {};
    if (level) {
      query.level = level;
    }
    if (source) {
      query.source = source;
    }

    const logs = await Log.find(query).sort({ timestamp: -1 }).limit(limit);

    (res as any).json(buildResponse(logs, 200, (req as any).requestId));
  } catch (error) {
    console.error('Error getting logs:', error);
    (res as any)
      .status(500)
      .json(buildError('Failed to fetch logs', 'LOGS_ERROR', 500, (req as any).requestId));
  }
}

/**
 * Clear logs (Admin only - ideally just drop collection or remove older)
 */
export async function clearLogs(req: Request, res: Response) {
  try {
    await Log.deleteMany({});
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    (res as any)
      .status(500)
      .json(buildError('Failed to clear logs', 'LOGS_ERROR', 500, (req as any).requestId));
  }
}
