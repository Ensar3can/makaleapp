import type {
  AnalysisJob,
  Article,
  ArticleType,
  ArticleVersion,
  ContentEvidenceDraft,
  ContentMetricDraft,
  EmailAddress,
  SourceReferenceDraft,
} from '@aip/domain';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

export interface TokenDigest {
  hash(token: string): string;
}

export interface TokenGenerator {
  next(): string;
}

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterMs: number;
}

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitDecision>;
}

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
}

export interface AuthAppUrl {
  readonly origin: string;
}

export interface AnalysisScheduler {
  schedule(article: Article, now: Date): Promise<{ article: Article; job: AnalysisJob }>;
}

export interface JobDispatchOptions {
  readonly jobId?: string;
  readonly delayMs?: number;
}

export interface JobDispatcher {
  dispatch(name: string, payload: unknown, options?: JobDispatchOptions): Promise<void>;
}

export interface AnalysisUsageDraft {
  readonly provider: string;
  readonly model: string;
  readonly promptId: string;
  readonly promptVersion: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCost: number;
  readonly latencyMs: number;
}

export interface AnalyzeArticleCommand {
  readonly article: Article;
  readonly version: ArticleVersion;
  readonly job: AnalysisJob;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
}

export type ArticleAnalysisOutcome =
  | {
      readonly ok: true;
      readonly pipelineVersion: string;
      readonly promptVersion: string;
      readonly modelProvider: string;
      readonly modelName: string;
      readonly tokenUsage: number;
      readonly estimatedCost: number;
      readonly articleType?: ArticleType | null;
      readonly detectedTopics?: readonly string[];
      readonly metrics?: readonly ContentMetricDraft[];
      readonly evidence?: readonly ContentEvidenceDraft[];
      readonly sources?: readonly SourceReferenceDraft[];
      readonly usageRecords?: readonly AnalysisUsageDraft[];
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly retryable: boolean;
    };

export interface ArticleAnalyzer {
  analyze(input: AnalyzeArticleCommand): Promise<ArticleAnalysisOutcome>;
}

export interface AnalysisPipelineInput {
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly contentHash: string;
  readonly language: string;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
}

export interface AnalysisPipeline {
  run(input: AnalysisPipelineInput): Promise<ArticleAnalysisOutcome>;
}

export function verificationUrl(origin: string, token: string): string {
  return `${origin}/verify-email?token=${encodeURIComponent(token)}`;
}

export function passwordResetUrl(origin: string, token: string): string {
  return `${origin}/reset-password?token=${encodeURIComponent(token)}`;
}

export function rateLimitKey(kind: string, value: string): string {
  return `rl:${kind}:${value}`;
}

export function normalizeClientIp(ip: string | null | undefined): string {
  const trimmed = ip?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'unknown';
}

export function hashableEmail(email: EmailAddress): string {
  return email.value;
}
