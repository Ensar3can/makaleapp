import { Buffer } from 'node:buffer';
import { assertDiscoveryCursor, type PublicDiscoveryCursor } from '@aip/domain';
import { ValidationError } from './errors';

export function encodeDiscoveryCursor(cursor: PublicDiscoveryCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeDiscoveryCursor(value: string | null | undefined): PublicDiscoveryCursor | null {
  if (value === null || value === undefined || value.trim().length === 0) {
    return null;
  }

  try {
    const json = Buffer.from(value, 'base64url').toString('utf8');
    return assertDiscoveryCursor(JSON.parse(json) as unknown);
  } catch {
    throw new ValidationError('Discovery cursor is invalid');
  }
}
