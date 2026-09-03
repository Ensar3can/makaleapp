import type { EmailAddress } from './email-address';
import type { LoginAttemptId } from './ids';

export interface LoginAttemptProps {
  readonly id: LoginAttemptId;
  readonly email: EmailAddress;
  readonly succeeded: boolean;
  readonly createdAt: Date;
}

export class LoginAttempt {
  public readonly id: LoginAttemptId;
  public readonly email: EmailAddress;
  public readonly succeeded: boolean;
  public readonly createdAt: Date;

  private constructor(props: LoginAttemptProps) {
    this.id = props.id;
    this.email = props.email;
    this.succeeded = props.succeeded;
    this.createdAt = props.createdAt;
  }

  public static record(props: LoginAttemptProps): LoginAttempt {
    return new LoginAttempt(props);
  }

  public static reconstitute(props: LoginAttemptProps): LoginAttempt {
    return new LoginAttempt(props);
  }
}

export const ACCOUNT_LOCK_POLICY = {
  maxFailures: 5,
  windowMs: 15 * 60 * 1000,
} as const;

export function isAccountLocked(attempts: readonly LoginAttempt[], now: Date): boolean {
  const windowStart = now.getTime() - ACCOUNT_LOCK_POLICY.windowMs;
  const failures = attempts.filter(
    (attempt) => !attempt.succeeded && attempt.createdAt.getTime() >= windowStart,
  );

  return failures.length >= ACCOUNT_LOCK_POLICY.maxFailures;
}
