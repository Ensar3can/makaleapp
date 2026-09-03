import { AIProviderError } from './errors';
import { inferFakeAuthorshipSignals } from './model-authorship-detector';
import { stableInt, stablePick } from './stable-hash';
import type { AIProvider, RawStructuredAnalysis, StructuredAnalysisRequest } from './types';

const ARTICLE_TYPES = [
  'research',
  'technical',
  'opinion',
  'review',
  'educational',
  'news',
  'essay',
  'other',
] as const;

const QUALITATIVE = ['weak', 'adequate', 'strong'] as const;
const BURDEN = ['low', 'moderate', 'high'] as const;

export interface FakeAIProviderOptions {
  readonly invalidPromptIds?: readonly string[];
  readonly failure?: { readonly reason: string; readonly retryable: boolean; readonly times: number };
  readonly outputs?: Readonly<Record<string, unknown>>;
}

export class FakeAIProvider implements AIProvider {
  public static readonly identity = {
    modelProvider: 'fake',
    modelName: 'deterministic',
  } as const;

  private failureCount = 0;

  public constructor(private readonly options: FakeAIProviderOptions = {}) {}

  public async analyzeStructured(request: StructuredAnalysisRequest): Promise<RawStructuredAnalysis> {
    if (this.options.failure && this.failureCount < this.options.failure.times) {
      this.failureCount += 1;
      throw new AIProviderError(this.options.failure.reason, this.options.failure.retryable);
    }

    const seed = `${request.promptId}:${serializeInput(request.input)}`;
    const usage = {
      inputTokens: stableInt(`${seed}:in`, 12, 48),
      outputTokens: stableInt(`${seed}:out`, 8, 24),
      estimatedCost: 0,
      latencyMs: 0,
    };

    if (this.options.invalidPromptIds?.includes(request.promptId)) {
      return {
        value: { invalid: true },
        ...FakeAIProvider.identity,
        usage,
      };
    }

    return {
      value: this.options.outputs?.[request.promptId] ?? buildDeterministicOutput(request.promptId, seed, request.input),
      ...FakeAIProvider.identity,
      usage,
    };
  }
}

function serializeInput(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input === 'string') {
    return input;
  }

  if (typeof input === 'object' && 'contentHash' in input && typeof input.contentHash === 'string') {
    return input.contentHash;
  }

  return JSON.stringify(input);
}

function buildDeterministicOutput(promptId: string, seed: string, input: unknown): unknown {
  const text = collectText(input);

  switch (promptId) {
    case 'article-type-v1':
      return {
        articleType: inferArticleType(text, seed),
        confidence: 0.72,
        rationale: 'Deterministic fake classification from title and body cues.',
      };
    case 'article-structure-v1':
      return {
        hasIntroduction: /introduction/i.test(text),
        hasConclusion: /conclusion/i.test(text),
        hasMethods: /methods?/i.test(text),
        hasReferences: /references?|bibliography/i.test(text),
        sectionCount: stableInt(seed, 2, 6),
        paragraphCoherence: stablePick(seed, QUALITATIVE),
        argumentProgression: 'adequate',
        abstractRelevance: 'adequate',
        notes: 'Deterministic fake structure observations. Not a numeric score.',
      };
    case 'topic-analysis-v1':
      return {
        detectedTopics: ['content-analysis', 'article-versions'],
        titleAbstractAlignment: 'adequate',
        bodyAlignment: 'adequate',
        categoryAlignment: 'adequate',
        possibleCategoryMismatch: false,
        notes: 'Deterministic fake topic observations. Domain computes relevance.',
      };
    case 'quality-analysis-v1':
      return {
        clarity: 'adequate',
        depth: stablePick(`${seed}:depth`, QUALITATIVE),
        argumentCoherence: 'adequate',
        informationalValue: 'adequate',
        repetition: stablePick(`${seed}:rep`, BURDEN),
        unsupportedAssertions: 'low',
        internalContradictions: 'none',
        notes: 'Deterministic fake quality observations. Grammar is not the driver.',
      };
    case 'authorship-analysis-v1':
      return {
        signals: inferFakeAuthorshipSignals(text),
        notes: 'Deterministic fake authorship signals. Not a binary verdict.',
      };
    case 'claim-extraction-v1':
      return buildClaimExtraction(text);
    case 'fact-evaluation-v1':
      return buildFactEvaluation(input);
    default:
      return { notes: 'Deterministic fake output for an unregistered probe.' };
  }
}

function inferArticleType(text: string, seed: string): (typeof ARTICLE_TYPES)[number] {
  if (/methods?|hypothesis|experiment/i.test(text)) {
    return 'research';
  }

  if (/in my (view|opinion)|i argue/i.test(text)) {
    return 'opinion';
  }

  return stablePick(seed, ARTICLE_TYPES);
}

function collectText(input: unknown): string {
  if (typeof input !== 'object' || input === null) {
    return '';
  }

  const record = input as Record<string, unknown>;
  return [record.title, record.abstract, record.content].filter((value) => typeof value === 'string').join('\n');
}

function buildClaimExtraction(text: string): unknown {
  const factual = /reduced|percent|%|\d{4}|doi|https?:\/\//i.test(text);

  return {
    claims: factual
      ? [
          {
            text: 'The article states a measurable or dated finding that can be checked.',
            type: 'factual',
            importance: 'high',
            requiresVerification: true,
          },
        ]
      : [
          {
            text: 'The article presents an interpretive position on its topic.',
            type: 'interpretive',
            importance: 'low',
            requiresVerification: false,
          },
        ],
    notes: 'Deterministic fake claim extraction. URLs are not invented here.',
  };
}

function buildFactEvaluation(input: unknown): unknown {
  const record = input as { claims?: Array<{ text: string }>; collectedSources?: Array<{ url: string }> };
  const claims = Array.isArray(record.claims) ? record.claims : [];
  const sources = Array.isArray(record.collectedSources) ? record.collectedSources : [];
  const firstSource = sources[0]?.url ?? null;

  return {
    evaluations: claims.map((claim) => ({
      claimText: claim.text,
      status: firstSource ? 'PARTIALLY_SUPPORTED' : 'UNVERIFIED',
      relation: firstSource ? 'supports' : 'uncertain',
      sourceUrl: firstSource,
      notes: firstSource
        ? 'Deterministic fake evaluation bound to a collected source.'
        : 'Deterministic fake evaluation. No collected source, so the claim stays unverified.',
    })),
    notes: 'Deterministic fake fact evaluation. Never invents URLs.',
  };
}
