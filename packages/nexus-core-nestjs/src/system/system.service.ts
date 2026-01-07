import { Injectable } from '@nestjs/common';

@Injectable()
export class SystemService {
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  getMetrics() {
    // Placeholder for real metrics aggregation
    return {
      requestsTotal: 1250,
      activeUsers: 42,
      aiRequests: 85,
      apiLatencyAvg: '145ms',
    };
  }
}
