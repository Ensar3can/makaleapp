export const AUTH_RATE_LIMITS = {
  loginPerIp: { limit: 10, windowMs: 15 * 60 * 1000 },
  loginPerEmail: { limit: 8, windowMs: 15 * 60 * 1000 },
  registerPerIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  forgotPasswordPerIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  resetPasswordPerIp: { limit: 10, windowMs: 15 * 60 * 1000 },
  resendVerificationPerUser: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;

export const OPERATION_RATE_LIMITS = {
  submitArticlePerUser: { limit: 8, windowMs: 60 * 60 * 1000 },
  searchPerIp: { limit: 60, windowMs: 60 * 1000 },
  moderatePerUser: { limit: 60, windowMs: 60 * 1000 },
  flagPerUser: { limit: 30, windowMs: 60 * 1000 },
  retryAnalysisJobPerUser: { limit: 20, windowMs: 60 * 1000 },
} as const;
