export class DomainError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidScoreError extends DomainError {
  public constructor(value: number) {
    super('INVALID_SCORE', `Score must be a finite number between 0 and 100 inclusive, received ${value}`);
  }
}

export class InvalidScoringPolicyError extends DomainError {
  public constructor(message: string) {
    super('INVALID_SCORING_POLICY', message);
  }
}

export class ScoringPolicyNotFoundError extends DomainError {
  public constructor(message = 'An active scoring policy is required to persist a complete score') {
    super('SCORING_POLICY_NOT_FOUND', message);
  }
}

export class IncompleteAnalysisScoreError extends DomainError {
  public constructor(message: string) {
    super('INCOMPLETE_ANALYSIS_SCORE', message);
  }
}

export class InvalidArticleStateError extends DomainError {
  public constructor(message: string) {
    super('INVALID_ARTICLE_STATE', message);
  }
}

export class ArticleAlreadyPublishedError extends DomainError {
  public constructor(message = 'Article is already published') {
    super('ARTICLE_ALREADY_PUBLISHED', message);
  }
}

export class ArticleNotFoundError extends DomainError {
  public constructor(articleId: string) {
    super('ARTICLE_NOT_FOUND', `Article not found: ${articleId}`);
  }
}

export class UnauthorizedArticleAccessError extends DomainError {
  public constructor(message = 'You cannot access this article') {
    super('UNAUTHORIZED_ARTICLE_ACCESS', message);
  }
}

export class EmailNotVerifiedError extends DomainError {
  public constructor(message = 'Verify your email before submitting an article') {
    super('EMAIL_NOT_VERIFIED', message);
  }
}

export class CategoryNotFoundError extends DomainError {
  public constructor(categoryId: string) {
    super('CATEGORY_NOT_FOUND', `Category not found: ${categoryId}`);
  }
}

export class ProfileNotFoundError extends DomainError {
  public constructor(username: string) {
    super('PROFILE_NOT_FOUND', `Profile not found: ${username}`);
  }
}

export class InvalidDiscoveryCursorError extends DomainError {
  public constructor(message = 'Discovery cursor is invalid') {
    super('INVALID_DISCOVERY_CURSOR', message);
  }
}

export class AnalysisNotCompletedError extends DomainError {
  public constructor(message = 'Analysis has not completed for this article version') {
    super('ANALYSIS_NOT_COMPLETED', message);
  }
}

export class InvalidAnalysisJobStateError extends DomainError {
  public constructor(message: string) {
    super('INVALID_ANALYSIS_JOB_STATE', message);
  }
}

export class InvalidAnalysisRunStateError extends DomainError {
  public constructor(message: string) {
    super('INVALID_ANALYSIS_RUN_STATE', message);
  }
}

export class InvalidUserStateError extends DomainError {
  public constructor(message: string) {
    super('INVALID_USER_STATE', message);
  }
}

export class UnauthorizedRoleAssignmentError extends DomainError {
  public constructor(message = 'Only an administrator can assign roles') {
    super('UNAUTHORIZED_ROLE_ASSIGNMENT', message);
  }
}

export class InvalidIdentifierError extends DomainError {
  public constructor(brand: string) {
    super('INVALID_ID', `${brand} is required`);
  }
}

export class InvalidSlugError extends DomainError {
  public constructor(message: string) {
    super('INVALID_SLUG', message);
  }
}

export class InvalidEmailError extends DomainError {
  public constructor(message: string) {
    super('INVALID_EMAIL', message);
  }
}

export class InvalidContentHashError extends DomainError {
  public constructor(message = 'Content hash must be a 64-character lowercase SHA-256 hex digest') {
    super('INVALID_CONTENT_HASH', message);
  }
}

export class InvalidArticleVersionError extends DomainError {
  public constructor(message: string) {
    super('INVALID_ARTICLE_VERSION', message);
  }
}

export class InvalidProfileError extends DomainError {
  public constructor(message: string) {
    super('INVALID_PROFILE', message);
  }
}

export class InvalidPasswordError extends DomainError {
  public constructor(message: string) {
    super('INVALID_PASSWORD', message);
  }
}

export class InvalidCredentialsError extends DomainError {
  public constructor(message = 'Invalid email or password') {
    super('INVALID_CREDENTIALS', message);
  }
}

export class AccountLockedError extends DomainError {
  public constructor(message = 'This account is temporarily locked after too many failed sign-in attempts') {
    super('ACCOUNT_LOCKED', message);
  }
}

export class EmailAlreadyRegisteredError extends DomainError {
  public constructor(message = 'An account with this email already exists') {
    super('EMAIL_ALREADY_REGISTERED', message);
  }
}

export class UsernameTakenError extends DomainError {
  public constructor(message = 'This username is already taken') {
    super('USERNAME_TAKEN', message);
  }
}

export class UnauthenticatedError extends DomainError {
  public constructor(message = 'Authentication is required') {
    super('UNAUTHENTICATED', message);
  }
}

export class SessionExpiredError extends DomainError {
  public constructor(message = 'Session is no longer valid') {
    super('SESSION_EXPIRED', message);
  }
}

export class InsufficientPermissionError extends DomainError {
  public constructor(message = 'You do not have permission to perform this action') {
    super('INSUFFICIENT_PERMISSION', message);
  }
}

export class AuthTokenInvalidError extends DomainError {
  public constructor(message = 'This link is invalid or has expired') {
    super('AUTH_TOKEN_INVALID', message);
  }
}

export class InvalidSessionError extends DomainError {
  public constructor(message: string) {
    super('INVALID_SESSION', message);
  }
}

export class InvalidCategoryError extends DomainError {
  public constructor(message: string) {
    super('INVALID_CATEGORY', message);
  }
}

export class InvalidTagError extends DomainError {
  public constructor(message: string) {
    super('INVALID_TAG', message);
  }
}

export class InvalidScoreSnapshotError extends DomainError {
  public constructor(message: string) {
    super('INVALID_SCORE_SNAPSHOT', message);
  }
}

export class InvalidAnalysisMetricError extends DomainError {
  public constructor(message: string) {
    super('INVALID_ANALYSIS_METRIC', message);
  }
}

export class InvalidAnalysisEvidenceError extends DomainError {
  public constructor(message: string) {
    super('INVALID_ANALYSIS_EVIDENCE', message);
  }
}

export class InvalidArticleEvaluationPolicyError extends DomainError {
  public constructor(message: string) {
    super('INVALID_ARTICLE_EVALUATION_POLICY', message);
  }
}

export class InvalidSourceReferenceError extends DomainError {
  public constructor(message: string) {
    super('INVALID_SOURCE_REFERENCE', message);
  }
}

export class InvalidModerationReviewError extends DomainError {
  public constructor(message: string) {
    super('INVALID_MODERATION_REVIEW', message);
  }
}

export class InvalidAuditLogError extends DomainError {
  public constructor(message: string) {
    super('INVALID_AUDIT_LOG', message);
  }
}

export class InvalidAiUsageRecordError extends DomainError {
  public constructor(message: string) {
    super('INVALID_AI_USAGE_RECORD', message);
  }
}

export class InvalidOperationalEventError extends DomainError {
  public constructor(message: string) {
    super('INVALID_OPERATIONAL_EVENT', message);
  }
}

export class AnalysisJobNotFoundError extends DomainError {
  public constructor(jobId: string) {
    super('ANALYSIS_JOB_NOT_FOUND', `Analysis job not found: ${jobId}`);
  }
}
