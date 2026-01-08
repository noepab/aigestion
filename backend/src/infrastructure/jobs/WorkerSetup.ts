import { Worker, Job } from 'bullmq';
import { JobName } from './job-definitions';
import { logger } from '../../utils/logger';

export class WorkerSetup {
  private static workers: Worker[] = [];

  public static startWorkers() {
    const redisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };

    // Example worker for EMAIL_SEND
    const emailWorker = new Worker(
      JobName.EMAIL_SEND,
      async (job: Job) => {
        logger.info(`Processing email job: ${job.id}`);
        // Logic to send email would go here
        // const { to, subject, body } = job.data;
        // await emailService.send(to, subject, body);
        logger.info(`Email job completed: ${job.id}`);
      },
      { connection: redisOptions },
    );

    emailWorker.on('failed', (job, err) => {
      logger.error({ err, jobId: job?.id }, 'Job failed');
    });

    this.workers.push(emailWorker);
    logger.info('Workers initialized');
  }

  public static async close() {
    for (const worker of this.workers) {
      await worker.close();
    }
  }
}
