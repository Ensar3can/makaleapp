import { describe, expect, it } from 'vitest';
import { InvalidScoreError } from './errors';
import { Score } from './score';

describe('Score', () => {
  it('accepts the inclusive bounds 0 and 100', () => {
    expect(Score.from(0).value).toBe(0);
    expect(Score.from(100).value).toBe(100);
    expect(Score.zero().value).toBe(0);
    expect(Score.full().value).toBe(100);
  });

  it('rounds to two decimal places', () => {
    expect(Score.from(33.333).value).toBe(33.33);
    expect(Score.from(33.336).value).toBe(33.34);
  });

  it('rejects values outside 0–100 and non-finite numbers', () => {
    expect(() => Score.from(-0.01)).toThrow(InvalidScoreError);
    expect(() => Score.from(100.01)).toThrow(InvalidScoreError);
    expect(() => Score.from(Number.NaN)).toThrow(InvalidScoreError);
    expect(() => Score.from(Number.POSITIVE_INFINITY)).toThrow(InvalidScoreError);
  });

  it('inverts risk into authorship integrity', () => {
    expect(Score.from(25).invert().value).toBe(75);
    expect(Score.full().invert().value).toBe(0);
  });
});
