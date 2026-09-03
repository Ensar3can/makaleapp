import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_LOCK_POLICY,
  AUTH_RATE_LIMITS,
  EmailAddress,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidPasswordError,
  Permission,
  Role,
  UnauthenticatedError,
  UsernameTakenError,
  UserStatus,
  asUserId,
} from '@aip/domain';
import { requireRole } from './authorization';
import {
  FakePasswordHasher,
  FakeTokenDigest,
  FixedClock,
  InMemoryAuthTokenRepository,
  InMemoryLoginAttemptRepository,
  InMemoryProfileRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
  MemoryEmailSender,
  MemoryRateLimiter,
  SequentialIdGenerator,
  SequentialTokenGenerator,
} from './fakes';
import { LoginUserUseCase } from './use-cases/login-user';
import { LogoutUserUseCase } from './use-cases/logout-user';
import { RegisterUserUseCase } from './use-cases/register-user';
import { RequestEmailVerificationUseCase } from './use-cases/request-email-verification';
import { RequestPasswordResetUseCase } from './use-cases/request-password-reset';
import { ResetPasswordUseCase } from './use-cases/reset-password';
import { ResolveSessionUseCase } from './use-cases/resolve-session';
import { UpdateOwnProfileUseCase } from './use-cases/update-own-profile';
import { VerifyEmailUseCase } from './use-cases/verify-email';
import { RateLimitedError } from './errors';
import { InsufficientPermissionError } from '@aip/domain';

const NOW = new Date('2026-08-29T19:00:00.000Z');
const APP = 'http://localhost:3000';
const PASSWORD = 'AuthorPass1234';

function createAuth() {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const sessions = new InMemorySessionRepository();
  const authTokens = new InMemoryAuthTokenRepository();
  const loginAttempts = new InMemoryLoginAttemptRepository();
  const hasher = new FakePasswordHasher();
  const tokens = new SequentialTokenGenerator();
  const digest = new FakeTokenDigest();
  const ids = new SequentialIdGenerator();
  const clock = new FixedClock(NOW);
  const emails = new MemoryEmailSender();
  const rateLimiter = new MemoryRateLimiter();

  return {
    users,
    profiles,
    sessions,
    authTokens,
    loginAttempts,
    hasher,
    tokens,
    digest,
    ids,
    clock,
    emails,
    rateLimiter,
    register: new RegisterUserUseCase(
      users,
      profiles,
      authTokens,
      hasher,
      tokens,
      digest,
      ids,
      clock,
      emails,
      rateLimiter,
    ),
    login: new LoginUserUseCase(
      users,
      profiles,
      sessions,
      loginAttempts,
      hasher,
      tokens,
      digest,
      ids,
      clock,
      rateLimiter,
    ),
    logout: new LogoutUserUseCase(sessions, digest, clock),
    resolve: new ResolveSessionUseCase(sessions, users, profiles, digest, clock),
    verify: new VerifyEmailUseCase(authTokens, users, digest, clock),
    forgot: new RequestPasswordResetUseCase(
      users,
      authTokens,
      tokens,
      digest,
      ids,
      clock,
      emails,
      rateLimiter,
    ),
    reset: new ResetPasswordUseCase(authTokens, users, sessions, hasher, digest, clock, rateLimiter),
    requestEmailVerification: new RequestEmailVerificationUseCase(
      users,
      authTokens,
      tokens,
      digest,
      ids,
      clock,
      emails,
      rateLimiter,
    ),
    updateProfile: new UpdateOwnProfileUseCase(users, profiles, clock),
  };
}

