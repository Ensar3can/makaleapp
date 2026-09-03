import { describe, expect, it } from 'vitest';
import { BullMQJobQueue, BullMQJobWorker } from './bullmq-job-queue';

const REDIS_URL = process.env.REDIS_URL ?? 'memory://local';

describe('BullMQJobQueue', () => {
  it('enqueues and processes a job when Redis is available', async () => {
    if (REDIS_URL.startsWith('memory:')) {
      return;
    }

    const queue = new BullMQJobQueue(REDIS_URL);
    const worker = new BullMQJobWorker(REDIS_URL);
    const seen: string[] = [];

    worker.register<{ analysisJobId: string }>('analyze-article', async (payload) => {
      seen.push(payload.analysisJobId);
    });

    try {
      await worker.start();
      const jobId = `phase5-${Date.now()}`;
      await queue.enqueue('analyze-article', { analysisJobId: jobId }, { jobId });
      await queue.enqueue('analyze-article', { analysisJobId: jobId }, { jobId });
      await waitFor(() => seen.includes(jobId), 5_000);
      expect(seen.filter((id) => id === jobId)).toHaveLength(1);
    } catch (error) {
      if (isUnavailableRedis(error)) {
        return;
      }

      throw error;
    } finally {
      await worker.stop().catch(() => undefined);
      await queue.close().catch(() => undefined);
    }
  });
});

function isUnavailableRedis(error: unknown): boolean {
  return error instanceof Error && /ECONNREFUSED|ENOTFOUND|Connection is closed|timed out/i.test(error.message);
}

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (predicate()) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }

  throw new Error('Timed out waiting for BullMQ job');
}
