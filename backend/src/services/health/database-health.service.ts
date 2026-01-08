import { injectable } from 'inversify';
import mongoose from 'mongoose';

import { getRedisClient } from '../../cache/redis';
import { getRabbitMQChannel } from '../../queue/rabbitmq';
import { logger } from '../../utils/logger';

@injectable()
export class DatabaseHealthService {
  public async getMongoHealth() {
    const connection = mongoose.connection;
    const readyState = connection.readyState;
    const isConnected = readyState === 1;

    let stats = null;
    let message = 'Checking database status...';

    if (isConnected && connection.db) {
      try {
        await connection.db.command({ ping: 1 });
        message = 'MongoDB connection is healthy';
        stats = await this.getDatabaseStats(connection.db);
      } catch (error) {
        message = 'MongoDB connection is unstable';
        logger.error(error, 'MongoDB ping failed');
      }
    }

    return {
      status: isConnected ? 'connected' : 'disconnected',
      readyState,
      host: connection.host || 'unknown',
      name: connection.name || 'unknown',
      version: (connection as any)?.version || 'unknown',
      message,
      stats,
    };
  }

  public async getRedisHealth() {
    const redisClient = getRedisClient();
    if (!redisClient) {
      return { status: 'disabled', message: 'Redis client not initialized' };
    }

    try {
      const [info] = await Promise.all([redisClient.info(), redisClient.ping()]);
      const redisInfo: Record<string, string> = {};
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value && !key.startsWith('#')) {
          redisInfo[key] = value.trim();
        }
      });

      return {
        status: 'ok',
        version: redisInfo.redis_version,
        usedMemory: redisInfo.used_memory_human,
        connectedClients: parseInt(redisInfo.connected_clients || '0', 10),
        message: 'Redis is healthy',
      };
    } catch (error) {
      logger.error(error, 'Redis health check failed');
      return { status: 'error', message: 'Redis connection error' };
    }
  }

  public async getRabbitMQHealth() {
    const timeoutPromise = new Promise<{ status: string; message: string }>(resolve => {
      setTimeout(() => resolve({ status: 'disabled', message: 'RabbitMQ timeout' }), 2000);
    });

    const checkPromise = (async () => {
      try {
        const channel = await getRabbitMQChannel();
        if (!channel) {
          return { status: 'disabled', message: 'RabbitMQ channel not available' };
        }

        // Simple check
        const testQueue = `health-check-${Date.now()}`;
        await channel.assertQueue(testQueue, { durable: false, autoDelete: true });
        await channel.deleteQueue(testQueue);

        return { status: 'ok', message: 'RabbitMQ is healthy' };
      } catch (e) {
        logger.error(e, 'RabbitMQ check check failed');
        return { status: 'error', message: 'RabbitMQ connection error' };
      }
    })();

    return Promise.race([checkPromise, timeoutPromise]);
  }

  private async getDatabaseStats(db: any) {
    try {
      const [dbStats, collections] = await Promise.all([
        db.command({ dbStats: 1 }),
        db.listCollections().toArray(),
      ]);
      return {
        collections: collections.length,
        indexes: dbStats.indexes || 0,
        objects: dbStats.objects || 0,
        dataSize: this.formatBytes(dbStats.dataSize || 0),
        storageSize: this.formatBytes(dbStats.storageSize || 0),
      };
    } catch {
      return null;
    }
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}
