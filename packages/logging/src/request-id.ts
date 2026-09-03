const REQUEST_ID_HEADER = 'x-request-id';
const REQUEST_ID_MAX = 64;

export function readRequestId(headers: Headers | { get(name: string): string | null }): string | null {
  const value = headers.get(REQUEST_ID_HEADER)?.trim();

  if (!value || value.length > REQUEST_ID_MAX) {
    return null;
  }

  return value;
}

export function resolveRequestId(
  headers: Headers | { get(name: string): string | null },
  fallback: () => string = () => crypto.randomUUID(),
): string {
  return readRequestId(headers) ?? fallback();
}

export function requestIdHeaderName(): string {
  return REQUEST_ID_HEADER;
}
