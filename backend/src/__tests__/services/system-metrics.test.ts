import 'reflect-metadata';

import { jest } from '@jest/globals';

import { SystemMetricsService } from '../../services/system-metrics.service';

// Mock child_process exec
const mockExec = jest.fn((_cmd: string, cb: any) => {
  cb(null, { stdout: '' });
});

jest.mock('child_process', () => ({
  exec: (cmd: string, cb: any) => mockExec(cmd, cb),
}));

describe('SystemMetricsService', () => {
  let service: SystemMetricsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SystemMetricsService();
  });

  describe('getCPUUsage', () => {
    it('should calculate CPU usage', async () => {
      // os.cpus() is already mocked in setup.ts or can be mocked here if strict
      const usage = await service.getCPUUsage();
      expect(typeof usage).toBe('number');
      expect(usage).toBeGreaterThanOrEqual(0);
      expect(usage).toBeLessThanOrEqual(100);
    });
  });

  describe('getMemoryUsage', () => {
    it('should calculate memory usage', async () => {
      const usage = await service.getMemoryUsage();
      expect(typeof usage).toBe('number');
    });
  });

  describe('getDockerContainerCount', () => {
    it('should parse docker ps output', async () => {
      mockExec.mockImplementation(((_cmd: string, cb: any) => {
        cb(null, { stdout: '5' }); // Mock 5 containers
      }) as any);

      const count = await service.getDockerContainerCount();
      expect(count).toBe(5);
    });

    it('should return 0 on error', async () => {
      mockExec.mockImplementation(((_cmd: string, cb: any) => {
        cb(new Error('Command failed'));
      }) as any);

      const count = await service.getDockerContainerCount();
      expect(count).toBe(0);
    });
  });
});
