import type { Request, Response } from 'express-serve-static-core';
import mongoose from 'mongoose';
import os from 'os';

import { getRedisClient } from '../cache/redis';
import { getRabbitMQChannel } from '../queue/rabbitmq';
import { logger } from '../utils/logger';

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  system: {
    platform: string;
    arch: string;
    cpus: number;
    totalMemory: string;
    freeMemory: string;
    loadAvg: number[];
  };
  database: {
    status: string;
    readyState: number;
    dbState: string;
    message?: string;
    collections?: number;
    models?: number;
    host?: string;
    name?: string;
    version?: string;
    stats?: {
      collections: number;
      indexes: number;
      objects: number;
      dataSize: string;
      storageSize: string;
    };
  };
  redis?: {
    status: string;
    version?: string;
    usedMemory?: string;
    connectedClients?: number;
    blockedClients?: number;
    message?: string;
  };
  rabbitmq?: {
    status: string;
    version?: string;
    queues?: number;
    connections?: number;
    channels?: number;
    consumers?: number;
    message?: string;
  };
  memoryUsage: NodeJS.MemoryUsage;
  nodeVersion: string;
  dependencies: {
    mongoose: string;
    node_mongodb_native: string;
    redis?: string;
    amqplib?: string;
  };
  metrics: {
    eventLoopLag: number;
    heapUsed: string;
    heapTotal: string;
    external: string;
    arrayBuffers: string;
    rss: string;
  };
}

const getReadyStateName = (readyState: number): string => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    4: 'uninitialized',
  };
  return states[readyState as keyof typeof states] || 'unknown';
};

export const checkRedisHealth = async () => {
  const redisClient = getRedisClient();
  if (!redisClient) {
    return {
      status: 'disabled',
      message: 'Redis client not initialized',
    };
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
      blockedClients: parseInt(redisInfo.blocked_clients || '0', 10),
      message: 'Redis is healthy',
    };
  } catch (error) {
    logger.error(error, 'Redis health check failed:');
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Redis connection error',
    };
  }
};

const checkRabbitMQHealth = async () => {
  // Add timeout to prevent blocking indefinitely
  const timeoutPromise = new Promise<{ status: string; message: string }>(resolve => {
    setTimeout(() => {
      resolve({
        status: 'disabled',
        message: 'RabbitMQ health check timed out (not connected)',
      });
    }, 2000); // 2 second timeout
  });

  const healthCheckPromise = (async () => {
    try {
      const channel = await getRabbitMQChannel();
      if (!channel) {
        return {
          status: 'disabled',
          message: 'RabbitMQ channel not available',
        };
      }

      const connection = channel.connection;
      const serverProperties = (connection as any)?.serverProperties || {};

      // Check if we can declare a test queue (validates channel functionality)
      const testQueue = `health-check-${Date.now()}`;
      await channel.assertQueue(testQueue, { durable: false, autoDelete: true });
      await channel.deleteQueue(testQueue);

      return {
        status: 'ok',
        version: serverProperties.version || 'unknown',
        message: 'RabbitMQ is healthy',
        connections: 1,
        channels: 1,
      };
    } catch (error) {
      logger.error(error, 'RabbitMQ health check failed:');
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'RabbitMQ connection error',
      };
    }
  })();

  return Promise.race([healthCheckPromise, timeoutPromise]);
};

