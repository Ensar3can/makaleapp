import type { EnqueueOptions, IJobQueue, IJobWorker, JobHandler } from './types';

interface PendingJob {
  readonly jobId: string;
  readonly name: string;
  readonly payload: unknown;
  readonly availableAt: number;
}

export interface InMemoryJobQueueOptions {
  readonly dispatch?: 'inline' | 'deferred';
}

export class InMemoryJobQueue implements IJobQueue, IJobWorker {
  private readonly handlers = new Map<string, JobHandler<unknown>>();
  private readonly pending: PendingJob[] = [];
  private readonly knownIds = new Set<string>();
  private readonly dispatch: 'inline' | 'deferred';
  private sequence = 0;

  public constructor(options: InMemoryJobQueueOptions = {}) {
    this.dispatch = options.dispatch ?? 'inline';
  }

  public register<T>(name: string, handler: JobHandler<T>): void {
    this.handlers.set(name, handler as JobHandler<unknown>);
  }

  public async enqueue<T>(name: string, payload: T, options?: EnqueueOptions): Promise<string> {
    if (options?.jobId && this.knownIds.has(options.jobId)) {
      return options.jobId;
    }

    const jobId = options?.jobId ?? `job_${++this.sequence}`;
    this.knownIds.add(jobId);

    if (this.dispatch === 'deferred') {
      this.pending.push({
        jobId,
        name,
        payload,
        availableAt: Date.now() + (options?.delayMs ?? 0),
      });
      return jobId;
    }

    const handler = this.handlers.get(name);

    if (!handler) {
      throw new Error(`No handler registered for job "${name}"`);
    }

    await handler(payload);
    return jobId;
  }

  public async drain(now = Date.now()): Promise<number> {
    let processed = 0;
    const ready = this.pending.filter((job) => job.availableAt <= now);
    this.pending.splice(0, this.pending.length, ...this.pending.filter((job) => job.availableAt > now));

    for (const job of ready) {
      const handler = this.handlers.get(job.name);

      if (!handler) {
        throw new Error(`No handler registered for job "${job.name}"`);
      }

      await handler(job.payload);
      processed += 1;
    }

    return processed;
  }

  public async start(): Promise<void> {}

  public async stop(): Promise<void> {
    this.pending.length = 0;
  }

  public async close(): Promise<void> {
    await this.stop();
  }
}
