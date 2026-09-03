import type { CacheStore } from '@aip/application';

interface Entry {
  value: string;
  expiresAt: number;
}

export class InMemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, Entry>();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  public async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (!Number.isInteger(ttlMs) || ttlMs < 1) {
      throw new Error('Cache TTL must be a positive integer');
    }

    this.entries.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlMs,
    });
  }

  public async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  public async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }
}