describe('Register and login', () => {
  it('registers a user with a profile and sends a verification email', async () => {
    const auth = createAuth();
    const identity = await auth.register.execute({
      email: 'Ada@Example.com',
      password: PASSWORD,
      displayName: 'Ada Author',
      username: 'ada-author',
      appOrigin: APP,
      ip: '127.0.0.1',
    });

    expect(identity.user.email).toBe('ada@example.com');
    expect(identity.user.role).toBe(Role.USER);
    expect(identity.user.emailVerified).toBe(false);
    expect(identity.profile?.username).toBe('ada-author');
    expect(identity).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(identity)).not.toContain(PASSWORD);
    expect(auth.emails.messages[0]?.text).toContain('/verify-email?token=token-1');
  });

  it('rejects duplicate email and username', async () => {
    const auth = createAuth();
    await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });

    await expect(
      auth.register.execute({
        email: 'ada@example.com',
        password: PASSWORD,
        displayName: 'Ada 2',
        username: 'other-user',
        appOrigin: APP,
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);

    await expect(
      auth.register.execute({
        email: 'other@example.com',
        password: PASSWORD,
        displayName: 'Other',
        username: 'ada-author',
        appOrigin: APP,
      }),
    ).rejects.toBeInstanceOf(UsernameTakenError);
  });

  it('rejects a weak password', async () => {
    const auth = createAuth();
    await expect(
      auth.register.execute({
        email: 'ada@example.com',
        password: 'short',
        displayName: 'Ada',
        username: 'ada-author',
        appOrigin: APP,
      }),
    ).rejects.toBeInstanceOf(InvalidPasswordError);
  });

  it('logs in, resolves the session, and logs out', async () => {
    const auth = createAuth();
    await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });

    const loggedIn = await auth.login.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      ip: '10.0.0.2',
    });

    expect(loggedIn.sessionToken).toBeTruthy();
    expect(JSON.stringify(loggedIn)).not.toContain('fake:');

    const session = await auth.resolve.execute({ sessionToken: loggedIn.sessionToken });
    expect(session.user.email).toBe('ada@example.com');

    await auth.logout.execute({ sessionToken: loggedIn.sessionToken });
    await expect(auth.resolve.execute({ sessionToken: loggedIn.sessionToken })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('uses a generic credential error for unknown users and wrong passwords', async () => {
    const auth = createAuth();
    await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });

    await expect(
      auth.login.execute({ email: 'missing@example.com', password: PASSWORD }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      auth.login.execute({ email: 'ada@example.com', password: 'WrongPassword1' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});

describe('Email verification and password reset', () => {
  it('verifies email from the issued token', async () => {
    const auth = createAuth();
    const registered = await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });

    const verified = await auth.verify.execute({ token: 'token-1' });
    expect(verified.id).toBe(registered.user.id);
    expect(verified.emailVerified).toBe(true);
  });

  it('resets a password, revokes sessions, and accepts the new password', async () => {
    const auth = createAuth();
    await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });
    const first = await auth.login.execute({ email: 'ada@example.com', password: PASSWORD });

    await auth.forgot.execute({ email: 'ada@example.com', appOrigin: APP, ip: '127.0.0.1' });
    const resetToken = auth.emails.messages.at(-1)?.text.match(/token=([^&\s]+)/)?.[1];
    expect(resetToken).toBeTruthy();

    await auth.reset.execute({ token: resetToken ?? '', password: 'ReplacementPass99' });
    await expect(auth.resolve.execute({ sessionToken: first.sessionToken })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    await expect(auth.login.execute({ email: 'ada@example.com', password: PASSWORD })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );

    const again = await auth.login.execute({ email: 'ada@example.com', password: 'ReplacementPass99' });
    expect(again.user.email).toBe('ada@example.com');
  });

  it('does not reveal whether a reset email exists', async () => {
    const auth = createAuth();
    await expect(
      auth.forgot.execute({ email: 'nobody@example.com', appOrigin: APP, ip: '127.0.0.1' }),
    ).resolves.toBeUndefined();
    expect(auth.emails.messages).toHaveLength(0);
  });
});

