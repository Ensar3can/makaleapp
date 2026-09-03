export function isLiveSearchPath(pathname: string): boolean {
  return pathname === '/search' || pathname === '/articles' || /^\/categories\/[^/]+$/.test(pathname);
}

export function withSearchQuery(pathname: string, search: string, query: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete('cursor');

  const trimmed = query.trim();
  if (trimmed.length > 0) {
    params.set('q', trimmed);
  } else {
    params.delete('q');
  }

  const qs = params.toString();
  return qs.length > 0 ? `${pathname}?${qs}` : pathname;
}
