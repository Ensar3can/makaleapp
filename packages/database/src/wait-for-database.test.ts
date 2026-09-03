import { describe, expect, it, vi } from 'vitest';
import { waitForDatabase } from './wait-for-database';

vi.mock('./prisma-client', () => ({
  createPrismaClient: vi.fn(),
}));

vi.mock('./database-probe', () => ({
  probeDatabase: vi.fn(),
}));

describe('waitForDatabase', () => {
  it('retries until the probe succeeds', async () => {
    const { createPrismaClient } = await import('./prisma-client');
    const { probeDatabase } = await import('./database-probe');
    const disconnect = vi.fn();
    vi.mocked(createPrismaClient).mockReturnValue({ $disconnect: disconnect } as never);
    vi.mocked(probeDatabase)
      .mockRejectedValueOnce(new Error('not ready'))
      .mockResolvedValueOnce({ ok: true });

    await waitForDatabase('sqlserver://localhost:1433;database=aip', {
      attempts: 3,
      delayMs: 1,
      sleep: async () => undefined,
    });

    expect(probeDatabase).toHaveBeenCalledTimes(2);
    expect(disconnect).toHaveBeenCalledTimes(2);
  });

  it('fails after the last attempt', async () => {
    const { createPrismaClient } = await import('./prisma-client');
    const { probeDatabase } = await import('./database-probe');
    vi.mocked(createPrismaClient).mockReturnValue({ $disconnect: vi.fn() } as never);
    vi.mocked(probeDatabase).mockRejectedValue(new Error('still down'));

    await expect(
      waitForDatabase('sqlserver://localhost:1433;database=aip', {
        attempts: 2,
        delayMs: 1,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/still down/);
  });
});
