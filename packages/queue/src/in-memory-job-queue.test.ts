import { describe, expect, it, vi } from 'vitest';
import { InMemoryJobQueue } from './in-memory-job-queue';

describe('InMemoryJobQueue', () => {
  it('dispatches a registered job inline', async () => {
    const queue = new InMemoryJobQueue();
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.register('analyze-article', handler);

    const jobId = await queue.enqueue('analyze-article', { articleId: 'a1' });

    expect(jobId).toMatch(/^job_/);
    expect(handler).toHaveBeenCalledWith({ articleId: 'a1' });
  });

  it('rejects unknown job names in inline mode', async () => {
    const queue = new InMemoryJobQueue();
    await expect(queue.enqueue('missing', {})).rejects.toThrow(/No handler registered/);
  });

  it('defers work until drain and ignores duplicate job ids', async () => {
    const queue = new InMemoryJobQueue({ dispatch: 'deferred' });
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.register('analyze-article', handler);

    const first = await queue.enqueue('analyze-article', { analysisJobId: 'job-1' }, { jobId: 'job-1' });
    const second = await queue.enqueue(
      'analyze-article',
      { analysisJobId: 'job-1' },
      { jobId: 'job-1' },
    );
    expect(first).toBe('job-1');
    expect(second).toBe('job-1');
    expect(handler).not.toHaveBeenCalled();

    expect(await queue.drain()).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(await queue.drain()).toBe(0);
  });

  it('holds delayed jobs until they are due', async () => {
    const queue = new InMemoryJobQueue({ dispatch: 'deferred' });
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.register('analyze-article', handler);

    await queue.enqueue('analyze-article', { analysisJobId: 'job-2' }, { delayMs: 2_000 });

    expect(await queue.drain(Date.now())).toBe(0);
    expect(handler).not.toHaveBeenCalled();
    expect(await queue.drain(Date.now() + 2_000)).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
