import { injectable, inject } from 'inversify';
import { Queue, QueueOptions } from 'bullmq';
import { JobName, IJobPayloads } from './job-definitions';
import { logger } from '../../utils/logger';

@injectable()
export class JobQueue {
  private queues: Map<string, Queue> = new Map();
  private redisOptions: any;

  constructor() {
    this.redisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };
    this.initializeQueues();
  }

  private initializeQueues() {
    Object.values(JobName).forEach(name => {
      const queue = new Queue(name, {
        connection: this.redisOptions,
      });
      this.queues.set(name, queue);
    });
  }

  public async addJob<T extends JobName>(
    name: T,
    data: IJobPayloads[T],
    opts?: any,
  ): Promise<void> {
    const queue = this.queues.get(name as string);
    if (!queue) {
      logger.error(`Queue not found for job: ${name}`);
      throw new Error(`Queue not found for job: ${name}`);
    }
    await queue.add(name as string, data, opts);
  }

  public async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}
