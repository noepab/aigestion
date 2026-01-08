import { injectable } from 'inversify';
import os from 'os';

@injectable()
export class SystemHealthService {
  public getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: this.formatBytes(os.totalmem()),
      freeMemory: this.formatBytes(os.freemem()),
      loadAvg: os.loadavg(),
      uptime: os.uptime(),
    };
  }

  public getMemoryUsage() {
    const mem = process.memoryUsage();
    return {
      rss: this.formatBytes(mem.rss),
      heapTotal: this.formatBytes(mem.heapTotal),
      heapUsed: this.formatBytes(mem.heapUsed),
      external: this.formatBytes(mem.external),
      arrayBuffers: this.formatBytes(mem.arrayBuffers || 0),
    };
  }

  public getProcessMetrics(startTime: [number, number]) {
    const diff = process.hrtime(startTime);
    return {
      eventLoopLag: (diff[0] * 1000 + diff[1] / 1000000).toFixed(2) + 'ms',
    };
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
