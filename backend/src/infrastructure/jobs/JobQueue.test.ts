
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';
import { JobQueue } from './JobQueue';
import { JobName } from './job-definitions';
import { Queue } from 'bullmq';

// Mock BullMQ Queue
vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      close: vi.fn(),
    })),
    Worker: vi.fn(),
  };
});

describe('JobQueue', () => {
  let jobQueue: JobQueue;

  beforeEach(() => {
    vi.clearAllMocks();
    jobQueue = new JobQueue();
  });

  afterEach(async () => {
    await jobQueue.close();
  });

  it('should initialize queues for all JobNames', () => {
    // We expect the internal map to be populated
    // Since 'queues' is private, we can't check it directly without casting to any or testing behavior.
    // However, the constructor calls new Queue for each JobName.
    expect(Queue).toHaveBeenCalledTimes(Object.keys(JobName).length);
  });

  it('should add a job to the correct queue', async () => {
    const queueInstance = (Queue as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;

    await jobQueue.addJob(JobName.EMAIL_SEND, {
      to: 'test@example.com',
      subject: 'Test',
      body: 'Body',
    });

    expect(queueInstance.add).toHaveBeenCalledWith(
      JobName.EMAIL_SEND,
      {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Body'
      },
      undefined
    );
  });
});
