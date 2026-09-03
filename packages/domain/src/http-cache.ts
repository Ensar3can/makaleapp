export const PUBLIC_HTTP_CACHE_CONTROL = 'public, s-maxage=30, stale-while-revalidate=120';

const PUBLIC_EXACT_PATHS = new Set(['/', '/articles', '/search']);

export function isPublicCacheablePath(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (PUBLIC_EXACT_PATHS.has(normalized)) {
    return true;
  }

  return (
    normalized.startsWith('/articles/') ||
    normalized.startsWith('/categories/') ||
    normalized.startsWith('/profile/')
  );
}

export function cacheControlForRequest(input: {
  readonly method: string;
  readonly pathname: string;
}): string | null {
  if (input.method !== 'GET' && input.method !== 'HEAD') {
    return null;
  }

  return isPublicCacheablePath(input.pathname) ? PUBLIC_HTTP_CACHE_CONTROL : null;
}
