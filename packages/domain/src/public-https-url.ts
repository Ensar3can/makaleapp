import { HttpUrlSafety } from './enums';
import { inspectHttpUrl } from './http-url-safety';
import { InvalidProfileError } from './errors';

export function assertPublicHttpsUrl(value: string | null | undefined, label: string): string | null {
  if (value === null || value === undefined || value.trim().length === 0) {
    return null;
  }

  const inspection = inspectHttpUrl(value);

  if (inspection.safety !== HttpUrlSafety.SAFE || !inspection.href) {
    throw new InvalidProfileError(`${label} must be a public https URL`);
  }

  let parsed: URL;

  try {
    parsed = new URL(inspection.href);
  } catch {
    throw new InvalidProfileError(`${label} must be a public https URL`);
  }

  if (parsed.protocol !== 'https:') {
    throw new InvalidProfileError(`${label} must be a public https URL`);
  }

  if (parsed.pathname === '/' && parsed.search.length === 0 && parsed.hash.length === 0) {
    return parsed.origin;
  }

  return parsed.href;
}

export function isSafePublicHref(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    return assertPublicHttpsUrl(value, 'URL') !== null;
  } catch {
    return false;
  }
}
