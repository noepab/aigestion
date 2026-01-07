import mongoose, { ConnectOptions } from 'mongoose';

import { logger } from '../utils/logger';
import { config } from './config';

const { mongo } = config;

const connectOptions: ConnectOptions = {
  // Add any MongoDB connection options here
  // For example:
  // connectTimeoutMS: 10000, // 10 seconds
  // socketTimeoutMS: 45000, // 45 seconds
  // family: 4, // Use IPv4, skip trying IPv6
};

let isConnected = false;

export const connectToDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  try {
    logger.info('Connecting to MongoDB...');

    await mongoose.connect(mongo.uri, connectOptions);

    isConnected = true;
    logger.info('Successfully connected to MongoDB');

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(err, 'MongoDB connection error:');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    const err = error as Error;
    logger.error(err, 'MongoDB connection error:');

    // WARNING: Continuing without DB for development resilience
    // process.exit(1);
  }
};
