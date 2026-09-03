import { AuthTokenPurpose } from './enums';
import { AuthTokenInvalidError, InvalidSessionError } from './errors';
import type { AuthTokenId, UserId } from './ids';

const TOKEN_HASH_PATTERN = /^[a-f0-9]{64}$/;

export interface AuthTokenProps {
  readonly id: AuthTokenId;
  readonly userId: UserId;
  readonly purpose: AuthTokenPurpose;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly consumedAt: Date | null;
  readonly createdAt: Date;
}

export class AuthToken {
  public readonly id: AuthTokenId;
  public readonly userId: UserId;
  public readonly purpose: AuthTokenPurpose;
  public readonly tokenHash: string;
  public readonly expiresAt: Date;
  public readonly consumedAt: Date | null;
  public readonly createdAt: Date;

  private constructor(props: AuthTokenProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.purpose = props.purpose;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.consumedAt = props.consumedAt;
    this.createdAt = props.createdAt;
  }

  public static issue(input: {
    id: AuthTokenId;
    userId: UserId;
    purpose: AuthTokenPurpose;
    tokenHash: string;
    now: Date;
    ttlSeconds: number;
  }): AuthToken {
    if (!TOKEN_HASH_PATTERN.test(input.tokenHash)) {
      throw new InvalidSessionError('Auth token hash must be a 64-character lowercase hex digest');
    }

    if (input.ttlSeconds <= 0) {
      throw new InvalidSessionError('Auth token TTL must be positive');
    }

    return new AuthToken({
      id: input.id,
      userId: input.userId,
      purpose: input.purpose,
      tokenHash: input.tokenHash,
      expiresAt: new Date(input.now.getTime() + input.ttlSeconds * 1000),
      consumedAt: null,
      createdAt: input.now,
    });
  }

  public static reconstitute(props: AuthTokenProps): AuthToken {
    return new AuthToken(props);
  }

  public isUsable(now: Date): boolean {
    return this.consumedAt === null && this.expiresAt.getTime() > now.getTime();
  }

  public consume(now: Date): AuthToken {
    if (!this.isUsable(now)) {
      throw new AuthTokenInvalidError();
    }

    return new AuthToken({
      id: this.id,
      userId: this.userId,
      purpose: this.purpose,
      tokenHash: this.tokenHash,
      expiresAt: this.expiresAt,
      consumedAt: now,
      createdAt: this.createdAt,
    });
  }
}
