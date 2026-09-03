import { describe, expect, it } from 'vitest';
import { ArticleEvaluationPolicy } from './article-evaluation-policy';
import { preprocessArticle } from './article-preprocessor';
import {
  AnalysisEvidenceType,
  ArticleType,
  ClaimImportance,
  ClaimSourceRelation,
  ClaimType,
  ClaimVerificationStatus,
  CitationVerificationStatus,
  HttpUrlSafety,
  MetricType,
  SourceType,
} from './enums';
import { inspectHttpUrl, isBlockedIpAddress, isTrustedSourceUrl } from './http-url-safety';
import { scoreResearchAnalysis } from './research-analysis-scoring';
import { CLAIM_VERIFICATION_BUDGET, selectClaimsForVerification } from './research-analysis';
import type { ExtractedClaim } from './research-analysis';
import { SourceReference } from './source-reference';
import { asAnalysisRunId, asArticleId, asSourceReferenceId } from './ids';
import { Score } from './score';
import { InvalidSourceReferenceError } from './errors';

const NOW = new Date('2026-08-30T15:00:00.000Z');

const RESEARCH_BODY = [
  '# Introduction',
  'X technology reduced energy consumption by 40% in 2025 (Smith, 2024).',
  'See https://example.org/methods and doi 10.1000/xyz123.',
  '',
  '# References',
  'Smith, A. (2024). Evaluation binding.',
].join('\n');

const preprocessed = preprocessArticle({
  title: 'Queued Analysis',
  abstract: 'Abstract',
  content: RESEARCH_BODY,
  contentHash: 'b'.repeat(64),
  language: 'en',
});

const factualClaim: ExtractedClaim = {
  text: 'X technology reduced energy consumption by 40% in 2025.',
  type: ClaimType.FACTUAL,
  importance: ClaimImportance.HIGH,
  requiresVerification: true,
};

describe('inspectHttpUrl', () => {
  it('accepts public HTTPS URLs and blocks private or non-HTTP targets', () => {
    expect(inspectHttpUrl('https://example.org/paper').safety).toBe(HttpUrlSafety.SAFE);
    expect(inspectHttpUrl('http://127.0.0.1/secret').safety).toBe(HttpUrlSafety.BLOCKED);
    expect(inspectHttpUrl('http://[::1]/secret').safety).toBe(HttpUrlSafety.BLOCKED);
    expect(inspectHttpUrl('http://169.254.169.254/latest/meta-data').safety).toBe(HttpUrlSafety.BLOCKED);
    expect(inspectHttpUrl('http://10.0.0.4/admin').safety).toBe(HttpUrlSafety.BLOCKED);
    expect(inspectHttpUrl('http://localhost/internal').safety).toBe(HttpUrlSafety.BLOCKED);
    expect(inspectHttpUrl('file:///etc/passwd').safety).toBe(HttpUrlSafety.BLOCKED);
    expect(inspectHttpUrl('not a url').safety).toBe(HttpUrlSafety.INVALID);
    expect(isBlockedIpAddress('192.168.1.1')).toBe(true);
    expect(isBlockedIpAddress('::1')).toBe(true);
    expect(isBlockedIpAddress('8.8.8.8')).toBe(false);
  });

  it('only treats collected URLs as trusted evidence', () => {
    expect(
      isTrustedSourceUrl('https://example.org/paper', ['https://example.org/paper/']),
    ).toBe(true);
    expect(isTrustedSourceUrl('https://evil.example/hallucinated', ['https://example.org/paper'])).toBe(
      false,
    );
  });
});

describe('selectClaimsForVerification', () => {
  it('keeps important verifiable claims within the analysis budget', () => {
    const claims: ExtractedClaim[] = [
      { ...factualClaim, importance: ClaimImportance.LOW, requiresVerification: true },
      factualClaim,
      {
        text: 'The author prefers this design.',
        type: ClaimType.OPINION,
        importance: ClaimImportance.HIGH,
        requiresVerification: false,
      },
    ];

    expect(selectClaimsForVerification(claims)).toEqual([factualClaim]);
    expect(CLAIM_VERIFICATION_BUDGET).toBe(8);
  });
});

