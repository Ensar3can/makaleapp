import { describe, expect, it } from 'vitest';
import { probeDatabase } from './database-probe';

describe('probeDatabase', () => {
  it('returns ok when the Prisma query succeeds', async () => {
    const prisma = {
      $queryRaw: async () => [{ '': 1 }],
    };

    await expect(probeDatabase(prisma as never)).resolves.toEqual({ ok: true });
  });

  it('throws when the Prisma query fails', async () => {
    const prisma = {
      $queryRaw: async () => {
        throw new Error('connection refused');
      },
    };

    await expect(probeDatabase(prisma as never)).rejects.toThrow('connection refused');
  });
});
