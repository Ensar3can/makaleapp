'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SEARCH_DEBOUNCE_MS, debounce } from '../lib/debounce';
import { isLiveSearchPath, withSearchQuery } from '../lib/live-search';
import { Button } from './ui/button';

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [value, setValue] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof debounce<[string]>> | null>(null);

  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const run = debounce((query: string) => {
      if (!isLiveSearchPath(pathname)) {
        return;
      }

      const href = withSearchQuery(pathname, searchParams.toString(), query);
      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      if (href === current) {
        return;
      }

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    debounceRef.current = run;
    return () => {
      run.cancel();
      if (debounceRef.current === run) {
        debounceRef.current = null;
      }
    };
  }, [pathname, router, searchParams, startTransition]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    debounceRef.current?.cancel();
    startTransition(() => {
      router.push(withSearchQuery('/search', '', value));
    });
  };

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="flex min-w-0 gap-2"
      onSubmit={onSubmit}
      aria-busy={isPending || undefined}
    >
      <label className="sr-only" htmlFor="public-search">
        Search published articles
      </label>
      <input
        id="public-search"
        type="search"
        name="q"
        value={value}
        placeholder="Search articles, authors, or topics"
        className="field-input"
        enterKeyHint="search"
        autoComplete="off"
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          debounceRef.current?.(next);
        }}
      />
      <Button type="submit" variant="secondary" className="shrink-0 px-4 py-2.5">
        Search
      </Button>
    </form>
  );
}

export function HeaderSearchFallback() {
  return (
    <form action="/search" method="get" role="search" className="flex min-w-0 gap-2">
      <label className="sr-only" htmlFor="public-search">
        Search published articles
      </label>
      <input
        id="public-search"
        type="search"
        name="q"
        placeholder="Search articles, authors, or topics"
        className="field-input"
        enterKeyHint="search"
        autoComplete="off"
      />
      <Button type="submit" variant="secondary" className="shrink-0 px-4 py-2.5">
        Search
      </Button>
    </form>
  );
}
