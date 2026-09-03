import { createHash } from 'node:crypto';

export function hashClientIp(ip: string | null | undefined): string | null {
  const value = ip?.trim();

  if (!value) {
    return null;
  }

  return createHash('sha256').update(value).digest('hex');
}
