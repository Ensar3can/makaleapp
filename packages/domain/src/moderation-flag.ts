import type { AnalysisEvidence } from './analysis-evidence';
import type { ArticleVersion } from './article-version';
import { AnalysisEvidenceType, AuthorshipClassification, CitationVerificationStatus, ClaimImportance, ClaimVerificationStatus, MetricType, ModerationFlagCode } from './enums';
import type { ArticleId } from './ids';
import type { ScoreSnapshot } from './score-snapshot';
import type { ScoringPolicy } from './scoring-policy';
import type { SourceReference } from './source-reference';

export interface ModerationFlag {
  readonly code: ModerationFlagCode;
  readonly summary: string;
}

export interface EvaluateModerationFlagsInput {
  readonly snapshot: ScoreSnapshot | null;
  readonly policy: ScoringPolicy;
  readonly evidence: readonly AnalysisEvidence[];
  readonly sources: readonly SourceReference[];
  readonly version: ArticleVersion | null;
  readonly duplicateArticleId: ArticleId | null;
}

const MIN_DISPUTED_IMPORTANT_CLAIMS = 2;
const SPAM_SHORT_WORD_LIMIT = 80;
const SPAM_COMMERCIAL_WORD_LIMIT = 120;
const SPAM_MIN_SHORT_URLS = 3;
const UNSAFE_PATTERNS: readonly RegExp[] = [
  /\bbomb[- ]making\b/i,
  /\bstolen credit cards?\b/i,
];
const SPAM_COMMERCIAL = /\b(buy now|click here|limited offer|viagra|crypto airdrop)\b/i;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

export function metricTypeForFlag(code: ModerationFlagCode): MetricType {
  switch (code) {
    case ModerationFlagCode.HIGH_AI_AUTHORSHIP_RISK:
      return MetricType.AI_AUTHORSHIP_RISK;
    case ModerationFlagCode.CITATION_MANIPULATION:
      return MetricType.CITATION_QUALITY;
    case ModerationFlagCode.DISPUTED_IMPORTANT_CLAIMS:
      return MetricType.FACTUAL_RELIABILITY;
    case ModerationFlagCode.UNSAFE_CONTENT:
    case ModerationFlagCode.SPAM:
      return MetricType.CONTENT_QUALITY;
    case ModerationFlagCode.SUSPICIOUS_DUPLICATE:
      return MetricType.ORIGINALITY;
    default: {
      const exhaustive: never = code;
      return exhaustive;
    }
  }
}

export function evaluateModerationFlags(input: EvaluateModerationFlagsInput): readonly ModerationFlag[] {
  const flags: ModerationFlag[] = [];
  const authorship = highAuthorshipRiskFlag(input.snapshot, input.policy);

  if (authorship) {
    flags.push(authorship);
  }

  const citation = citationManipulationFlag(input.sources, input.evidence);

  if (citation) {
    flags.push(citation);
  }

  const disputed = disputedImportantClaimsFlag(input.evidence);

  if (disputed) {
    flags.push(disputed);
  }

  if (input.version) {
    const text = `${input.version.title}\n${input.version.abstract}\n${input.version.content}`;
    const unsafe = unsafeContentFlag(text);

    if (unsafe) {
      flags.push(unsafe);
    }

    const spam = spamFlag(text);

    if (spam) {
      flags.push(spam);
    }
  }

  if (input.duplicateArticleId) {
    flags.push({
      code: ModerationFlagCode.SUSPICIOUS_DUPLICATE,
      summary: `Current version content hash matches another article (${input.duplicateArticleId}).`,
    });
  }

  return flags;
}

function highAuthorshipRiskFlag(
  snapshot: ScoreSnapshot | null,
  policy: ScoringPolicy,
): ModerationFlag | null {
  if (!snapshot) {
    return null;
  }

  if (snapshot.authorshipClassification !== AuthorshipClassification.HIGH) {
    return null;
  }

  if (snapshot.authorshipConfidence.value < policy.authorshipConfidenceThreshold.value) {
    return null;
  }

  return {
    code: ModerationFlagCode.HIGH_AI_AUTHORSHIP_RISK,
    summary:
      `Ensemble authorship classification is high with sufficient confidence ` +
      `(risk ${snapshot.authorshipRisk.value}, confidence ${snapshot.authorshipConfidence.value}). ` +
      `This is a risk estimate, not a verdict.`,
  };
}

function citationManipulationFlag(
  sources: readonly SourceReference[],
  evidence: readonly AnalysisEvidence[],
): ModerationFlag | null {
  const suspiciousSources = sources.filter(
    (source) => source.verificationStatus === CitationVerificationStatus.SUSPICIOUS,
  ).length;
  const suspiciousEvidence = evidence.filter(
    (item) =>
      item.evidenceType === AnalysisEvidenceType.CITATION_VERIFICATION &&
      /\bsuspicious\b/i.test(item.evidence),
  ).length;

  if (suspiciousSources === 0 && suspiciousEvidence === 0) {
    return null;
  }

  return {
    code: ModerationFlagCode.CITATION_MANIPULATION,
    summary: `Citation verification marked ${suspiciousSources + suspiciousEvidence} source(s) as suspicious.`,
  };
}

function disputedImportantClaimsFlag(evidence: readonly AnalysisEvidence[]): ModerationFlag | null {
  const importantTexts = new Set(
    evidence
      .filter(
        (item) =>
          item.evidenceType === AnalysisEvidenceType.EXTRACTED_CLAIM &&
          item.evidence.includes(`importance=${ClaimImportance.HIGH}`),
      )
      .map((item) => item.claim),
  );
  const disputed = evidence.filter((item) => {
    if (item.evidenceType !== AnalysisEvidenceType.CLAIM_VERIFICATION) {
      return false;
    }

    if (!item.evidence.startsWith(`${ClaimVerificationStatus.DISPUTED}`)) {
      return false;
    }

    return importantTexts.size === 0 || importantTexts.has(item.claim);
  });

  if (disputed.length < MIN_DISPUTED_IMPORTANT_CLAIMS) {
    return null;
  }

  return {
    code: ModerationFlagCode.DISPUTED_IMPORTANT_CLAIMS,
    summary: `${disputed.length} important factual claims were classified as disputed. Unverified is not treated as false.`,
  };
}

function unsafeContentFlag(text: string): ModerationFlag | null {
  if (!UNSAFE_PATTERNS.some((pattern) => pattern.test(text))) {
    return null;
  }

  return {
    code: ModerationFlagCode.UNSAFE_CONTENT,
    summary: 'Heuristic unsafe-content patterns matched the current version. This is not an automatic rejection.',
  };
}

function spamFlag(text: string): ModerationFlag | null {
  const words = tokenizeWords(text);
  const urls = text.match(URL_PATTERN) ?? [];

  if (words.length > 0 && words.length < SPAM_SHORT_WORD_LIMIT && urls.length >= SPAM_MIN_SHORT_URLS) {
    return {
      code: ModerationFlagCode.SPAM,
      summary: `Short body (${words.length} words) contains ${urls.length} URLs.`,
    };
  }

  if (words.length < SPAM_COMMERCIAL_WORD_LIMIT && SPAM_COMMERCIAL.test(text)) {
    return {
      code: ModerationFlagCode.SPAM,
      summary: 'Short body matched commercial spam phrasing.',
    };
  }

  return null;
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}