const getDatabaseStats = async (db: any) => {
  try {
    const [dbStats, collections] = await Promise.all([
      db.command({ dbStats: 1 }),
      db.listCollections().toArray(),
    ]);

    return {
      collections: collections.length,
      indexes: dbStats.indexes || 0,
      objects: dbStats.objects || 0,
      dataSize: formatBytes(dbStats.dataSize || 0),
      storageSize: formatBytes(dbStats.storageSize || 0),
    };
  } catch (error) {
    logger.error(error, 'Failed to get database stats:');
    return null;
  }
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();

  // Default response with basic system info
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem()),
      loadAvg: os.loadavg(),
    },
    database: {
      status: 'unknown',
      readyState: 0,
      dbState: 'unknown',
      message: 'Checking database status...',
    },
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    dependencies: {
      redis: require('redis/package.json').version,
      mongoose: require('mongoose/package.json').version,
      node_mongodb_native: (mongoose.mongo as any).version || 'unknown',
    },
    metrics: {
      eventLoopLag: 0,
      heapUsed: '0',
      heapTotal: '0',
      external: '0',
      arrayBuffers: '0',
      rss: '0',
    },
  };

  try {
    // Get MongoDB connection info if available
    const connection = mongoose.connection;
    const db = connection.db;

    if (connection) {
      const readyState = connection.readyState;
      const dbState = getReadyStateName(readyState);
      const isConnected = readyState === 1;

      response.database = {
        status: isConnected ? 'connected' : 'disconnected',
        readyState: readyState,
        dbState: dbState,
        host: connection.host || 'unknown',
        name: connection.name || 'unknown',
        version: (connection as any)?.version || 'unknown',
        collections: db ? (await db.collections()).length : 0,
        models: Object.keys(mongoose.models).length,
      };

      // Additional check for MongoDB server status
      if (isConnected && db) {
        try {
          await db.command({ ping: 1 });
          response.database.message = 'MongoDB connection is healthy';

          // Get detailed database stats
          try {
            const stats = await getDatabaseStats(db);
            if (stats) {
              response.database.stats = stats;
            }
          } catch (statsError) {
            logger.warn(statsError, 'Could not get detailed database stats:');
          }
        } catch (error) {
          response.status = 'error';
          response.database.status = 'error';
          response.database.message = 'MongoDB connection is unstable';
          logger.error(error, 'MongoDB ping failed:');
        }
      } else {
        // Treat disconnected DB as an error for test expectations
        response.status = 'error';
        response.database.status = 'disconnected';
        response.database.readyState = readyState;
        response.database.message = `MongoDB is ${dbState}`;
      }
    }

    // Check Redis health
    try {
      const redisHealth = await checkRedisHealth();
      response.redis = redisHealth;

      if (redisHealth.status === 'error' && response.status !== 'error') {
        response.status = 'degraded';
      }
    } catch (error) {
      logger.error(error, 'Redis health check error:');
      response.redis = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
      if (response.status !== 'error') {
        response.status = 'degraded';
      }
    }

    // Check RabbitMQ health
    try {
      const rabbitMQHealth = await checkRabbitMQHealth();
      response.rabbitmq = rabbitMQHealth;

      if (rabbitMQHealth.status === 'error' && response.status !== 'error') {
        response.status = 'degraded';
      }
    } catch (error) {
      logger.error(error, 'RabbitMQ health check error:');
      response.rabbitmq = {
        status: 'error',
        message: error instanceof Error ? error.message : 'RabbitMQ check failed',
      };
      if (response.status !== 'error') {
        response.status = 'degraded';
      }
    }

    // Add version info for dependencies
    try {
      const [redisPkg, amqpPkg] = await Promise.all([
        require('redis/package.json').version,
        require('amqplib/package.json').version,
      ]);

      response.dependencies = {
        ...response.dependencies,
        redis: redisPkg,
        amqplib: amqpPkg,
      };
    } catch (error) {
      logger.warn(error, 'Could not load all dependency versions:');
    }

    // Calculate request processing time (event loop lag)
    const diff = process.hrtime(startTime);
    response.metrics.eventLoopLag = diff[0] * 1000 + diff[1] / 1000000;

    // Add memory metrics
    const mem = process.memoryUsage();
    response.metrics = {
      ...response.metrics,
      heapUsed: formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
      external: formatBytes(mem.external || 0),
      arrayBuffers: formatBytes(mem.arrayBuffers || 0),
      rss: formatBytes(mem.rss),
    };
  } catch (error) {
    response.status = 'error';
    response.database = response.database || {
      status: 'error',
      readyState: 0,
      dbState: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error during health check',
    };
    logger.error(error, 'Health check failed:');
  }

  // Log the health check with more detailed information
  const logData: Record<string, any> = {
    environment: response.environment,
    status: response.status,
    uptime: response.uptime,
    memoryUsage: response.memoryUsage,
    system: {
      load: response.system.loadAvg[0].toFixed(2),
      freeMemory: response.system.freeMemory,
    },
    database: {
      status: response.database.status,
      state: response.database.dbState,
      collections: response.database.collections,
      models: response.database.models,
    },
    redis: response.redis?.status,
    rabbitmq: response.rabbitmq?.status,
    metrics: {
      eventLoopLag: response.metrics.eventLoopLag.toFixed(2) + 'ms',
      heapUsed: response.metrics.heapUsed,
      rss: response.metrics.rss,
    },
  };

  if (response.status === 'error') {
    logger.error(logData, 'Health check completed with errors');
  } else if (response.status === 'degraded') {
    logger.warn(logData, 'Health check completed with warnings');
  } else {
    logger.info(logData, 'Health check completed successfully');
  }

  // Set appropriate status code
  let statusCode = 200;
  if (response.status === 'error') {
    statusCode = 503; // Service Unavailable
  } else if (response.status === 'degraded') {
    statusCode = 206; // Partial Content
  }

  // Add cache control headers
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  (res as any).status(statusCode).json(response);
  return;
};
