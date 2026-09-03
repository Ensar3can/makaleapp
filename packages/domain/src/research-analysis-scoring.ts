import { ArticleEvaluationPolicy } from './article-evaluation-policy';
import type { PreprocessedArticle } from './article-preprocessor';
import {
  AnalysisEvidenceType,
  ClaimVerificationStatus,
  CitationVerificationStatus,
  HttpUrlSafety,
  MetricType,
  SourceType,
} from './enums';
import { inspectHttpUrl, isTrustedSourceUrl, normalizeHttpUrl } from './http-url-safety';
import {
  CLAIM_VERIFICATION_BUDGET,
  selectClaimsForVerification,
  type CitationCheck,
  type ClaimEvaluationObservation,
  type CollectedSource,
  type ExtractedClaim,
  type ResearchAnalysisResult,
  type ResearchEvidenceDraft,
  type ResearchMetricDraft,
  type SourceReferenceDraft,
  type TrustedClaimEvaluation,
} from './research-analysis';
import { Score } from './score';

const CITATION_STATUS_POINTS: Record<CitationVerificationStatus, number> = {
  [CitationVerificationStatus.VERIFIED]: 95,
  [CitationVerificationStatus.PARTIALLY_VERIFIED]: 72,
  [CitationVerificationStatus.UNVERIFIED]: 55,
  [CitationVerificationStatus.SUSPICIOUS]: 22,
  [CitationVerificationStatus.BROKEN]: 12,
};

const CLAIM_STATUS_POINTS: Record<ClaimVerificationStatus, number> = {
  [ClaimVerificationStatus.SUPPORTED]: 92,
  [ClaimVerificationStatus.PARTIALLY_SUPPORTED]: 74,
  [ClaimVerificationStatus.UNVERIFIED]: 58,
  [ClaimVerificationStatus.OUTDATED]: 42,
  [ClaimVerificationStatus.DISPUTED]: 24,
};

export interface ScoreResearchAnalysisInput {
  readonly articleType: ArticleEvaluationPolicy['articleType'];
  readonly preprocessed: PreprocessedArticle;
  readonly claims: readonly ExtractedClaim[];
  readonly collectedSources: readonly CollectedSource[];
  readonly citationChecks: readonly CitationCheck[];
  readonly claimEvaluations: readonly ClaimEvaluationObservation[];
}

export function scoreResearchAnalysis(input: ScoreResearchAnalysisInput): ResearchAnalysisResult {
  const policy = ArticleEvaluationPolicy.forType(input.articleType);
  const selectedClaims = selectClaimsForVerification(input.claims);
  const trustedUrls = collectTrustedUrls(input.collectedSources, input.citationChecks);
  const trustedEvaluations = trustClaimEvaluations(
    selectedClaims,
    input.claimEvaluations,
    trustedUrls,
  );
  const citations = scoreCitations(policy, input.preprocessed, input.citationChecks);
  const evidence = scoreEvidence(policy, input.collectedSources, trustedEvaluations, selectedClaims);
  const factual = scoreFactualReliability(policy, selectedClaims, trustedEvaluations);
  const sources = toSourceDrafts(input.collectedSources, input.citationChecks);

  const metrics: ResearchMetricDraft[] = [
    {
      metricType: MetricType.CITATION_QUALITY,
      score: citations.score.value,
      confidence: citations.confidence,
      explanation: citations.explanation,
    },
    {
      metricType: MetricType.EVIDENCE,
      score: evidence.score.value,
      confidence: evidence.confidence,
      explanation: evidence.explanation,
    },
    {
      metricType: MetricType.FACTUAL_RELIABILITY,
      score: factual.score.value,
      confidence: factual.confidence,
      explanation: factual.explanation,
    },
  ];

  return {
    metrics,
    evidence: [
      ...claimEvidence(input.claims, selectedClaims),
      ...citations.evidence,
      ...evidence.evidence,
      ...factual.evidence,
    ],
    sources,
    trustedClaimEvaluations: trustedEvaluations,
  };
}

