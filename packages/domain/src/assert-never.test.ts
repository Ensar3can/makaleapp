import { describe, expect, it } from 'vitest';
import { assertNever } from './index';

describe('assertNever', () => {
  it('throws for a value that should be impossible', () => {
    expect(() => assertNever('draft' as never)).toThrow(/Unexpected value/);
  });
});
