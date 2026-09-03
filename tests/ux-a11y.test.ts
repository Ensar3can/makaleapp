import { describe, expect, it, vi } from 'vitest';
import { debounce } from '../apps/web/lib/debounce';
import { MAIN_CONTENT_ID, wrappedTabTargetIndex } from '../apps/web/lib/focus';
import { isLiveSearchPath, withSearchQuery } from '../apps/web/lib/live-search';

describe('debounce', () => {
  it('runs once after the wait, and cancel prevents the call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const run = debounce(fn, 400);

    run('a');
    run('b');
    vi.advanceTimersByTime(399);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');

    run('c');
    run.cancel();
    vi.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe('live search URL', () => {
  it('treats catalog listing paths as live search, not article detail', () => {
    expect(isLiveSearchPath('/search')).toBe(true);
    expect(isLiveSearchPath('/articles')).toBe(true);
    expect(isLiveSearchPath('/categories/physics')).toBe(true);
    expect(isLiveSearchPath('/articles/my-slug')).toBe(false);
    expect(isLiveSearchPath('/categories')).toBe(false);
    expect(isLiveSearchPath('/')).toBe(false);
  });

  it('sets q, drops the listing cursor, and clears an empty query', () => {
    expect(withSearchQuery('/articles', 'cursor=abc&sort=published_at', '  climate ')).toBe(
      '/articles?sort=published_at&q=climate',
    );
    expect(withSearchQuery('/search', '?q=old', '   ')).toBe('/search');
  });
});

describe('keyboard focus cycle', () => {
  it('wraps tab and shift-tab at the edges', () => {
    expect(wrappedTabTargetIndex(3, 2, false)).toBe(0);
    expect(wrappedTabTargetIndex(3, 0, true)).toBe(2);
    expect(wrappedTabTargetIndex(3, 1, false)).toBe(2);
    expect(wrappedTabTargetIndex(0, 0, false)).toBe(-1);
  });
});

describe('skip target', () => {
  it('keeps a stable main content id for the skip link', () => {
    expect(MAIN_CONTENT_ID).toBe('main-content');
  });
});
