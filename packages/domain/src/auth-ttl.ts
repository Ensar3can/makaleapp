export const AUTH_TTL = {
  sessionSeconds: 60 * 60 * 24 * 7,
  emailVerificationSeconds: 60 * 60 * 24,
  passwordResetSeconds: 60 * 60,
} as const;

export { AUTH_RATE_LIMITS, OPERATION_RATE_LIMITS } from './rate-limits';
