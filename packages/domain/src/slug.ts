import { InvalidSlugError } from './errors';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_LENGTH = 1;
const MAX_LENGTH = 160;

export class Slug {
  private constructor(public readonly value: string) {}

  public static from(value: string): Slug {
    const normalized = value.trim();

    if (normalized.length < MIN_LENGTH || normalized.length > MAX_LENGTH) {
      throw new InvalidSlugError(`Slug must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`);
    }

    if (!SLUG_PATTERN.test(normalized)) {
      throw new InvalidSlugError('Slug must be lowercase alphanumeric words separated by hyphens');
    }

    return new Slug(normalized);
  }

  public equals(other: Slug): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
