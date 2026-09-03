import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { LoginUserUseCase, RegisterUserUseCase, ResolveSessionUseCase } from '@aip/application';
import { ScryptPasswordHasher, Sha256TokenDigest } from '@aip/auth';
import {
  FakeTokenDigest,
  FixedClock,
  MemoryEmailSender,
  MemoryRateLimiter,
  SequentialIdGenerator,
  SequentialTokenGenerator,
} from '../packages/application/src/fakes';
import {
  PrismaAuthTokenRepository,
  PrismaLoginAttemptRepository,
  PrismaProfileRepository,
  PrismaSessionRepository,
  PrismaUserRepository,
} from '@aip/database';
import { connectOrExplain, createTestPrisma, resetDatabase } from '../packages/database/src/test-support';

const NOW = new Date('2026-08-29T20:00:00.000Z');

describe('Auth use cases against MSSQL', () => {
  const prisma = createTestPrisma();
  const users = new PrismaUserRepository(prisma);
  const profiles = new PrismaProfileRepository(prisma);
  const sessions = new PrismaSessionRepository(prisma);
  const authTokens = new PrismaAuthTokenRepository(prisma);
  const loginAttempts = new PrismaLoginAttemptRepository(prisma);
  const hasher = new ScryptPasswordHasher();
  const tokens = new SequentialTokenGenerator();
  const digest = new Sha256TokenDigest('test-pepper');
  const ids = new SequentialIdGenerator();
  const clock = new FixedClock(NOW);
  const emails = new MemoryEmailSender();
  const rateLimiter = new MemoryRateLimiter();
  const register = new RegisterUserUseCase(
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
  );
  const login = new LoginUserUseCase(
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
  );
  const resolve = new ResolveSessionUseCase(sessions, users, profiles, digest, clock);

  beforeAll(async () => {
    await connectOrExplain(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    emails.messages.length = 0;
    rateLimiter.reset();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers, logs in, and resolves a hashed session without exposing secrets', async () => {
    const identity = await register.execute({
      email: 'ada@example.com',
      password: 'AuthorPass1234',
      displayName: 'Ada Author',
      username: 'ada-author',
      appOrigin: 'http://localhost:3000',
      ip: '127.0.0.1',
    });

    expect(identity.user.email).toBe('ada@example.com');
    expect(JSON.stringify(identity)).not.toContain('AuthorPass1234');
    expect(JSON.stringify(identity)).not.toContain('scrypt$');

    const loggedIn = await login.execute({
      email: 'ada@example.com',
      password: 'AuthorPass1234',
      ip: '127.0.0.1',
    });
    const session = await resolve.execute({ sessionToken: loggedIn.sessionToken });

    expect(session.user.id).toBe(identity.user.id);
    expect(session.profile?.username).toBe('ada-author');
    expect(new FakeTokenDigest().hash('x')).toHaveLength(64);
  });
});
