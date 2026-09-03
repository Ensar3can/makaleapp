import { InvalidScoreError } from './errors';

const MIN = 0;
const MAX = 100;
const DECIMAL_PLACES = 2;

function roundScore(value: number): number {
  const factor = 10 ** DECIMAL_PLACES;
  return Math.round(value * factor) / factor;
}

export class Score {
  public static readonly MIN = MIN;
  public static readonly MAX = MAX;

  private constructor(public readonly value: number) {}

  public static zero(): Score {
    return new Score(MIN);
  }

  public static full(): Score {
    return new Score(MAX);
  }

  public static from(value: number): Score {
    if (!Number.isFinite(value) || value < MIN || value > MAX) {
      throw new InvalidScoreError(value);
    }

    return new Score(roundScore(value));
  }

  public invert(): Score {
    return Score.from(MAX - this.value);
  }

  public equals(other: Score): boolean {
    return this.value === other.value;
  }

  public isAtLeast(other: Score): boolean {
    return this.value >= other.value;
  }
}
