import {
  LoginUserUseCase,
  LogoutUserUseCase,
  RegisterUserUseCase,
  RequestEmailVerificationUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  ResolveSessionUseCase,
  UpdateOwnProfileUseCase,
  VerifyEmailUseCase,
} from '@aip/application';
import {
  ConsoleEmailSender,
  RandomTokenGenerator,
  ScryptPasswordHasher,
  Sha256TokenDigest,
  SystemClock,
  UuidGenerator,
} from '@aip/auth';
import { getRateLimiter } from '../rate-limit';
import { getConfig } from '@aip/config';
import {
  PrismaAuthTokenRepository,
  PrismaLoginAttemptRepository,
  PrismaProfileRepository,
  PrismaSessionRepository,
  PrismaUserRepository,
  getPrismaClient,
} from '@aip/database';

export function getAuthServices() {
  const config = getConfig();
  const rateLimiter = getRateLimiter();
  const prisma = getPrismaClient();
  const users = new PrismaUserRepository(prisma);
  const profiles = new PrismaProfileRepository(prisma);
  const sessions = new PrismaSessionRepository(prisma);
  const authTokens = new PrismaAuthTokenRepository(prisma);
  const loginAttempts = new PrismaLoginAttemptRepository(prisma);
  const hasher = new ScryptPasswordHasher();
  const tokens = new RandomTokenGenerator();
  const digest = new Sha256TokenDigest(config.SESSION_PEPPER);
  const ids = new UuidGenerator();
  const clock = new SystemClock();
  const emails = new ConsoleEmailSender();

  return {
    config,
    registerUser: new RegisterUserUseCase(
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
    loginUser: new LoginUserUseCase(
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
    logoutUser: new LogoutUserUseCase(sessions, digest, clock),
    resolveSession: new ResolveSessionUseCase(sessions, users, profiles, digest, clock),
    verifyEmail: new VerifyEmailUseCase(authTokens, users, digest, clock),
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
    requestPasswordReset: new RequestPasswordResetUseCase(
      users,
      authTokens,
      tokens,
      digest,
      ids,
      clock,
      emails,
      rateLimiter,
    ),
    resetPassword: new ResetPasswordUseCase(
      authTokens,
      users,
      sessions,
      hasher,
      digest,
      clock,
      rateLimiter,
    ),
    updateOwnProfile: new UpdateOwnProfileUseCase(users, profiles, clock),
  };
}
