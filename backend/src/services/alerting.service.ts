import { inject, injectable } from 'inversify';

import { TYPES } from '../types';
import { logger } from '../utils/logger';
import { SystemMetricsService } from './system-metrics.service';
import { TelegramService } from './telegram.service';

@injectable()
export class AlertingService {
  private thresholds = {
    cpu: 90,
    memory: 90,
    disk: 90,
  };

  constructor(
    @inject(TYPES.SystemMetricsService) private metricsService: SystemMetricsService,
    @inject(TYPES.TelegramService) private telegramService: TelegramService,
  ) {}

  /**
   * Check system health and trigger alerts if thresholds are exceeded
   */
  async checkSystemHealth(): Promise<void> {
    try {
      const metrics = await this.metricsService.getSystemMetrics();

      if (metrics.cpu > this.thresholds.cpu) {
        await this.triggerAlert(`⚠️ High CPU Usage: ${metrics.cpu}%`, this.telegramService);
      }

      if (metrics.memory > this.thresholds.memory) {
        await this.triggerAlert(`⚠️ High Memory Usage: ${metrics.memory}%`, this.telegramService);
      }

      if (metrics.disk > this.thresholds.disk) {
        await this.triggerAlert(`⚠️ High Disk Usage: ${metrics.disk}%`, this.telegramService);
      }

      logger.info('System health check completed');
    } catch (error) {
      logger.error('Failed to check system health', error);
    }
  }

  /**
   * Check Docker container health
   */
  async checkDockerHealth(): Promise<void> {
    try {
      const count = await this.metricsService.getDockerContainerCount();
      logger.info(`Docker check: ${count} running containers`);

      if (count === 0) {
        await this.triggerAlert('⚠️ No Docker containers passing checks!', this.telegramService);
      }
    } catch (error) {
      logger.error('Failed to check Docker health', error);
    }
  }

  private async triggerAlert(message: string, telegramService: TelegramService) {
    logger.warn(`ALERT: ${message}`);
    await telegramService.sendMessage(`🚨 SYSTEM ALERT: ${message}`);
  }
}
