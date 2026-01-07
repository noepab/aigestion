import 'reflect-metadata';

import { jest } from '@jest/globals';

import { AlertingService } from '../../services/alerting.service';
import { SystemMetricsService } from '../../services/system-metrics.service';
import { TelegramService } from '../../services/telegram.service';

describe('AlertingService', () => {
  let alertingService: AlertingService;
  let mockMetricsService: any;
  let mockTelegramService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock metrics service
    mockMetricsService = {
      getSystemMetrics: jest.fn(),
      getDockerContainerCount: jest.fn(),
    } as unknown as SystemMetricsService;

    // Create mock telegram service
    mockTelegramService = {
      sendMessage: jest.fn(),
    } as unknown as TelegramService;

    alertingService = new AlertingService(mockMetricsService, mockTelegramService);
  });

  describe('checkSystemHealth', () => {
    it('should trigger alert if CPU is high', async () => {
      mockMetricsService.getSystemMetrics.mockResolvedValue({
        cpu: 95,
        memory: 50,
        disk: 50,
      });

      await alertingService.checkSystemHealth();
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('High CPU Usage')
      );
    });

    it('should not trigger alert if metrics are normal', async () => {
      mockMetricsService.getSystemMetrics.mockResolvedValue({
        cpu: 20,
        memory: 40,
        disk: 30,
      });

      await alertingService.checkSystemHealth();
      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('checkDockerHealth', () => {
    it('should trigger alert if 0 containers', async () => {
      mockMetricsService.getDockerContainerCount.mockResolvedValue(0);

      await alertingService.checkDockerHealth();
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('No Docker containers')
      );
    });

    it('should not trigger alert if containers exist', async () => {
      mockMetricsService.getDockerContainerCount.mockResolvedValue(5);

      await alertingService.checkDockerHealth();
      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });
  });
});