describe('Profile and RBAC', () => {
  it('updates only the authenticated user profile', async () => {
    const auth = createAuth();
    const registered = await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });

    const updated = await auth.updateProfile.execute({
      actorUserId: registered.user.id,
      displayName: 'Ada Lovelace',
      bio: 'Writes methods notes.',
      websiteUrl: 'https://example.com',
    });

    expect(updated.displayName).toBe('Ada Lovelace');
    expect(updated.username).toBe('ada-author');
    expect(updated.websiteUrl).toBe('https://example.com');
  });

  it('blocks users from admin-only roles', () => {
    expect(() =>
      requireRole(
        {
          user: {
            id: 'user-1',
            email: 'ada@example.com',
            role: Role.USER,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          },
          profile: null,
        },
        Role.ADMIN,
      ),
    ).toThrow(InsufficientPermissionError);

    expect(
      requireRole(
        {
          user: {
            id: 'admin-1',
            email: 'admin@example.com',
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          },
          profile: null,
        },
        Role.ADMIN,
      ).user.role,
    ).toBe(Role.ADMIN);
    expect(Permission.USER_MANAGE).toBe('user.manage');
    expect(asUserId('user-1')).toBe('user-1');
  });
});

describe('Account lock and rate limits', () => {
  it('locks an account after repeated failed logins', async () => {
    const auth = createAuth();
    await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });

    for (let i = 0; i < ACCOUNT_LOCK_POLICY.maxFailures - 1; i += 1) {
      await expect(
        auth.login.execute({ email: 'ada@example.com', password: 'WrongPassword1' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    }

    await expect(
      auth.login.execute({ email: 'ada@example.com', password: 'WrongPassword1' }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_LOCKED' });
    await expect(auth.login.execute({ email: 'ada@example.com', password: PASSWORD })).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
    });
  });

  it('rate-limits login attempts from one IP', async () => {
    const auth = createAuth();
    await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });

    for (let i = 0; i < AUTH_RATE_LIMITS.loginPerIp.limit; i += 1) {
      await expect(
        auth.login.execute({
          email: `missing-${i}@example.com`,
          password: PASSWORD,
          ip: '203.0.113.9',
        }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    }

    await expect(
      auth.login.execute({
        email: 'missing-final@example.com',
        password: PASSWORD,
        ip: '203.0.113.9',
      }),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });

  it('keeps suspended users from authenticating', async () => {
    const auth = createAuth();
    const registered = await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });
    const user = await auth.users.findById(asUserId(registered.user.id));
    if (!user) {
      throw new Error('expected registered user');
    }

    await auth.users.save(user.suspend(NOW));
    await expect(auth.login.execute({ email: 'ada@example.com', password: PASSWORD })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(EmailAddress.from('ada@example.com').value).toBe('ada@example.com');
  });

  it('rate-limits password reset and verification resend', async () => {
    const auth = createAuth();
    await auth.register.execute({
      email: 'ada@example.com',
      password: PASSWORD,
      displayName: 'Ada',
      username: 'ada-author',
      appOrigin: APP,
    });

    for (let i = 0; i < AUTH_RATE_LIMITS.resetPasswordPerIp.limit; i += 1) {
      await expect(
        auth.reset.execute({ token: `missing-${i}`, password: 'ReplacementPass99', clientIp: '203.0.113.8' }),
      ).rejects.toMatchObject({ name: 'AuthTokenInvalidError' });
    }

    await expect(
      auth.reset.execute({ token: 'missing-final', password: 'ReplacementPass99', clientIp: '203.0.113.8' }),
    ).rejects.toBeInstanceOf(RateLimitedError);

    const registered = await auth.register.execute({
      email: 'grace@example.com',
      password: PASSWORD,
      displayName: 'Grace',
      username: 'grace-author',
      appOrigin: APP,
    });

    for (let i = 0; i < AUTH_RATE_LIMITS.resendVerificationPerUser.limit; i += 1) {
      await auth.requestEmailVerification.execute({
        userId: registered.user.id,
        appOrigin: APP,
      });
    }

    await expect(
      auth.requestEmailVerification.execute({
        userId: registered.user.id,
        appOrigin: APP,
      }),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });
});
