'use client';

import type { PublicCategory } from '@aip/application';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useTransition, type FormEvent } from 'react';
import { SEARCH_DEBOUNCE_MS, debounce } from '../lib/debounce';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { SelectField, TextField } from './ui/field';

export function DiscoveryFilters({
  action,
  categories,
  values,
  hideCategory = false,
  layout = 'panel',
}: {
  action: string;
  categories: readonly PublicCategory[];
  values: {
    q?: string;
    category?: string;
    minScore?: string;
    maxScore?: string;
    sort?: string;
  };
  hideCategory?: boolean;
  layout?: 'panel' | 'sidebar';
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof debounce<[HTMLFormElement]>> | null>(null);

  useEffect(() => {
    const run = debounce((form: HTMLFormElement) => {
      navigateForm(form, router, startTransition);
    }, SEARCH_DEBOUNCE_MS);
    debounceRef.current = run;
    return () => {
      run.cancel();
      if (debounceRef.current === run) {
        debounceRef.current = null;
      }
    };
  }, [router, startTransition]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    debounceRef.current?.cancel();
    navigateForm(event.currentTarget, router, startTransition);
  };

  const clearHref = action;
  const fields = (
    <>
      <TextField
        compact
        type="search"
        name="q"
        label="Search"
        defaultValue={values.q}
        placeholder="Title or abstract"
        className="text-base"
        enterKeyHint="search"
        autoComplete="off"
        onChange={(event) => {
          const form = event.currentTarget.form;
          if (form) {
            debounceRef.current?.(form);
          }
        }}
      />
      {hideCategory ? null : (
        <SelectField
          compact
          name="category"
          label="Category"
          defaultValue={values.category ?? ''}
          className="text-base"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </SelectField>
      )}
      <TextField
        compact
        type="number"
        name="minScore"
        label="Min score"
        min={0}
        max={100}
        defaultValue={values.minScore}
        className="text-base"
      />
      <TextField
        compact
        type="number"
        name="maxScore"
        label="Max score"
        min={0}
        max={100}
        defaultValue={values.maxScore}
        className="text-base"
      />
      <SelectField
        compact
        name="sort"
        label="Sort"
        defaultValue={values.sort ?? 'overall_score'}
        className="text-base"
      >
        <option value="overall_score">Top rated</option>
        <option value="published_at">Recently published</option>
      </SelectField>
    </>
  );

  const hasActiveFilters = Boolean(
    values.q || values.minScore || values.maxScore || (!hideCategory && values.category),
  );

  if (layout === 'sidebar') {
    return (
      <form
        action={action}
        method="get"
        onSubmit={onSubmit}
        aria-label="Catalog filters"
        aria-busy={isPending || undefined}
      >
        <details className="catalog-filters">
          <summary>{hasActiveFilters ? 'Filters (active)' : 'Filters'}</summary>
          <Card className="space-y-5 p-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Filters</h2>
              <Link href={clearHref} className="text-xs font-semibold text-accent hover:underline">
                Clear
              </Link>
            </div>
            {fields}
            <ActiveFilterChips action={action} values={values} hideCategory={hideCategory} />
            <Button type="submit" variant="primary" className="w-full">
              Apply filters
            </Button>
          </Card>
        </details>
      </form>
    );
  }

  return (
    <form
      action={action}
      method="get"
      onSubmit={onSubmit}
      aria-label="Catalog filters"
      aria-busy={isPending || undefined}
    >
      <Card
        className={`grid gap-4 p-5 sm:grid-cols-2 ${hideCategory ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}
      >
        {fields}
        <div
          className={
            hideCategory ? 'flex items-end sm:col-span-2 lg:col-span-4' : 'flex items-end sm:col-span-2 lg:col-span-5'
          }
        >
          <Button type="submit" variant="primary">
            Apply filters
          </Button>
        </div>
      </Card>
    </form>
  );
}

function navigateForm(
  form: HTMLFormElement,
  router: ReturnType<typeof useRouter>,
  startTransition: ReturnType<typeof useTransition>[1],
) {
  const data = new FormData(form);
  const params = new URLSearchParams();

  for (const [key, value] of data.entries()) {
    if (typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed.length > 0) {
      params.set(key, trimmed);
    }
  }

  params.delete('cursor');
  const action = form.getAttribute('action') || '/search';
  const href = params.toString().length > 0 ? `${action}?${params.toString()}` : action;
  startTransition(() => {
    router.replace(href, { scroll: false });
  });
}

function ActiveFilterChips({
  action,
  values,
  hideCategory,
}: {
  action: string;
  values: {
    q?: string;
    category?: string;
    minScore?: string;
    maxScore?: string;
  };
  hideCategory: boolean;
}) {
  const chips: string[] = [];
  if (values.q) {
    chips.push(`Search: ${values.q}`);
  }
  if (!hideCategory && values.category) {
    chips.push(`Category: ${values.category}`);
  }
  if (values.minScore) {
    chips.push(`Min score: ${values.minScore}`);
  }
  if (values.maxScore) {
    chips.push(`Max score: ${values.maxScore}`);
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span key={chip} className="chip">
          {chip}
        </span>
      ))}
      <Link href={action} className="text-[11px] font-semibold text-muted hover:text-ink">
        Reset
      </Link>
    </div>
  );
}