describe('scoreResearchAnalysis', () => {
  it('does not punish an opinion article for missing citations', () => {
    const empty = preprocessArticle({
      title: 'A view',
      abstract: 'Opinion',
      content: 'In my view the policy is incomplete.',
      contentHash: 'c'.repeat(64),
      language: 'en',
    });
    const opinion = scoreResearchAnalysis({
      articleType: ArticleType.OPINION,
      preprocessed: empty,
      claims: [],
      collectedSources: [],
      citationChecks: [],
      claimEvaluations: [],
    });
    const research = scoreResearchAnalysis({
      articleType: ArticleType.RESEARCH,
      preprocessed: empty,
      claims: [],
      collectedSources: [],
      citationChecks: [],
      claimEvaluations: [],
    });

    const opinionCitation = opinion.metrics.find(
      (metric) => metric.metricType === MetricType.CITATION_QUALITY,
    );
    const researchCitation = research.metrics.find(
      (metric) => metric.metricType === MetricType.CITATION_QUALITY,
    );

    expect(opinionCitation?.score).toBeGreaterThan(researchCitation?.score ?? 0);
    expect(opinion).not.toHaveProperty('overallScore');
  });

  it('treats unverified claims as unverified, not false', () => {
    const result = scoreResearchAnalysis({
      articleType: ArticleType.RESEARCH,
      preprocessed,
      claims: [factualClaim],
      collectedSources: [],
      citationChecks: [],
      claimEvaluations: [
        {
          claimText: factualClaim.text,
          status: ClaimVerificationStatus.UNVERIFIED,
          relation: ClaimSourceRelation.UNCERTAIN,
          sourceUrl: null,
          notes: 'No web evidence was collected.',
        },
      ],
    });
    const factual = result.metrics.find((metric) => metric.metricType === MetricType.FACTUAL_RELIABILITY);

    expect(factual?.score).toBeGreaterThanOrEqual(50);
    expect(factual?.score).toBeLessThan(70);
    expect(factual?.explanation).toMatch(/unverified/i);
    expect(factual?.explanation).toMatch(/not classified as false/i);
  });

  it('ignores hallucinated source URLs and does not treat them as evidence', () => {
    const trusted = {
      url: 'https://example.org/methods',
      title: 'Methods note',
      sourceType: SourceType.WEB,
    };
    const withTrusted = scoreResearchAnalysis({
      articleType: ArticleType.RESEARCH,
      preprocessed,
      claims: [factualClaim],
      collectedSources: [trusted],
      citationChecks: [
        {
          citation: 'https://example.org/methods',
          url: 'https://example.org/methods',
          doi: null,
          status: CitationVerificationStatus.PARTIALLY_VERIFIED,
          title: 'Methods note',
          publisher: null,
          blocked: false,
        },
      ],
      claimEvaluations: [
        {
          claimText: factualClaim.text,
          status: ClaimVerificationStatus.SUPPORTED,
          relation: ClaimSourceRelation.SUPPORTS,
          sourceUrl: trusted.url,
          notes: 'Matches a collected source.',
        },
      ],
    });
    const hallucinated = scoreResearchAnalysis({
      articleType: ArticleType.RESEARCH,
      preprocessed,
      claims: [factualClaim],
      collectedSources: [trusted],
      citationChecks: [
        {
          citation: 'https://example.org/methods',
          url: 'https://example.org/methods',
          doi: null,
          status: CitationVerificationStatus.PARTIALLY_VERIFIED,
          title: 'Methods note',
          publisher: null,
          blocked: false,
        },
      ],
      claimEvaluations: [
        {
          claimText: factualClaim.text,
          status: ClaimVerificationStatus.SUPPORTED,
          relation: ClaimSourceRelation.SUPPORTS,
          sourceUrl: 'https://invented.example/not-real',
          notes: 'Model invented a URL.',
        },
      ],
    });

    const trustedEvidence = withTrusted.metrics.find((metric) => metric.metricType === MetricType.EVIDENCE);
    const hallucinatedEvidence = hallucinated.metrics.find(
      (metric) => metric.metricType === MetricType.EVIDENCE,
    );
    const trustedFactual = withTrusted.metrics.find(
      (metric) => metric.metricType === MetricType.FACTUAL_RELIABILITY,
    );
    const hallucinatedFactual = hallucinated.metrics.find(
      (metric) => metric.metricType === MetricType.FACTUAL_RELIABILITY,
    );

    expect(trustedEvidence?.score).toBeGreaterThan(hallucinatedEvidence?.score ?? 0);
    expect(trustedFactual?.score).toBeGreaterThan(hallucinatedFactual?.score ?? 0);
    expect(
      hallucinated.evidence.some(
        (item) => item.evidenceType === AnalysisEvidenceType.REJECTED_UNTRUSTED_URL,
      ),
    ).toBe(true);
    expect(hallucinated.evidence.every((item) => item.sourceUrl !== 'https://invented.example/not-real')).toBe(
      true,
    );
    expect(hallucinated.sources.every((source) => source.url !== 'https://invented.example/not-real')).toBe(
      true,
    );
  });

  it('does not persist SSRF-blocked citation URLs as trusted sources', () => {
    const result = scoreResearchAnalysis({
      articleType: ArticleType.NEWS,
      preprocessed,
      claims: [factualClaim],
      collectedSources: [],
      citationChecks: [
        {
          citation: 'http://127.0.0.1/secret',
          url: 'http://127.0.0.1/secret',
          doi: null,
          status: CitationVerificationStatus.SUSPICIOUS,
          title: null,
          publisher: null,
          blocked: true,
        },
      ],
      claimEvaluations: [],
    });

    expect(result.sources).toEqual([]);
    expect(
      result.evidence.some((item) => item.evidenceType === AnalysisEvidenceType.SSRF_BLOCKED_URL),
    ).toBe(true);
    expect(result.evidence.every((item) => item.sourceUrl !== 'http://127.0.0.1/secret')).toBe(true);
  });
});

