export function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function optionalNumber(value: string | string[] | undefined): number | undefined {
  const raw = firstQueryValue(value);

  if (raw === undefined || raw.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function discoveryQueryFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return {
    query: firstQueryValue(searchParams.q),
    categorySlug: firstQueryValue(searchParams.category),
    tagSlug: firstQueryValue(searchParams.tag),
    authorUsername: firstQueryValue(searchParams.author),
    language: firstQueryValue(searchParams.language),
    minOverallScore: optionalNumber(searchParams.minScore),
    maxOverallScore: optionalNumber(searchParams.maxScore),
    sort: firstQueryValue(searchParams.sort),
    cursor: firstQueryValue(searchParams.cursor),
    limit: optionalNumber(searchParams.limit),
  };
}

export function nextPageHref(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
  cursor: string | null,
): string | null {
  if (!cursor) {
    return null;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const first = firstQueryValue(value);
    if (first && key !== 'cursor') {
      params.set(key, first);
    }
  }

  params.set('cursor', cursor);
  return `${pathname}?${params.toString()}`;
}
