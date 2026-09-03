export const DEFAULT_POST_LOGIN_PATH = '/dashboard';
export const REQUEST_PATH_HEADER = 'x-aip-request-path';

const AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

const BLOCKED_PREFIXES = ['/api', '/_next'];

export function safeInternalPath(
  value: string | null | undefined,
  fallback = DEFAULT_POST_LOGIN_PATH,
): string {
  if (!value) {
    return fallback;
  }

  const path = value.trim();

  if (path.length === 0 || path.length > 512) {
    return fallback;
  }

  if (
    path.includes('\\') ||
    path.includes('\0') ||
    path.includes('\n') ||
    path.includes('\r') ||
    path.includes('://')
  ) {
    return fallback;
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    return fallback;
  }

  const pathname = path.split('?')[0]?.split('#')[0] ?? path;

  if (AUTH_PATHS.has(pathname)) {
    return fallback;
  }

  if (BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return fallback;
  }

  return path;
}

export function loginHref(nextPath?: string | null): string {
  return withNextQuery('/login', nextPath);
}

export function registerHref(nextPath?: string | null): string {
  return withNextQuery('/register', nextPath);
}

function withNextQuery(pathname: string, nextPath?: string | null): string {
  const next = nextPath ? safeInternalPath(nextPath, '') : '';

  if (!next || next === DEFAULT_POST_LOGIN_PATH) {
    return pathname;
  }

  return `${pathname}?next=${encodeURIComponent(next)}`;
}
