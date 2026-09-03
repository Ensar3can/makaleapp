import type {
  ArticleType,
  CitationVerificationStatus,
  PersistableAnalysisMetricType,
  SourceType,
} from '@aip/domain';

export interface StructuredParseable<T> {
  parse(value: unknown): T;
}

export interface AIUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCost: number;
  readonly latencyMs: number;
}

export interface StructuredAnalysisRequest {
  readonly promptId: string;
  readonly promptVersion: string;
  readonly system: string;
  readonly userTemplate: string;
  readonly input: unknown;
}

export interface RawStructuredAnalysis {
  readonly value: unknown;
  readonly modelProvider: string;
  readonly modelName: string;
  readonly usage: AIUsage;
}

export interface AIProvider {
  analyzeStructured(request: StructuredAnalysisRequest): Promise<RawStructuredAnalysis>;
}

export interface AuthorshipDetectionResult {
  readonly riskScore: number;
  readonly confidenceScore: number;
  readonly classification?: string;
  readonly signals: readonly string[];
  readonly explanation: string;
  readonly modelVersion: string;
  readonly detectorVersion: string;
}

export interface AIAuthorshipDetector {
  readonly name: string;
  detect(content: string): Promise<AuthorshipDetectionResult>;
}

export interface ResearchHit {
  readonly url: string;
  readonly title: string;
  readonly publisher?: string;
  readonly doi?: string;
}

export interface ResearchLookupResult {
  readonly url: string;
  readonly exists: boolean;
  readonly blocked: boolean;
  readonly title?: string;
  readonly publisher?: string;
  readonly doi?: string;
}

export interface ResearchLookup {
  search(query: string): Promise<readonly ResearchHit[]>;
  lookup(url: string): Promise<ResearchLookupResult>;
}

export interface PromptDefinition {
  readonly id: string;
  readonly version: string;
  readonly purpose: string;
  readonly system: string;
  readonly userTemplate: string;
  readonly temperature: number;
}

export interface PromptRegistry {
  get(id: string): PromptDefinition;
  list(): readonly PromptDefinition[];
}

export interface UsageRecord {
  readonly provider: string;
  readonly model: string;
  readonly promptId: string;
  readonly promptVersion: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCost: number;
  readonly latencyMs: number;
  readonly recordedAt: Date;
}

export interface UsageTotals {
  readonly tokenUsage: number;
  readonly estimatedCost: number;
  readonly callCount: number;
}

export interface UsageTracker {
  record(entry: Omit<UsageRecord, 'recordedAt'> & { recordedAt?: Date }): void;
  list(): readonly UsageRecord[];
  totals(): UsageTotals;
}

export interface PipelineArticleInput {
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly contentHash: string;
  readonly language: string;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
}

export interface PipelineContentMetric {
  readonly metricType: PersistableAnalysisMetricType;
  readonly score: number;
  readonly confidence: number;
  readonly explanation: string;
}

export interface PipelineContentEvidence {
  readonly metricType: PersistableAnalysisMetricType;
  readonly evidenceType: string;
  readonly claim: string;
  readonly evidence: string;
  readonly sourceUrl?: string | null;
  readonly sourceTitle?: string | null;
  readonly reliability?: number | null;
}

export interface PipelineSourceReference {
  readonly url: string;
  readonly title: string;
  readonly publisher: string | null;
  readonly doi: string | null;
  readonly sourceType: SourceType;
  readonly verificationStatus: CitationVerificationStatus;
  readonly reliabilityScore: number | null;
}

export type PipelineResult =
  | {
      readonly ok: true;
      readonly pipelineVersion: string;
      readonly promptVersion: string;
      readonly modelProvider: string;
      readonly modelName: string;
      readonly tokenUsage: number;
      readonly estimatedCost: number;
      readonly stageCount: number;
      readonly researchHits: number;
      readonly usageRecords: readonly Omit<UsageRecord, 'recordedAt'>[];
      readonly authorship: AuthorshipDetectionResult;
      readonly articleType: ArticleType;
      readonly detectedTopics: readonly string[];
      readonly metrics: readonly PipelineContentMetric[];
      readonly evidence: readonly PipelineContentEvidence[];
      readonly sources: readonly PipelineSourceReference[];
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly retryable: boolean;
    };
