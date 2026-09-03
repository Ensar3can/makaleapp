import { InvalidEmailError } from './errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 254;

export class EmailAddress {
  private constructor(public readonly value: string) {}

  public static from(value: string): EmailAddress {
    const normalized = value.trim().toLowerCase();

    if (normalized.length === 0 || normalized.length > MAX_LENGTH) {
      throw new InvalidEmailError(`Email must be between 1 and ${MAX_LENGTH} characters`);
    }

    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError('Email format is invalid');
    }

    return new EmailAddress(normalized);
  }

  public equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
