// YouTube Transcription Queue implementation using RabbitMQ (or mock)
import amqplib, { ConsumeMessage } from 'amqplib';
import { Service } from 'typedi';

import { logger } from '../utils/logger';

/**
 * Interface for a transcription job.
 */
export interface TranscriptionJob {
  videoUrl: string;
  recipientEmail: string;
  fileName: string;
  timestamp: string;
}

/**
 * Queue service responsible for publishing transcription jobs and starting a consumer.
 * In test environments the `amqplib` import is mocked (see src/__tests__/mocks/rabbitmq.ts).
 */
@Service()
export class YoutubeTranscriptionQueue {
  private connection!: any;
  private channel!: any;
  private readonly queueName = 'youtube-transcription';

  /** Connects to RabbitMQ (or mock) and asserts the queue. */
  private async ensureConnection(): Promise<void> {
    if (this.channel && this.connection) {
      return;
    }
    try {
      this.connection = (await amqplib.connect(
        process.env.RABBITMQ_URL || 'amqp://localhost',
      )) as any;
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });
      logger.info('YoutubeTranscriptionQueue connected and queue asserted');
    } catch (err) {
      logger.warn('Failed to connect to RabbitMQ (Docker down?). Transcription features disabled.');
      // throw err; // DISABLE THROW to allow server start
    }
  }

  /** Publishes a transcription job to the queue. */
  async publishTranscriptionJob(job: TranscriptionJob): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.channel) {
        logger.warn('Job skipped (RabbitMQ not available)');
        return false;
      }
      const payload = Buffer.from(JSON.stringify(job));
      const ok = this.channel.sendToQueue(this.queueName, payload, { persistent: true });
      logger.info(`Transcription job enqueued for ${job.fileName}`);
      return ok;
    } catch (e) {
      logger.error(e, 'Failed to publish transcription job');
      return false;
    }
  }

  /** Starts a consumer that processes jobs. */
  async startConsumer(handler: (job: TranscriptionJob) => Promise<void>): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) {
      logger.warn('Consumer did not start (RabbitMQ not available)');
      return;
    }
    await this.channel.consume(
      this.queueName,
      async (msg: ConsumeMessage | null) => {
        if (!msg) {
          return;
        }
        try {
          const job: TranscriptionJob = JSON.parse(msg.content.toString());
          await handler(job);
          this.channel.ack(msg);
        } catch (err) {
          logger.error(err, 'Error processing transcription job');
          this.channel.nack(msg, false, false); // discard bad message
        }
      },
      { noAck: false },
    );
    logger.info('YoutubeTranscriptionQueue consumer started');
  }
}

// Export a singleton instance for convenience (used by existing code)
export const youtubeTranscriptionQueue = new YoutubeTranscriptionQueue();