describe('SourceReference', () => {
  it('records a collected source bound to an analysis run', () => {
    const source = SourceReference.record({
      id: asSourceReferenceId('source-1'),
      articleId: asArticleId('article-1'),
      analysisRunId: asAnalysisRunId('run-1'),
      url: 'https://example.org/methods',
      title: 'Methods note',
      publisher: null,
      doi: null,
      sourceType: SourceType.WEB,
      verificationStatus: CitationVerificationStatus.PARTIALLY_VERIFIED,
      reliabilityScore: Score.from(70),
      createdAt: NOW,
    });

    expect(source.isBoundTo(asAnalysisRunId('run-1'))).toBe(true);
    expect(() =>
      SourceReference.record({
        id: asSourceReferenceId('source-2'),
        articleId: asArticleId('article-1'),
        analysisRunId: asAnalysisRunId('run-1'),
        url: 'not-a-url',
        title: 'Bad',
        publisher: null,
        doi: null,
        sourceType: SourceType.WEB,
        verificationStatus: CitationVerificationStatus.UNVERIFIED,
        reliabilityScore: null,
        createdAt: NOW,
      }),
    ).toThrow(InvalidSourceReferenceError);
  });
});

describe('ArticleEvaluationPolicy research expectations', () => {
  it('expects citations for research and review, not for opinion', () => {
    expect(ArticleEvaluationPolicy.forType(ArticleType.RESEARCH).research.requiresCitations).toBe(true);
    expect(ArticleEvaluationPolicy.forType(ArticleType.REVIEW).research.requiresCitations).toBe(true);
    expect(ArticleEvaluationPolicy.forType(ArticleType.OPINION).research.requiresCitations).toBe(false);
  });
});
