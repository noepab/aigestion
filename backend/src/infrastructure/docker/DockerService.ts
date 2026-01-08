import { exec } from 'child_process';
import { injectable } from 'inversify';
import { promisify } from 'util';

import { logger } from '../../utils/logger';
import { getCache, setCache } from '../../utils/redis';

const execAsync = promisify(exec);

@injectable()
export class DockerService {
  /**
   * Get all containers
   */
  async getContainers(): Promise<any[]> {
    const cacheKey = 'docker:containers';
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    try {
      const { stdout } = await execAsync('docker ps -a --format "{{json .}}"');

      const containers = stdout
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // Cache for 5 seconds
      await setCache(cacheKey, JSON.stringify(containers), 5);
      return containers;
    } catch (error: any) {
      logger.error('Error getting Docker containers:', error);
      throw error;
    }
  }

  /**
   * Get container stats
   */
  async getContainerStats(id: string): Promise<any> {
    try {
      const { stdout } = await execAsync(`docker stats ${id} --no-stream --format "{{json .}}"`);
      return JSON.parse(stdout.trim());
    } catch (error) {
      logger.error(error, 'Error getting container stats:');
      throw error; // Propagate error for handling by caller
    }
  }

  /**
   * Start container
   */
  async startContainer(id: string): Promise<void> {
    try {
      await execAsync(`docker start ${id}`);
    } catch (error) {
      logger.error(error, 'Error starting container:');
      throw error;
    }
  }

  /**
   * Stop container
   */
  async stopContainer(id: string): Promise<void> {
    try {
      await execAsync(`docker stop ${id}`);
    } catch (error) {
      logger.error(error, 'Error stopping container:');
      throw error;
    }
  }

  /**
   * Restart container
   */
  async restartContainer(id: string): Promise<void> {
    try {
      await execAsync(`docker restart ${id}`);
    } catch (error) {
      logger.error(error, 'Error restarting container:');
      throw error;
    }
  }

  /**
   * Get images
   */
  async getImages(): Promise<any[]> {
    try {
      const { stdout } = await execAsync('docker images --format "{{json .}}"');
      return stdout
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      logger.error('Error getting Docker images:', error);
      throw error;
    }
  }

  /**
   * Get volumes
   */
  async getVolumes(): Promise<any[]> {
    try {
      const { stdout } = await execAsync('docker volume ls --format "{{json .}}"');
      return stdout
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      logger.error('Error getting Docker volumes:', error);
      throw error;
    }
  }

  /**
   * Get networks
   */
  async getNetworks(): Promise<any[]> {
    try {
      const { stdout } = await execAsync('docker network ls --format "{{json .}}"');
      return stdout
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      logger.error('Error getting Docker networks:', error);
      throw error;
    }
  }
}
