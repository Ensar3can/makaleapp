import { describe, expect, it } from 'vitest';
import { AuthToken } from './auth-token';
import { AUTH_RATE_LIMITS, AUTH_TTL } from './auth-ttl';
import { AuthTokenPurpose, Permission, Role } from './enums';
import {
  AccountLockedError,
  AuthTokenInvalidError,
  InsufficientPermissionError,
  InvalidPasswordError,
  InvalidSessionError,
} from './errors';
import { asAuthTokenId, asLoginAttemptId, asSessionId, asUserId } from './ids';
import { ACCOUNT_LOCK_POLICY, LoginAttempt, isAccountLocked } from './login-attempt';
import { EmailAddress } from './email-address';
import { assertPassword } from './password-policy';
import { assertAnyRole, assertPermission, hasPermission } from './permissions';
import { Session } from './session';

const NOW = new Date('2026-08-29T18:00:00.000Z');
const HASH = 'a'.repeat(64);

describe('PasswordPolicy', () => {
  it('accepts a sufficiently long mixed password and rejects weak ones', () => {
    expect(assertPassword('CorrectHorse1')).toBe('CorrectHorse1');
    expect(() => assertPassword('short1A')).toThrow(InvalidPasswordError);
    expect(() => assertPassword('lettersonlypass')).toThrow(InvalidPasswordError);
    expect(() => assertPassword('123456789012')).toThrow(InvalidPasswordError);
  });
});

describe('RBAC', () => {
  it('grants moderation only to moderator and admin', () => {
    expect(hasPermission(Role.USER, Permission.ARTICLE_CREATE)).toBe(true);
    expect(hasPermission(Role.USER, Permission.ARTICLE_MODERATE)).toBe(false);
    expect(hasPermission(Role.MODERATOR, Permission.ARTICLE_MODERATE)).toBe(true);
    expect(hasPermission(Role.ADMIN, Permission.USER_MANAGE)).toBe(true);
    expect(hasPermission(Role.MODERATOR, Permission.SYSTEM_OBSERVE)).toBe(false);
    expect(hasPermission(Role.ADMIN, Permission.SYSTEM_OBSERVE)).toBe(true);

    expect(() => assertPermission(Role.USER, Permission.USER_MANAGE)).toThrow(
      InsufficientPermissionError,
    );
    expect(() => assertAnyRole(Role.USER, [Role.ADMIN])).toThrow(InsufficientPermissionError);
    expect(() => assertAnyRole(Role.ADMIN, [Role.ADMIN])).not.toThrow();
  });
});

describe('Session', () => {
  it('issues an active session and expires or revokes it', () => {
    const session = Session.issue({
      id: asSessionId('session-1'),
      userId: asUserId('user-1'),
      tokenHash: HASH,
      now: NOW,
      ttlSeconds: AUTH_TTL.sessionSeconds,
    });

    expect(session.isActive(NOW)).toBe(true);
    expect(session.isActive(new Date(NOW.getTime() + AUTH_TTL.sessionSeconds * 1000))).toBe(false);
    expect(session.revoke(NOW).isActive(NOW)).toBe(false);
    expect(() =>
      Session.issue({
        id: asSessionId('session-2'),
        userId: asUserId('user-1'),
        tokenHash: 'not-a-hash',
        now: NOW,
        ttlSeconds: 60,
      }),
    ).toThrow(InvalidSessionError);
  });
});

describe('AuthToken', () => {
  it('can be consumed once and rejects expired tokens', () => {
    const token = AuthToken.issue({
      id: asAuthTokenId('token-1'),
      userId: asUserId('user-1'),
      purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
      tokenHash: HASH,
      now: NOW,
      ttlSeconds: 60,
    });

    const consumed = token.consume(NOW);
    expect(consumed.consumedAt).toEqual(NOW);
    expect(() => consumed.consume(NOW)).toThrow(AuthTokenInvalidError);

    const expired = AuthToken.issue({
      id: asAuthTokenId('token-2'),
      userId: asUserId('user-1'),
      purpose: AuthTokenPurpose.PASSWORD_RESET,
      tokenHash: HASH,
      now: NOW,
      ttlSeconds: 1,
    });
    expect(() => expired.consume(new Date(NOW.getTime() + 2000))).toThrow(AuthTokenInvalidError);
  });
});

describe('Account lock policy', () => {
  it('locks after the configured number of recent failures', () => {
    const email = EmailAddress.from('author@example.com');
    const failures = Array.from({ length: ACCOUNT_LOCK_POLICY.maxFailures }, (_, index) =>
      LoginAttempt.record({
        id: asLoginAttemptId(`attempt-${index}`),
        email,
        succeeded: false,
        createdAt: NOW,
      }),
    );

    expect(isAccountLocked(failures, NOW)).toBe(true);
    expect(isAccountLocked(failures.slice(0, ACCOUNT_LOCK_POLICY.maxFailures - 1), NOW)).toBe(false);
    expect(
      isAccountLocked(
        [
          LoginAttempt.record({
            id: asLoginAttemptId('old'),
            email,
            succeeded: false,
            createdAt: new Date(NOW.getTime() - ACCOUNT_LOCK_POLICY.windowMs - 1),
          }),
        ],
        NOW,
      ),
    ).toBe(false);
    expect(AUTH_RATE_LIMITS.loginPerIp.limit).toBeGreaterThan(0);
    expect(AccountLockedError).toBeDefined();
  });
});