function collectTrustedUrls(
  sources: readonly CollectedSource[],
  citations: readonly CitationCheck[],
): string[] {
  const urls: string[] = [];

  for (const source of sources) {
    const normalized = normalizeHttpUrl(source.url);

    if (normalized) {
      urls.push(normalized);
    }
  }

  for (const citation of citations) {
    if (citation.blocked || !citation.url) {
      continue;
    }

    const normalized = normalizeHttpUrl(citation.url);

    if (normalized) {
      urls.push(normalized);
    }
  }

  return [...new Set(urls)];
}

function trustClaimEvaluations(
  claims: readonly ExtractedClaim[],
  observations: readonly ClaimEvaluationObservation[],
  trustedUrls: readonly string[],
): TrustedClaimEvaluation[] {
  return claims.map((claim) => {
    const observation = observations.find((item) => item.claimText === claim.text);
    const proposedUrl = observation?.sourceUrl?.trim() || null;
    const trustedUrl =
      proposedUrl && isTrustedSourceUrl(proposedUrl, trustedUrls) ? proposedUrl : null;
    const rejectedUntrustedUrl = proposedUrl && !trustedUrl ? proposedUrl : null;
    const status =
      rejectedUntrustedUrl &&
      (observation?.status === ClaimVerificationStatus.SUPPORTED ||
        observation?.status === ClaimVerificationStatus.PARTIALLY_SUPPORTED)
        ? ClaimVerificationStatus.UNVERIFIED
        : (observation?.status ?? ClaimVerificationStatus.UNVERIFIED);

    return {
      claim,
      status,
      relation: trustedUrl ? (observation?.relation ?? 'uncertain') : 'uncertain',
      sourceUrl: trustedUrl,
      notes: observation?.notes ?? 'No structured evaluation was supplied for this claim.',
      rejectedUntrustedUrl,
    };
  });
}

function scoreCitations(
  policy: ArticleEvaluationPolicy,
  preprocessed: PreprocessedArticle,
  checks: readonly CitationCheck[],
): ScoredMetric {
  const extractedCount = preprocessed.citations.length + preprocessed.urls.length;
  const referenceCount = preprocessed.references.length;
  const hasCitations = extractedCount > 0 || referenceCount > 0 || checks.length > 0;

  if (!policy.research.requiresCitations && !hasCitations) {
    return {
      score: Score.from(72),
      confidence: 45,
      explanation: `Citations are optional for ${policy.articleType} articles. Missing sources were not treated as a defect.`,
      evidence: [
        {
          metricType: MetricType.CITATION_QUALITY,
          evidenceType: AnalysisEvidenceType.CITATION_VERIFICATION,
          claim: 'Citations are optional for this article type',
          evidence: `Extracted ${extractedCount} in-text citations/URLs and ${referenceCount} reference lines.`,
          sourceUrl: null,
          sourceTitle: null,
          reliability: null,
        },
      ],
    };
  }

  if (policy.research.requiresCitations && !hasCitations) {
    return {
      score: Score.from(28),
      confidence: 70,
      explanation: `${policy.articleType} articles are expected to cite sources. None were extracted.`,
      evidence: [
        {
          metricType: MetricType.CITATION_QUALITY,
          evidenceType: AnalysisEvidenceType.CITATION_VERIFICATION,
          claim: 'Required citations were missing',
          evidence: 'No in-text citations, URLs, or reference lines were extracted.',
          sourceUrl: null,
          sourceTitle: null,
          reliability: null,
        },
      ],
    };
  }

  const statusPoints = checks.map((check) => CITATION_STATUS_POINTS[check.status]);
  const verification = statusPoints.length > 0 ? average(statusPoints) : 55;
  const consistency = citationConsistency(preprocessed);
  const score = Score.from(verification * 0.7 + consistency * 0.3);
  const blocked = checks.filter((check) => check.blocked).length;
  const suspicious = checks.filter(
    (check) =>
      check.status === CitationVerificationStatus.SUSPICIOUS ||
      check.status === CitationVerificationStatus.BROKEN,
  ).length;

  const evidence: ResearchEvidenceDraft[] = checks.slice(0, 12).map((check) => ({
    metricType: MetricType.CITATION_QUALITY,
    evidenceType: check.blocked
      ? AnalysisEvidenceType.SSRF_BLOCKED_URL
      : AnalysisEvidenceType.CITATION_VERIFICATION,
    claim: check.citation,
    evidence: check.blocked
      ? 'URL was blocked by the SSRF guard and was not fetched.'
      : `Verification status: ${check.status}.`,
    sourceUrl: check.blocked ? null : check.url,
    sourceTitle: check.title,
    reliability: CITATION_STATUS_POINTS[check.status],
  }));

  return {
    score,
    confidence: blocked > 0 || suspicious > 0 ? 55 : 75,
    explanation:
      blocked > 0
        ? `Citation quality mixed extracted references with verification outcomes. ${blocked} URL(s) were blocked by SSRF guards.`
        : `Citation quality combined verification outcomes with internal citation/reference consistency.`,
    evidence,
  };
}

