import { afterEach, describe, expect, it } from 'vitest';
import {
  TOAST_FLASH_KEY,
  configureToastStorage,
  dismissToast,
  flashToast,
  getToasts,
  hydrateToastFlash,
  resetToastStore,
  showToast,
  type ToastStorage,
} from '../apps/web/lib/toast-store';

function createMemoryStorage(initial?: Record<string, string>): ToastStorage & { store: Record<string, string> } {
  const store = { ...(initial ?? {}) };

  return {
    store,
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
  };
}

describe('toast store', () => {
  afterEach(() => {
    resetToastStore();
    configureToastStorage(null);
  });

  it('queues and dismisses toasts without mutating previous snapshots', () => {
    const first = showToast({ tone: 'success', message: 'Draft saved.' });
    const snapshot = getToasts();
    showToast({ tone: 'error', message: 'Unable to publish.' });

    expect(snapshot).toHaveLength(1);
    expect(getToasts()).toHaveLength(2);

    dismissToast(first);

    expect(getToasts().map((toast) => toast.message)).toEqual(['Unable to publish.']);
  });

  it('persists a flash toast and hydrates it once after navigation', () => {
    const storage = createMemoryStorage();
    configureToastStorage(storage);

    flashToast({ tone: 'success', message: 'Signed in.' });

    expect(getToasts()).toHaveLength(0);
    expect(storage.store[TOAST_FLASH_KEY]).toContain('Signed in.');

    hydrateToastFlash();

    expect(getToasts()).toEqual([
      expect.objectContaining({ tone: 'success', message: 'Signed in.' }),
    ]);
    expect(storage.store[TOAST_FLASH_KEY]).toBeUndefined();

    hydrateToastFlash();
    expect(getToasts()).toHaveLength(1);
  });

  it('ignores invalid flash payloads', () => {
    const storage = createMemoryStorage({ [TOAST_FLASH_KEY]: '{not-json' });
    configureToastStorage(storage);

    hydrateToastFlash();

    expect(getToasts()).toHaveLength(0);
    expect(storage.store[TOAST_FLASH_KEY]).toBeUndefined();
  });

  it('shows immediately when flash storage is unavailable', () => {
    flashToast({ tone: 'info', message: 'Signed out.' });

    expect(getToasts()).toEqual([expect.objectContaining({ tone: 'info', message: 'Signed out.' })]);
  });
});
