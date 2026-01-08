import { exec } from 'child_process';
import { injectable } from 'inversify';
import * as os from 'os';
import { promisify } from 'util';

import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  uptime: number;
  platform: NodeJS.Platform;
  hostname: string;
  timestamp: number;
  dockerContainerCount?: number;
}

@injectable()
export class SystemMetricsService {
  private lastNetworkStats: { rx: number; tx: number; time: number } | null = null;

  /**
   * Get all system metrics aggregated
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const [cpu, memory, network, disk, dockerCount] = await Promise.all([
      this.getCPUUsage(),
      this.getMemoryUsage(),
      this.getNetworkUsage(),
      this.getDiskUsage(),
      this.getDockerContainerCount(),
    ]);

    return {
      cpu,
      memory,
      network,
      disk,
      dockerContainerCount: dockerCount,
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  async getCPUUsage(): Promise<number> {
    const cpus = os.cpus();
    const usage =
      cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / (total || 1)) * 100;
      }, 0) / cpus.length;

    return parseFloat(usage.toFixed(2));
  }

  /**
   * Calculate Memory usage percentage
   */
  async getMemoryUsage(): Promise<number> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return parseFloat(((usedMem / totalMem) * 100).toFixed(2));
  }

  /**
   * Get aggregated Disk usage percentage (C: drive for Windows, root for others as fallback)
   */
  async getDiskUsage(): Promise<number> {
    try {
      if (os.platform() === 'win32') {
        const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
        const lines = stdout.trim().split('\n').slice(1);
        let total = 0;
        let free = 0;

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3 && parts[0].includes('C:')) {
            free += parseInt(parts[1]);
            total += parseInt(parts[2]);
          }
        }
        return total > 0 ? parseFloat((((total - free) / total) * 100).toFixed(2)) : 0;
      }
      return 0; // Fallback for now or implement linux `df - h`
    } catch (e) {
      logger.error('Error getting disk usage', e);
      return 0;
    }
  }

  /**
   * Get Network activity score (0-100) based on rx bytes
   */
  async getNetworkUsage(): Promise<number> {
    let totalBytes = 0;

    try {
      if (os.platform() === 'win32') {
        const { stdout } = await execAsync(
          'powershell -Command "Get-NetAdapterStatistics | Select-Object -ExpandProperty ReceivedBytes"',
        );
        totalBytes = stdout.split('\n').reduce((acc, val) => acc + (parseInt(val.trim()) || 0), 0);
      } else {
        // Fallback or Linux implementation
        return 0;
      }
    } catch (e) {
      return 0;
    }

    const now = Date.now();
    if (this.lastNetworkStats) {
      const elapsed = (now - this.lastNetworkStats.time) / 1000;
      const delta = (totalBytes - this.lastNetworkStats.rx) / 1024 / 1024; // MB
      this.lastNetworkStats = { rx: totalBytes, tx: 0, time: now };
      return parseFloat(Math.max(0, Math.min(100, (delta / (elapsed || 1)) * 10)).toFixed(2));
    }

    this.lastNetworkStats = { rx: totalBytes, tx: 0, time: now };
    return 0;
  }

  /**
   * Get active Docker container count
   */
  async getDockerContainerCount(): Promise<number> {
    try {
      const { stdout } = await execAsync(
        'docker ps -q | Measure-Object | Select-Object -ExpandProperty Count',
      );
      return parseInt(stdout.trim()) || 0;
    } catch {
      try {
        const { stdout } = await execAsync('docker ps -q');
        return stdout
          .trim()
          .split('\n')
          .filter(line => line).length;
      } catch {
        return 0;
      }
    }
  }
}