function scoreEvidence(
  policy: ArticleEvaluationPolicy,
  sources: readonly CollectedSource[],
  evaluations: readonly TrustedClaimEvaluation[],
  selectedClaims: readonly ExtractedClaim[],
): ScoredMetric {
  const rejected = evaluations.filter((item) => item.rejectedUntrustedUrl !== null);
  const supporting = evaluations.filter((item) => item.sourceUrl !== null).length;
  const evidenceItems: ResearchEvidenceDraft[] = [
    {
      metricType: MetricType.EVIDENCE,
      evidenceType: AnalysisEvidenceType.SOURCE_COLLECTION,
      claim: `${sources.length} collected source(s)`,
      evidence:
        sources.length === 0
          ? 'The research provider returned no SSRF-safe sources. Missing web evidence is not treated as falsehood.'
          : sources.map((source) => source.title).join('; '),
      sourceUrl: sources[0]?.url ?? null,
      sourceTitle: sources[0]?.title ?? null,
      reliability: sources.length > 0 ? 70 : 40,
    },
    ...rejected.map(
      (item): ResearchEvidenceDraft => ({
        metricType: MetricType.EVIDENCE,
        evidenceType: AnalysisEvidenceType.REJECTED_UNTRUSTED_URL,
        claim: item.claim.text,
        evidence: `Ignored untrusted URL ${item.rejectedUntrustedUrl}. Hallucinated source URLs are not evidence.`,
        sourceUrl: null,
        sourceTitle: null,
        reliability: 0,
      }),
    ),
  ];

  if (sources.length === 0) {
    const score = policy.research.claimVerificationExpected ? 42 : 68;
    const confidence = policy.research.claimVerificationExpected ? 50 : 40;
    return {
      score: Score.from(score),
      confidence,
      explanation: policy.research.claimVerificationExpected
        ? 'No external sources were collected. Important claims stay unverified rather than false.'
        : 'External sources were not required for this article type, and none were collected.',
      evidence: evidenceItems,
    };
  }

  const coverage =
    selectedClaims.length === 0 ? 70 : (supporting / selectedClaims.length) * 100;
  const rejectionPenalty = Math.min(30, rejected.length * 15);

  return {
    score: Score.from(Math.max(0, coverage * 0.6 + 70 * 0.4 - rejectionPenalty)),
    confidence: rejected.length > 0 ? 50 : 70,
    explanation:
      rejected.length > 0
        ? `Evidence uses only collected sources. ${rejected.length} model-proposed URL(s) were rejected as untrusted.`
        : `Evidence coverage is based on collected sources that could be bound to important claims.`,
    evidence: evidenceItems,
  };
}

