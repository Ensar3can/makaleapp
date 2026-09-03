const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface RequestOriginCheck {
  readonly allowed: boolean;
  readonly reason: string;
}

export function checkMutatingRequestOrigin(input: {
  readonly method: string;
  readonly originHeader: string | null;
  readonly refererHeader: string | null;
  readonly allowedOrigins: readonly string[];
}): RequestOriginCheck {
  if (SAFE_METHODS.has(input.method.toUpperCase())) {
    return { allowed: true, reason: 'safe-method' };
  }

  const requestOrigin = originFromHeaders(input.originHeader, input.refererHeader);

  if (!requestOrigin) {
    return { allowed: false, reason: 'missing-origin' };
  }

  const normalized = normalizeOrigin(requestOrigin);

  if (!normalized) {
    return { allowed: false, reason: 'invalid-origin' };
  }

  const allowed = input.allowedOrigins.some((candidate) => normalizeOrigin(candidate) === normalized);
  return allowed
    ? { allowed: true, reason: 'origin-allowed' }
    : { allowed: false, reason: 'origin-mismatch' };
}

export function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function originFromHeaders(originHeader: string | null, refererHeader: string | null): string | null {
  const origin = originHeader?.trim();

  if (origin && origin.toLowerCase() !== 'null') {
    return origin;
  }

  const referer = refererHeader?.trim();

  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}
