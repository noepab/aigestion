import { Router } from 'express';
import type { Request, Response } from 'express-serve-static-core';
import fetch from 'node-fetch';

import { env } from '../config/env.schema';

const mcpRouter = Router();

/**
 * @openapi
 * /mcp/health:
 *   get:
 *     summary: Check MCP server health
 *     tags: [MCP]
 *     responses:
 *       200:
 *         description: MCP server is reachable
 *       502:
 *         description: Unable to reach MCP server
 */
mcpRouter.get('/health', async (_req: Request, res: Response) => {
  const baseUrl = env.MCP_SERVER_URL;
  if (!baseUrl) {
    return (res as any).status(500).json({ error: 'MCP_SERVER_URL not configured' });
  }
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      return (res as any)
        .status(502)
        .json({ error: 'MCP server responded with error', status: response.status });
    }
    const data = await response.json();
    return (res as any).status(200).json({ status: 'ok', mcp: data });
  } catch (err) {
    return (res as any).status(502).json({
      error: 'Failed to reach MCP server',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default mcpRouter;
