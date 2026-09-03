import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { connectionFromRedisUrl, isDuplicateJobError } from './redis-connection';
import { ANALYSIS_QUEUE_NAME, type EnqueueOptions, type IJobQueue, type IJobWorker, type JobHandler } from './types';

export class BullMQJobQueue implements IJobQueue {
  private readonly queue: Queue;

  public constructor(redisUrlOrConnection: string | ConnectionOptions) {
    const connection =
      typeof redisUrlOrConnection === 'string'
        ? connectionFromRedisUrl(redisUrlOrConnection)
        : redisUrlOrConnection;
    this.queue = new Queue(ANALYSIS_QUEUE_NAME, { connection });
  }

  public async enqueue<T>(name: string, payload: T, options?: EnqueueOptions): Promise<string> {
    const jobId = options?.jobId;
    const attempts = options?.attempts ?? 1;

    try {
      const job = await this.queue.add(name, payload, {
        jobId,
        delay: options?.delayMs,
        attempts,
        removeOnComplete: 1_000,
        removeOnFail: 1_000,
      });
      return job.id ?? jobId ?? name;
    } catch (error) {
      if (jobId && isDuplicateJobError(error)) {
        return jobId;
      }

      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.queue.close();
  }
}

export class BullMQJobWorker implements IJobWorker {
  private readonly handlers = new Map<string, JobHandler<unknown>>();
  private readonly connection: ConnectionOptions;
  private worker: Worker | undefined;

  public constructor(redisUrlOrConnection: string | ConnectionOptions) {
    this.connection =
      typeof redisUrlOrConnection === 'string'
        ? connectionFromRedisUrl(redisUrlOrConnection)
        : redisUrlOrConnection;
  }

  public register<T>(name: string, handler: JobHandler<T>): void {
    this.handlers.set(name, handler as JobHandler<unknown>);
  }

  public async start(): Promise<void> {
    if (this.worker) {
      return;
    }

    this.worker = new Worker(
      ANALYSIS_QUEUE_NAME,
      async (job) => {
        const handler = this.handlers.get(job.name);

        if (!handler) {
          throw new Error(`No handler registered for job "${job.name}"`);
        }

        await handler(job.data);
      },
      {
        connection: this.connection,
        concurrency: 1,
      },
    );
  }

  public async stop(): Promise<void> {
    if (!this.worker) {
      return;
    }

    await this.worker.close();
    this.worker = undefined;
  }
}