function scoreFactualReliability(
  policy: ArticleEvaluationPolicy,
  selectedClaims: readonly ExtractedClaim[],
  evaluations: readonly TrustedClaimEvaluation[],
): ScoredMetric {
  if (selectedClaims.length === 0) {
    const score = policy.research.claimVerificationExpected ? 62 : 74;
    return {
      score: Score.from(score),
      confidence: 40,
      explanation:
        'No important verifiable claims were selected. Factual reliability stays neutral rather than treating silence as falsehood.',
      evidence: [
        {
          metricType: MetricType.FACTUAL_RELIABILITY,
          evidenceType: AnalysisEvidenceType.CLAIM_VERIFICATION,
          claim: 'No important verifiable claims',
          evidence: 'Claim extraction produced nothing that required verification within the analysis budget.',
          sourceUrl: null,
          sourceTitle: null,
          reliability: null,
        },
      ],
    };
  }

  const points = evaluations.map((item) => CLAIM_STATUS_POINTS[item.status]);
  const disputed = evaluations.filter((item) => item.status === ClaimVerificationStatus.DISPUTED).length;
  const unverified = evaluations.filter(
    (item) => item.status === ClaimVerificationStatus.UNVERIFIED,
  ).length;

  return {
    score: Score.from(average(points)),
    confidence: disputed > 0 ? 55 : unverified === evaluations.length ? 45 : 70,
    explanation:
      unverified === evaluations.length
        ? 'Important claims remain unverified. Lack of web evidence is not classified as false.'
        : `Factual reliability averages claim classifications. Unverified is distinct from disputed.`,
    evidence: evaluations.map((item) => ({
      metricType: MetricType.FACTUAL_RELIABILITY,
      evidenceType: AnalysisEvidenceType.CLAIM_VERIFICATION,
      claim: item.claim.text,
      evidence: `${item.status}. ${item.notes}`,
      sourceUrl: item.sourceUrl,
      sourceTitle: null,
      reliability: CLAIM_STATUS_POINTS[item.status],
    })),
  };
}

function claimEvidence(
  claims: readonly ExtractedClaim[],
  selected: readonly ExtractedClaim[],
): ResearchEvidenceDraft[] {
  return claims.slice(0, CLAIM_VERIFICATION_BUDGET + 4).map((claim) => ({
    metricType: MetricType.FACTUAL_RELIABILITY,
    evidenceType: AnalysisEvidenceType.EXTRACTED_CLAIM,
    claim: claim.text,
    evidence: `type=${claim.type}; importance=${claim.importance}; requiresVerification=${claim.requiresVerification}; selected=${selected.includes(claim)}`,
    sourceUrl: null,
    sourceTitle: null,
    reliability: null,
  }));
}

function toSourceDrafts(
  sources: readonly CollectedSource[],
  citations: readonly CitationCheck[],
): SourceReferenceDraft[] {
  const drafts = new Map<string, SourceReferenceDraft>();

  for (const source of sources) {
    const inspection = inspectHttpUrl(source.url);

    if (inspection.safety !== HttpUrlSafety.SAFE || !inspection.href) {
      continue;
    }

    const key = normalizeHttpUrl(source.url) ?? inspection.href;
    drafts.set(key, {
      url: inspection.href,
      title: source.title,
      publisher: source.publisher ?? null,
      doi: source.doi ?? null,
      sourceType: source.sourceType,
      verificationStatus: CitationVerificationStatus.PARTIALLY_VERIFIED,
      reliabilityScore: 70,
    });
  }

  for (const citation of citations) {
    if (!citation.url || citation.blocked) {
      continue;
    }

    const inspection = inspectHttpUrl(citation.url);

    if (inspection.safety !== HttpUrlSafety.SAFE || !inspection.href) {
      continue;
    }

    const key = normalizeHttpUrl(citation.url) ?? inspection.href;
    const existing = drafts.get(key);
    drafts.set(key, {
      url: inspection.href,
      title: citation.title ?? existing?.title ?? citation.citation,
      publisher: citation.publisher ?? existing?.publisher ?? null,
      doi: citation.doi ?? existing?.doi ?? null,
      sourceType: citation.doi ? SourceType.DOI : (existing?.sourceType ?? SourceType.CITATION),
      verificationStatus: citation.status,
      reliabilityScore: CITATION_STATUS_POINTS[citation.status],
    });
  }

  return [...drafts.values()];
}

function citationConsistency(preprocessed: PreprocessedArticle): number {
  const hasCitations = preprocessed.citations.length > 0 || preprocessed.urls.length > 0;
  const hasReferences = preprocessed.references.length > 0;

  if (hasCitations && hasReferences) {
    return 85;
  }

  if (hasCitations || hasReferences) {
    return 55;
  }

  return 40;
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

interface ScoredMetric {
  readonly score: Score;
  readonly confidence: number;
  readonly explanation: string;
  readonly evidence: readonly ResearchEvidenceDraft[];
}
