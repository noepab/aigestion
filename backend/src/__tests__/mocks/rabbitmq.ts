import { jest } from '@jest/globals';

export const connectRabbitMQ = jest.fn().mockImplementation(() => Promise.resolve());
export const publishToQueue = jest.fn().mockImplementation(() => Promise.resolve(true));
export const consumeQueue = jest.fn().mockImplementation(() => Promise.resolve());
export const closeRabbitMQ = jest.fn().mockImplementation(() => Promise.resolve());
export const getRabbitMQChannel = jest.fn();

export default {
  connectRabbitMQ,
  publishToQueue,
  consumeQueue,
  closeRabbitMQ,
  getRabbitMQChannel,
};
