import { exec } from 'child_process';
import type { Request, Response } from 'express-serve-static-core';
import { promisify } from 'util';

import { buildError } from '../common/response-builder';

const execAsync = promisify(exec);

/**
 * Get recent Git commits
 */
export async function getRecentCommits(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get commits with format: hash|author|date|subject
    const { stdout } = await execAsync(`git log -${limit} --pretty=format:"%H|%an|%ai|%s"`);

    const commits = stdout
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [hash, author, date, message] = line.split('|');
        return {
          hash,
          author,
          date,
          message,
          subject: message, // Alias for compatibility
        };
      });

    res.json(commits);
  } catch (error: any) {
    console.error('Error getting Git commits:', error);

    // If not a git repository or git not available
    if (error.message?.includes('not a git repository') || error.message?.includes('git')) {
      res.json([
        {
          hash: 'demo123',
          author: 'Developer',
          date: new Date().toISOString(),
          message: 'Initial commit',
          subject: 'Initial commit',
        },
      ]);
      return;
    }

    (res as any)
      .status(500)
      .json(buildError('Failed to get status', 'GIT_ERROR', 500, (req as any).requestId));
  }
}

/**
 * Get Git branches
 */
export async function getBranches(_req: Request, res: Response): Promise<void> {
  try {
    const { stdout } = await execAsync('git branch -a');

    const branches = stdout
      .trim()
      .split('\n')
      .map(branch => branch.trim().replace('* ', ''))
      .filter(branch => branch);

    res.json(branches);
  } catch (error) {
    console.error('Error getting Git branches:', error);
    res.json(['main', 'develop']); // Fallback
  }
}

/**
 * Get Git stats
 */
export async function getGitStats(_req: Request, res: Response): Promise<void> {
  try {
    // Get total commits
    const { stdout: commitCount } = await execAsync('git rev-list --count HEAD');

    // Get contributors
    const { stdout: contributors } = await execAsync('git shortlog -sn HEAD');

    const stats = {
      totalCommits: parseInt(commitCount.trim()),
      contributors: contributors
        .trim()
        .split('\n')
        .map(line => {
          const [commits, ...nameParts] = line.trim().split(/\s+/);
          return {
            name: nameParts.join(' '),
            commits: parseInt(commits),
          };
        }),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting Git stats:', error);
    res.json({
      totalCommits: 0,
      contributors: [],
    });
  }
}
