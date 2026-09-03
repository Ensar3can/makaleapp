import { describe, expect, it } from 'vitest';
import { AnalysisEvidence } from './analysis-evidence';
import { Article } from './article';
import { ArticleVersion } from './article-version';
import { ContentHash } from './content-hash';
import {
  AnalysisEvidenceType,
  ArticleStatus,
  CitationVerificationStatus,
  ClaimImportance,
  ClaimVerificationStatus,
  MetricType,
  ModerationFlagCode,
  SourceType,
} from './enums';
import { asAnalysisEvidenceId, asAnalysisRunId, asArticleId, asArticleVersionId, asScoreSnapshotId, asSourceReferenceId, asUserId } from './ids';
import { evaluateModerationFlags } from './moderation-flag';
import { Score } from './score';
import { ScoreSnapshot } from './score-snapshot';
import { ScoringPolicy } from './scoring-policy';
import { Slug } from './slug';
import { SourceReference } from './source-reference';

const NOW = new Date('2026-08-30T16:00:00.000Z');
const POLICY = ScoringPolicy.initial();
const RUN_ID = asAnalysisRunId('run-1');

function hash(char: string): ContentHash {
  return ContentHash.from(char.repeat(64));
}

function version(content: string, title = 'A methods note'): ArticleVersion {
  return ArticleVersion.create({
    id: asArticleVersionId('version-1'),
    articleId: asArticleId('article-1'),
    versionNumber: 1,
    title,
    abstract: 'Abstract',
    content,
    contentHash: hash('a'),
    createdAt: NOW,
  });
}

function snapshot(input: { risk: number; confidence: number }): ScoreSnapshot {
  const computed = POLICY.evaluate({
    metrics: {
      structure: Score.from(80),
      contentQuality: Score.from(80),
      topicRelevance: Score.from(80),
      citationQuality: Score.from(80),
      evidence: Score.from(80),
      factualReliability: Score.from(80),
      originality: Score.from(80),
    },
    authorshipRisk: Score.from(input.risk),
    authorshipConfidence: Score.from(input.confidence),
  });

  return ScoreSnapshot.fromComputed({
    id: asScoreSnapshotId('snap-1'),
    articleId: asArticleId('article-1'),
    articleVersionId: asArticleVersionId('version-1'),
    analysisRunId: RUN_ID,
    computed,
    createdAt: NOW,
  });
}

function evidence(input: {
  evidenceType: string;
  claim: string;
  evidence: string;
  metricType?: AnalysisEvidence['metricType'];
}): AnalysisEvidence {
  return AnalysisEvidence.record({
    id: asAnalysisEvidenceId(input.claim),
    analysisRunId: RUN_ID,
    metricType: input.metricType ?? MetricType.FACTUAL_RELIABILITY,
    evidenceType: input.evidenceType,
    claim: input.claim,
    evidence: input.evidence,
    sourceUrl: null,
    sourceTitle: null,
    reliability: null,
    createdAt: NOW,
  });
}

