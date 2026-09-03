export function stableInt(seed: string, min: number, max: number): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const span = max - min + 1;
  return min + (hash >>> 0) % span;
}

export function stablePick<T>(seed: string, values: readonly T[]): T {
  const value = values[stableInt(seed, 0, values.length - 1)];

  if (value === undefined) {
    throw new Error('stablePick requires a non-empty list');
  }

  return value;
}
