export interface EnqueueOptions {
  jobId?: string;
  delayMs?: number;
  attempts?: number;
}

export type JobHandler<T> = (payload: T) => Promise<void>;

export interface IJobQueue {
  enqueue<T>(name: string, payload: T, options?: EnqueueOptions): Promise<string>;
  close(): Promise<void>;
}

export interface IJobWorker {
  register<T>(name: string, handler: JobHandler<T>): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface JobTransport {
  readonly driver: 'memory' | 'redis';
  readonly queue: IJobQueue;
  readonly worker: IJobWorker;
}

export const ANALYSIS_QUEUE_NAME = 'aip-analysis';
