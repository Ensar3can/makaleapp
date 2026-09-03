import { BullMQJobQueue, BullMQJobWorker } from './bullmq-job-queue';
import { InMemoryJobQueue } from './in-memory-job-queue';
import type { IJobWorker, JobTransport } from './types';

class IdleJobWorker implements IJobWorker {
  public register(): void {}
  public async start(): Promise<void> {}
  public async stop(): Promise<void> {}
}

export function createJobTransport(redisUrl: string): JobTransport {
  if (redisUrl.startsWith('memory:')) {
    const queue = new InMemoryJobQueue({ dispatch: 'deferred' });
    return {
      driver: 'memory',
      queue,
      worker: new IdleJobWorker(),
    };
  }

  return {
    driver: 'redis',
    queue: new BullMQJobQueue(redisUrl),
    worker: new BullMQJobWorker(redisUrl),
  };
}
