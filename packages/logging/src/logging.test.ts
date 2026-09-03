import { describe, expect, it, vi } from 'vitest';
import { createLogger } from './index';
import { InMemoryMetricsRecorder } from './metrics';
import { resolveRequestId } from './request-id';

describe('createLogger', () => {
  it('redacts secret-bearing fields', () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const logger = createLogger({ component: 'test' });

    logger.info('auth event', {
      password: 'secret',
      session_pepper: 'pepper',
      AI_API_KEY: 'sk-test',
      userId: 'user-1',
    });

    const payload = JSON.parse(String(write.mock.calls[0]?.[0]));
    expect(payload.password).toBe('[redacted]');
    expect(payload.session_pepper).toBe('[redacted]');
    expect(payload.AI_API_KEY).toBe('[redacted]');
    expect(payload.userId).toBe('user-1');
    write.mockRestore();
  });

  it('creates a child logger that keeps request correlation fields', () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const logger = createLogger({ component: 'http' }).child({ requestId: 'req-1', userId: 'user-1' });
    logger.info('request completed', { durationMs: 12, status: 200 });

    const payload = JSON.parse(String(write.mock.calls[0]?.[0]));
    expect(payload.requestId).toBe('req-1');
    expect(payload.userId).toBe('user-1');
    expect(payload.durationMs).toBe(12);
    write.mockRestore();
  });
});

describe('request id and metrics', () => {
  it('reuses an incoming request id and records counters', () => {
    const headers = new Headers({ 'x-request-id': 'incoming-1' });
    expect(resolveRequestId(headers, () => 'generated')).toBe('incoming-1');

    const metrics = new InMemoryMetricsRecorder();
    metrics.increment('api_errors', { status: '500' });
    metrics.observe('http.duration_ms', 40, { path: '/api/health' });
    const snapshot = metrics.snapshot();

    expect(snapshot.counters[0]?.value).toBe(1);
    expect(snapshot.observations[0]?.total).toBe(40);
  });
});
