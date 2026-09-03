import type {
  ClaimImportance,
  ClaimSourceRelation,
  ClaimType,
  ClaimVerificationStatus,
  CitationVerificationStatus,
  SourceType,
} from './enums';
import type { PersistableAnalysisMetricType } from './enums';

export const CLAIM_VERIFICATION_BUDGET = 8;

export interface ExtractedClaim {
  readonly text: string;
  readonly type: ClaimType;
  readonly importance: ClaimImportance;
  readonly requiresVerification: boolean;
}

export interface CollectedSource {
  readonly url: string;
  readonly title: string;
  readonly publisher?: string;
  readonly doi?: string;
  readonly sourceType: SourceType;
}

export interface CitationCheck {
  readonly citation: string;
  readonly url: string | null;
  readonly doi: string | null;
  readonly status: CitationVerificationStatus;
  readonly title: string | null;
  readonly publisher: string | null;
  readonly blocked: boolean;
}

export interface ClaimEvaluationObservation {
  readonly claimText: string;
  readonly status: ClaimVerificationStatus;
  readonly relation: ClaimSourceRelation;
  readonly sourceUrl: string | null;
  readonly notes: string;
}

export interface TrustedClaimEvaluation {
  readonly claim: ExtractedClaim;
  readonly status: ClaimVerificationStatus;
  readonly relation: ClaimSourceRelation;
  readonly sourceUrl: string | null;
  readonly notes: string;
  readonly rejectedUntrustedUrl: string | null;
}

export interface SourceReferenceDraft {
  readonly url: string;
  readonly title: string;
  readonly publisher: string | null;
  readonly doi: string | null;
  readonly sourceType: SourceType;
  readonly verificationStatus: CitationVerificationStatus;
  readonly reliabilityScore: number | null;
}

export interface ResearchMetricDraft {
  readonly metricType: PersistableAnalysisMetricType;
  readonly score: number;
  readonly confidence: number;
  readonly explanation: string;
}

export interface ResearchEvidenceDraft {
  readonly metricType: PersistableAnalysisMetricType;
  readonly evidenceType: string;
  readonly claim: string;
  readonly evidence: string;
  readonly sourceUrl: string | null;
  readonly sourceTitle: string | null;
  readonly reliability: number | null;
}

export interface ResearchAnalysisResult {
  readonly metrics: readonly ResearchMetricDraft[];
  readonly evidence: readonly ResearchEvidenceDraft[];
  readonly sources: readonly SourceReferenceDraft[];
  readonly trustedClaimEvaluations: readonly TrustedClaimEvaluation[];
}

export function selectClaimsForVerification(
  claims: readonly ExtractedClaim[],
): ExtractedClaim[] {
  return [...claims]
    .filter((claim) => claim.requiresVerification && claim.importance !== 'low')
    .sort((left, right) => importanceRank(right.importance) - importanceRank(left.importance))
    .slice(0, CLAIM_VERIFICATION_BUDGET);
}

function importanceRank(importance: ClaimImportance): number {
  if (importance === 'high') {
    return 2;
  }

  if (importance === 'medium') {
    return 1;
  }

  return 0;
}
