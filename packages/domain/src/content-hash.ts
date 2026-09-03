import { InvalidContentHashError } from './errors';

const SHA256_HEX = /^[a-f0-9]{64}$/;

export class ContentHash {
  private constructor(public readonly value: string) {}

  public static from(value: string): ContentHash {
    if (!SHA256_HEX.test(value)) {
      throw new InvalidContentHashError();
    }

    return new ContentHash(value);
  }

  public equals(other: ContentHash): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
