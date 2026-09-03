export function assertSafeStorageKey(key: string): string {
  if (key.length === 0 || key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    throw new Error('Invalid storage key');
  }

  return key;
}
