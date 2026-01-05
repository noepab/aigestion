import { Request, Response } from 'express';
import Log from '../models/Log';

/**
 * Add a log entry (Internal use)
 */
export async function addLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  metadata?: any,
  source: string = 'system'
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
    const limit = parseInt(req.query.limit as string) || 100;
    const level = req.query.level as string;
    const source = req.query.source as string;

    const query: any = {};
    if (level) query.level = level;
    if (source) query.source = source;

    const logs = await Log.find(query).sort({ timestamp: -1 }).limit(limit);

    res.json(logs);
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
}

/**
 * Clear logs (Admin only - ideally just drop collection or remove older)
 */
export async function clearLogs(_req: Request, res: Response) {
  try {
    await Log.deleteMany({});
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
}
