import { InvalidSessionError } from './errors';
import type { SessionId, UserId } from './ids';

const TOKEN_HASH_PATTERN = /^[a-f0-9]{64}$/;

export interface SessionProps {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly ipHash: string | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;
}

export class Session {
  public readonly id: SessionId;
  public readonly userId: UserId;
  public readonly tokenHash: string;
  public readonly expiresAt: Date;
  public readonly revokedAt: Date | null;
  public readonly ipHash: string | null;
  public readonly userAgent: string | null;
  public readonly createdAt: Date;

  private constructor(props: SessionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
    this.ipHash = props.ipHash;
    this.userAgent = props.userAgent;
    this.createdAt = props.createdAt;
  }

  public static issue(input: {
    id: SessionId;
    userId: UserId;
    tokenHash: string;
    now: Date;
    ttlSeconds: number;
    ipHash?: string | null;
    userAgent?: string | null;
  }): Session {
    if (!TOKEN_HASH_PATTERN.test(input.tokenHash)) {
      throw new InvalidSessionError('Session token hash must be a 64-character lowercase hex digest');
    }

    if (input.ttlSeconds <= 0) {
      throw new InvalidSessionError('Session TTL must be positive');
    }

    return new Session({
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: new Date(input.now.getTime() + input.ttlSeconds * 1000),
      revokedAt: null,
      ipHash: input.ipHash ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: input.now,
    });
  }

  public static reconstitute(props: SessionProps): Session {
    return new Session(props);
  }

  public isActive(now: Date): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > now.getTime();
  }

  public revoke(now: Date): Session {
    if (this.revokedAt) {
      return this;
    }

    return new Session({
      id: this.id,
      userId: this.userId,
      tokenHash: this.tokenHash,
      expiresAt: this.expiresAt,
      revokedAt: now,
      ipHash: this.ipHash,
      userAgent: this.userAgent,
      createdAt: this.createdAt,
    });
  }
}
