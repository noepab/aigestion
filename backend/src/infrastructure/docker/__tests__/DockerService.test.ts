
import 'reflect-metadata';

import * as child_process from 'child_process';

import { DockerService } from '@/infrastructure/docker/DockerService';
import * as redisUtils from '@/utils/redis';

jest.mock('child_process');
jest.mock('@/utils/redis');

describe('DockerService', () => {
    let dockerService: DockerService;
    let mockExec: jest.Mock;

    beforeEach(() => {
        dockerService = new DockerService();
        mockExec = child_process.exec as unknown as jest.Mock;
        jest.resetAllMocks();
    });

    // Mock implementation of exec to simulate callback behavior
    const setupExecMock = (stdoutResult: string, errorResult: any = null) => {
        mockExec.mockImplementation((command, callback) => {
            callback(errorResult, { stdout: stdoutResult, stderr: '' });
            return {} as any; // child process object
        });
    };

    it('should get containers from cache if available', async () => {
        const cachedContainers = [{ id: '1', names: 'test-container' }];
        (redisUtils.getCache as jest.Mock).mockResolvedValue(JSON.stringify(cachedContainers));

        const result = await dockerService.getContainers();

        expect(redisUtils.getCache).toHaveBeenCalledWith('docker:containers');
        expect(mockExec).not.toHaveBeenCalled();
        expect(result).toEqual(cachedContainers);
    });

    it('should get containers from docker command if not in cache', async () => {
        (redisUtils.getCache as jest.Mock).mockResolvedValue(null);
        const container = { ID: '1', Names: 'test-container' };
        // JSON output from docker command
        setupExecMock(JSON.stringify(container));

        const result = await dockerService.getContainers();

        expect(mockExec).toHaveBeenCalledWith(
            expect.stringContaining('docker ps'),
            expect.any(Function)
        );
        expect(result).toEqual([container]);
        expect(redisUtils.setCache).toHaveBeenCalled();
    });

    it('should return empty list if docker command returns empty string', async () => {
        (redisUtils.getCache as jest.Mock).mockResolvedValue(null);
        setupExecMock('');

        const result = await dockerService.getContainers();

        expect(result).toEqual([]);
    });

    it('should get container stats', async () => {
        const stats = { PIDs: '10' };
        setupExecMock(JSON.stringify(stats));

        const result = await dockerService.getContainerStats('123');

        expect(mockExec).toHaveBeenCalledWith(
            expect.stringContaining('docker stats'),
            expect.any(Function)
        );
        expect(result).toEqual(stats);
    });

    it('should start a container', async () => {
        setupExecMock('');
        await dockerService.startContainer('123');
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('docker start 123'), expect.any(Function));
    });

    it('should stop a container', async () => {
        setupExecMock('');
        await dockerService.stopContainer('123');
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('docker stop 123'), expect.any(Function));
    });
});