describe('evaluateModerationFlags', () => {
  it('does not flag a complete low-risk snapshot with ordinary body text', () => {
    const flags = evaluateModerationFlags({
      snapshot: snapshot({ risk: 18, confidence: 88 }),
      policy: POLICY,
      evidence: [],
      sources: [],
      version: version('This methods section explains how evaluation binds to a version.'),
      duplicateArticleId: null,
    });

    expect(flags).toEqual([]);
  });

  it('flags high authorship risk only when ensemble confidence meets the policy threshold', () => {
    const flagged = evaluateModerationFlags({
      snapshot: snapshot({ risk: 91, confidence: 80 }),
      policy: POLICY,
      evidence: [],
      sources: [],
      version: version('A thorough methods discussion of sampling bias.'),
      duplicateArticleId: null,
    });
    const ignored = evaluateModerationFlags({
      snapshot: snapshot({ risk: 91, confidence: 20 }),
      policy: POLICY,
      evidence: [],
      sources: [],
      version: version('A thorough methods discussion of sampling bias.'),
      duplicateArticleId: null,
    });

    expect(flagged.map((flag) => flag.code)).toEqual([ModerationFlagCode.HIGH_AI_AUTHORSHIP_RISK]);
    expect(flagged[0]?.summary).toMatch(/risk estimate, not a verdict/i);
    expect(ignored).toEqual([]);
  });

  it('does not treat a single detector-like elevated classification as high risk', () => {
    const flags = evaluateModerationFlags({
      snapshot: snapshot({ risk: 70, confidence: 90 }),
      policy: POLICY,
      evidence: [],
      sources: [],
      version: version('Elevated but not high authorship risk stays on the author path.'),
      duplicateArticleId: null,
    });

    expect(flags).toEqual([]);
  });

  it('flags citation manipulation when a source is suspicious', () => {
    const source = SourceReference.record({
      id: asSourceReferenceId('source-1'),
      articleId: asArticleId('article-1'),
      analysisRunId: RUN_ID,
      url: 'https://example.org/paper',
      title: 'Example',
      publisher: null,
      doi: null,
      sourceType: SourceType.WEB,
      verificationStatus: CitationVerificationStatus.SUSPICIOUS,
      reliabilityScore: Score.from(10),
      createdAt: NOW,
    });

    const flags = evaluateModerationFlags({
      snapshot: snapshot({ risk: 18, confidence: 88 }),
      policy: POLICY,
      evidence: [],
      sources: [source],
      version: version('Research methods with a suspicious citation.'),
      duplicateArticleId: null,
    });

    expect(flags.map((flag) => flag.code)).toEqual([ModerationFlagCode.CITATION_MANIPULATION]);
  });

  it('flags multiple important disputed claims and ignores a single dispute', () => {
    const one = [
      evidence({
        evidenceType: AnalysisEvidenceType.EXTRACTED_CLAIM,
        claim: 'Claim A',
        evidence: `type=factual; importance=${ClaimImportance.HIGH}; requiresVerification=true; selected=true`,
      }),
      evidence({
        evidenceType: AnalysisEvidenceType.CLAIM_VERIFICATION,
        claim: 'Claim A',
        evidence: `${ClaimVerificationStatus.DISPUTED}. Sources disagree.`,
      }),
    ];
    const two = [
      ...one,
      evidence({
        evidenceType: AnalysisEvidenceType.EXTRACTED_CLAIM,
        claim: 'Claim B',
        evidence: `type=factual; importance=${ClaimImportance.HIGH}; requiresVerification=true; selected=true`,
      }),
      evidence({
        evidenceType: AnalysisEvidenceType.CLAIM_VERIFICATION,
        claim: 'Claim B',
        evidence: `${ClaimVerificationStatus.DISPUTED}. Sources disagree.`,
      }),
    ];

    expect(
      evaluateModerationFlags({
        snapshot: snapshot({ risk: 18, confidence: 88 }),
        policy: POLICY,
        evidence: one,
        sources: [],
        version: version('One disputed claim is not enough.'),
        duplicateArticleId: null,
      }),
    ).toEqual([]);
    expect(
      evaluateModerationFlags({
        snapshot: snapshot({ risk: 18, confidence: 88 }),
        policy: POLICY,
        evidence: two,
        sources: [],
        version: version('Two important claims are disputed.'),
        duplicateArticleId: null,
      }).map((flag) => flag.code),
    ).toEqual([ModerationFlagCode.DISPUTED_IMPORTANT_CLAIMS]);
  });

  it('flags unsafe content heuristics without rejecting automatically', () => {
    const flags = evaluateModerationFlags({
      snapshot: snapshot({ risk: 18, confidence: 88 }),
      policy: POLICY,
      evidence: [],
      sources: [],
      version: version('A guide that includes bomb-making instructions is not publishable without review.'),
      duplicateArticleId: null,
    });

    expect(flags.map((flag) => flag.code)).toEqual([ModerationFlagCode.UNSAFE_CONTENT]);
  });

  it('flags short commercial spam', () => {
    const flags = evaluateModerationFlags({
      snapshot: snapshot({ risk: 18, confidence: 88 }),
      policy: POLICY,
      evidence: [],
      sources: [],
      version: version('Buy now. Limited offer. Click here for the deal.'),
      duplicateArticleId: null,
    });

    expect(flags.map((flag) => flag.code)).toEqual([ModerationFlagCode.SPAM]);
  });

  it('flags an exact content-hash duplicate of another article', () => {
    const flags = evaluateModerationFlags({
      snapshot: snapshot({ risk: 18, confidence: 88 }),
      policy: POLICY,
      evidence: [],
      sources: [],
      version: version('Otherwise ordinary methods text.'),
      duplicateArticleId: asArticleId('article-2'),
    });

    expect(flags.map((flag) => flag.code)).toEqual([ModerationFlagCode.SUSPICIOUS_DUPLICATE]);
  });
});

describe('Article moderation transitions', () => {
  function analyzed() {
    const draft = Article.draft({
      id: asArticleId('article-1'),
      authorId: asUserId('user-1'),
      versionId: asArticleVersionId('version-1'),
      title: 'An Evaluated Article',
      abstract: 'Abstract',
      content: 'Body of the article.',
      contentHash: hash('a'),
      language: 'en',
      slug: Slug.from('an-evaluated-article'),
      now: NOW,
    });
    const completed = draft.article
      .submit(draft.version, NOW)
      .article.queueForAnalysis(NOW)
      .article.startProcessing(NOW)
      .article.completeAnalysis(NOW).article;

    return { version: draft.version, completed };
  }

  it('flags completed analysis for review and later approves to ready', () => {
    const { completed } = analyzed();
    const flagged = completed.requireReview(NOW).article;
    const approved = flagged.approveFromReview(NOW).article;

    expect(flagged.status).toBe(ArticleStatus.REQUIRES_REVIEW);
    expect(approved.status).toBe(ArticleStatus.READY_FOR_PUBLICATION);
    expect(approved.publishedAt).toBeNull();
  });

  it('restores a previously published article when review is approved', () => {
    const { completed } = analyzed();
    const published = completed.markReadyForPublication(NOW).article.publish(NOW).article;
    const flagged = published.requireReview(NOW).article;
    const restored = flagged.approveFromReview(NOW).article;

    expect(flagged.status).toBe(ArticleStatus.REQUIRES_REVIEW);
    expect(flagged.publishedAt).toEqual(NOW);
    expect(restored.status).toBe(ArticleStatus.PUBLISHED);
  });

  it('returns the article to draft on revision and clears publication', () => {
    const { completed } = analyzed();
    const published = completed.markReadyForPublication(NOW).article.publish(NOW).article;
    const revised = published.requireReview(NOW).article.requestRevision(NOW).article;

    expect(revised.status).toBe(ArticleStatus.DRAFT);
    expect(revised.publishedAt).toBeNull();
  });

  it('rejects from review and leaves public discovery', () => {
    const { completed } = analyzed();
    const published = completed.markReadyForPublication(NOW).article.publish(NOW).article;
    const rejected = published.requireReview(NOW).article.reject(NOW).article;

    expect(rejected.status).toBe(ArticleStatus.REJECTED);
    expect(rejected.publishedAt).toBeNull();
  });
});
