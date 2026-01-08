import * as amqp from 'amqplib';

import { logger } from '../utils/logger';

interface ChannelPool {
  channel: amqp.Channel;
  lastUsed: number;
  inUse: boolean;
}

// Configuration
const RABBIT_MQ_URL = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30; // seconds
const CHANNEL_POOL_SIZE = 5; // Number of channels in the pool
const PREFETCH_COUNT = 10; // Number of unacknowledged messages per consumer

// Connection state
let connection: amqp.Connection | null = null;
const channelPool: ChannelPool[] = [];
let reconnectAttempts = 0;
let isShuttingDown = false;

// Connection options with heartbeat and timeout
const CONNECTION_OPTIONS: amqp.Options.Connect = {
  heartbeat: HEARTBEAT_INTERVAL,
};

/**
 * Establishes a connection to RabbitMQ
 */
const createConnection = async (): Promise<any> => {
  try {
    const conn = await amqp.connect(RABBIT_MQ_URL, CONNECTION_OPTIONS);

    conn.on('error', (err: Error) => {
      if (err.message !== 'Connection closing') {
        logger.error(err, 'RabbitMQ connection error:');
      }
    });

    conn.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      if (!isShuttingDown) {
        handleReconnection();
      }
    });

    logger.info('Successfully connected to RabbitMQ');
    reconnectAttempts = 0; // Reset on successful connection
    return conn;
  } catch (error) {
    logger.error(error, 'Failed to connect to RabbitMQ:');
    throw error;
  }
};

/**
 * Handles reconnection logic with exponential backoff
 */
const handleReconnection = async (): Promise<void> => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please check your RabbitMQ server.');
    return;
  }

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;

  logger.warn(
    `Attempting to reconnect to RabbitMQ (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`,
  );

  setTimeout(async () => {
    try {
      connection = await createConnection();
      await initializeChannelPool();
    } catch (error) {
      logger.error(error, 'Reconnection attempt failed:');
      if (!isShuttingDown) {
        handleReconnection();
      }
    }
  }, delay);
};

/**
 * Creates and initializes a new channel with error handling
 */
const createChannel = async (): Promise<amqp.Channel> => {
  if (!connection) {
    throw new Error('No active RabbitMQ connection');
  }

  const channel = await (connection as any).createChannel();

  // Configure channel with prefetch count
  await channel.prefetch(PREFETCH_COUNT, false);

  channel.on('error', (err: Error) => {
    logger.error(err, 'RabbitMQ channel error:');
    // The channel will be automatically removed from the pool when closed
  });

  channel.on('close', () => {
    logger.warn('RabbitMQ channel closed');
  });

  return channel;
};

/**
 * Initializes the channel pool with the configured number of channels
 */
const initializeChannelPool = async (): Promise<void> => {
  if (!connection) {
    throw new Error('No active RabbitMQ connection');
  }

  // Clear existing channels
  await Promise.all(
    channelPool.map(async poolItem => {
      try {
        await poolItem.channel.close();
      } catch (error) {
        logger.warn(error, 'Error closing channel during pool initialization:');
      }
    }),
  );

  channelPool.length = 0; // Clear the array

  // Create new channels
  for (let i = 0; i < CHANNEL_POOL_SIZE; i++) {
    try {
      const channel = await createChannel();
      channelPool.push({
        channel,
        lastUsed: Date.now(),
        inUse: false,
      });
    } catch (error) {
      logger.error(error, 'Failed to create channel for pool:');
    }
  }
};

/**
 * Gets an available channel from the pool
 */
export const getRabbitMQChannel = async (): Promise<amqp.Channel | null> => {
  // If no connection and not initializing, return null immediately (don't block)
  if (!connection) {
    logger.warn('RabbitMQ not connected, returning null');
    return null;
  }

  if (!channelPool.length) {
    try {
      await initializeChannelPool();
    } catch (error) {
      logger.error(error, 'Failed to initialize channel pool');
      return null;
    }
  }

  // Try to find an available channel
  const poolItem = channelPool.find(item => !item.inUse);

  if (poolItem) {
    poolItem.inUse = true;
    poolItem.lastUsed = Date.now();
    return poolItem.channel;
  }

  // If no channels available, return null instead of blocking
  logger.warn('No RabbitMQ channels available in pool');
  return null;
};

/**
 * Releases a channel back to the pool
 */
export const releaseChannel = (channel: amqp.Channel): void => {
  const poolItem = channelPool.find(item => item.channel === channel);
  if (poolItem) {
    poolItem.inUse = false;
    poolItem.lastUsed = Date.now();
  }
};

/**
 * Safely closes the RabbitMQ connection and cleans up resources
 */
export const closeRabbitMQ = async (): Promise<void> => {
  isShuttingDown = true;

  // Close all channels
  await Promise.all(
    channelPool.map(async poolItem => {
      try {
        await poolItem.channel.close();
      } catch (error) {
        logger.warn(error, 'Error closing channel during shutdown:');
      }
    }),
  );

  channelPool.length = 0;

  // Close connection
  if (connection) {
    try {
      await (connection as any).close();
    } catch (error) {
      logger.error(error, 'Error closing RabbitMQ connection:');
    } finally {
      connection = null;
    }
  }
};

// Handle process termination
const handleShutdown = async (): Promise<void> => {
  logger.info('Shutting down RabbitMQ connection...');
  await closeRabbitMQ();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Initialize connection and channel pool on module load
(async () => {
  // Docker might be down, don't crash the app
  try {
    connection = await createConnection();
    await initializeChannelPool();
  } catch (error) {
    logger.warn('Failed to initialize RabbitMQ (Docker might be down). Running in fallback mode.');
    // Do NOT call handleReconnection() loop to avoid log spam if docker is dead
    connection = null;
  }
})();
