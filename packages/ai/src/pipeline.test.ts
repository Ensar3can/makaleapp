import { describe, expect, it } from 'vitest';
import { ArticleType, MetricType } from '@aip/domain';
import { ArticleAnalysisPipeline } from './article-analysis-pipeline';
import { createFakeAnalysisPipeline, toAnalyzerOutcome } from './create-content-analysis-pipeline';
import { FakeAIAuthorshipDetector } from './fake-ai-authorship-detector';
import { FakeAIProvider } from './fake-ai-provider';
import { OpenAICompatibleProvider } from './openai-compatible-provider';
import { UNTRUSTED_DATA_PREAMBLE } from './prompts';
import { createFoundationPromptRegistry, InMemoryPromptRegistry } from './prompt-registry';
import { StructuredOutputValidator } from './structured-output-validator';
import { articleTypeOutputSchema } from './schemas';
import { InMemoryUsageTracker } from './usage-tracker';

const SAMPLE = {
  title: 'Queued Analysis',
  abstract: 'Abstract',
  content: 'This methods section explains how evaluation binds to a version in 2025.',
  contentHash: 'a'.repeat(64),
  language: 'en',
  categories: ['Computer Science'],
  tags: ['evaluation'],
} as const;

describe('PromptRegistry and StructuredOutputValidator', () => {
  it('serves versioned content-analysis prompts that treat article text as data', () => {
    const registry = createFoundationPromptRegistry();
    const typePrompt = registry.get('article-type-v1');

    expect(typePrompt.version).toBe('v2');
    expect(typePrompt.system).toContain(UNTRUSTED_DATA_PREAMBLE);
    expect(registry.list()).toHaveLength(7);
    expect(() => registry.get('missing-prompt')).toThrow(/not registered/);
  });

  it('rejects invalid AI JSON instead of inventing fields', () => {
    const validator = new StructuredOutputValidator();

    expect(() => validator.validate({ invalid: true }, articleTypeOutputSchema)).toThrow(
      /did not match the required schema/,
    );
  });
});

describe('ArticleAnalysisPipeline', () => {
  it('is deterministic for the same article version input', async () => {
    const first = await createFakeAnalysisPipeline().run(SAMPLE);
    const second = await createFakeAnalysisPipeline().run(SAMPLE);

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.stageCount).toBe(7);
      expect(first.modelProvider).toBe('fake');
      expect(first.pipelineVersion).toBe('analysis-pipeline-score-1');
      expect(first.promptVersion).toBe('prompt-bundle-authorship-1');
      expect(first.metrics).toHaveLength(8);
      expect(first.metrics.map((metric) => metric.metricType)).toEqual([
        MetricType.STRUCTURE,
        MetricType.CONTENT_QUALITY,
        MetricType.TOPIC_RELEVANCE,
        MetricType.CITATION_QUALITY,
        MetricType.EVIDENCE,
        MetricType.FACTUAL_RELIABILITY,
        MetricType.ORIGINALITY,
        MetricType.AI_AUTHORSHIP_RISK,
      ]);
      expect(first.authorship.explanation).toMatch(/not a verdict/i);
      expect(first.authorship.classification).toBeDefined();
      expect(first).not.toHaveProperty('overallScore');
      expect(first).not.toHaveProperty('qualityScore');
    }
  });

  it('records usage for every structured stage and maps to analyzer metadata', async () => {
    const usage = new InMemoryUsageTracker();
    const pipeline = createFakeAnalysisPipeline({ usage });
    const result = await pipeline.run(SAMPLE);
    const outcome = toAnalyzerOutcome(result);

    expect(usage.list()).toHaveLength(7);
    expect(usage.totals().callCount).toBe(7);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.tokenUsage).toBe(usage.totals().tokenUsage);
      expect(outcome.estimatedCost).toBe(0);
      expect(outcome.usageRecords).toHaveLength(7);
      expect(outcome.metrics).toHaveLength(8);
      expect(outcome).not.toHaveProperty('overallScore');
    }
  });

  it('fails closed when the provider returns invalid JSON', async () => {
    const pipeline = createFakeAnalysisPipeline({
      provider: new FakeAIProvider({ invalidPromptIds: ['article-structure-v1'] }),
    });
    const result = await pipeline.run(SAMPLE);

    expect(result).toEqual({
      ok: false,
      reason: 'AI output did not match the required schema',
      retryable: false,
    });
  });

  it('surfaces retryable provider failures without inventing a score', async () => {
    const pipeline = createFakeAnalysisPipeline({
      provider: new FakeAIProvider({
        failure: { reason: 'temporary provider timeout', retryable: true, times: 1 },
      }),
    });
    const result = await pipeline.run(SAMPLE);

    expect(result).toEqual({
      ok: false,
      reason: 'temporary provider timeout',
      retryable: true,
    });
    expect(result).not.toHaveProperty('overallScore');
  });

  it('invokes research and authorship ports without treating hits as trusted evidence', async () => {
    const searches: string[] = [];
    const usage = new InMemoryUsageTracker();
    const pipeline = new ArticleAnalysisPipeline({
      provider: new FakeAIProvider(),
      research: {
        search: async (query) => {
          searches.push(query);
          return [{ url: 'https://fake.research.local/probe', title: 'Untrusted probe' }];
        },
        lookup: async (url) => ({ url, exists: false, blocked: false }),
      },
      authorship: new FakeAIAuthorshipDetector(),
      prompts: new InMemoryPromptRegistry(),
      usage,
    });

    const result = await pipeline.run(SAMPLE);

    expect(searches.length).toBeGreaterThan(0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.researchHits).toBe(0);
      expect(result.sources).toEqual([]);
      expect(result.authorship.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.authorship.riskScore).toBeLessThanOrEqual(100);
      expect(result.authorship.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.authorship.confidenceScore).toBeLessThanOrEqual(100);
      expect(result.authorship.explanation).toMatch(/not a verdict/i);
      expect(result.metrics.some((metric) => metric.metricType === MetricType.AI_AUTHORSHIP_RISK)).toBe(
        true,
      );
      expect(result.evidence.every((item) => !item.evidence.includes('https://fake.research.local'))).toBe(
        true,
      );
      expect(result.evidence.every((item) => item.sourceUrl !== 'https://fake.research.local/probe')).toBe(
        true,
      );
    }
  });

  it('does not punish an opinion article for missing methods', async () => {
    const missingMethods = {
      hasIntroduction: true,
      hasConclusion: true,
      hasMethods: false,
      hasReferences: false,
      sectionCount: 2,
      paragraphCoherence: 'adequate',
      argumentProgression: 'adequate',
      abstractRelevance: 'adequate',
      notes: 'Opinion layout without methods.',
    };
    const shared = {
      'article-structure-v1': missingMethods,
      'topic-analysis-v1': {
        detectedTopics: ['policy'],
        titleAbstractAlignment: 'adequate',
        bodyAlignment: 'adequate',
        categoryAlignment: 'adequate',
        possibleCategoryMismatch: false,
        notes: 'Aligned.',
      },
      'quality-analysis-v1': {
        clarity: 'adequate',
        depth: 'adequate',
        argumentCoherence: 'adequate',
        informationalValue: 'adequate',
        repetition: 'low',
        unsupportedAssertions: 'low',
        internalContradictions: 'none',
        notes: 'Substance only.',
      },
    } as const;

    const opinion = await createFakeAnalysisPipeline({
      provider: new FakeAIProvider({
        outputs: {
          ...shared,
          'article-type-v1': {
            articleType: ArticleType.OPINION,
            confidence: 0.8,
            rationale: 'First-person argument.',
          },
        },
      }),
    }).run(SAMPLE);
    const research = await createFakeAnalysisPipeline({
      provider: new FakeAIProvider({
        outputs: {
          ...shared,
          'article-type-v1': {
            articleType: ArticleType.RESEARCH,
            confidence: 0.8,
            rationale: 'Claims to be empirical.',
          },
        },
      }),
    }).run(SAMPLE);

    expect(opinion.ok && research.ok).toBe(true);
    if (opinion.ok && research.ok) {
      const opinionStructure = opinion.metrics.find((metric) => metric.metricType === MetricType.STRUCTURE);
      const researchStructure = research.metrics.find((metric) => metric.metricType === MetricType.STRUCTURE);
      expect(opinionStructure?.score).toBeGreaterThan(researchStructure?.score ?? 0);
    }
  });

  it('drops model-invented source URLs that were not collected by the research provider', async () => {
    const pipeline = createFakeAnalysisPipeline({
      provider: new FakeAIProvider({
        outputs: {
          'fact-evaluation-v1': {
            evaluations: [
              {
                claimText: 'The article states a measurable or dated finding that can be checked.',
                status: 'SUPPORTED',
                relation: 'supports',
                sourceUrl: 'https://invented.example/not-real',
                notes: 'Hallucinated URL.',
              },
            ],
            notes: 'Forced untrusted URL.',
          },
        },
      }),
      research: {
        search: async () => [{ url: 'https://example.org/paper', title: 'Collected paper' }],
        lookup: async (url) => ({ url, exists: true, blocked: false, title: 'Collected paper' }),
      },
    });
    const result = await pipeline.run(SAMPLE);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sources.some((source) => source.url === 'https://example.org/paper')).toBe(true);
      expect(result.sources.every((source) => source.url !== 'https://invented.example/not-real')).toBe(true);
      expect(
        result.evidence.every((item) => item.sourceUrl !== 'https://invented.example/not-real'),
      ).toBe(true);
      expect(result.evidence.some((item) => item.evidenceType === 'rejected-untrusted-url')).toBe(true);
    }
  });

  it('persists ensemble authorship risk without a binary verdict', async () => {
    const templated = await createFakeAnalysisPipeline().run({
      ...SAMPLE,
      content: [
        'Furthermore it is important to note that the system is useful.',
        'Moreover it is important to note that the system is useful.',
        'Furthermore it is important to note that the system is useful.',
        'Moreover it is important to note that the system is useful.',
        'In conclusion it is important to note that the system is useful.',
      ].join(' '),
    });
    const varied = await createFakeAnalysisPipeline().run({
      ...SAMPLE,
      content: [
        'I kept missing the bus that week. Why?',
        'The schedule changed on Tuesday — nobody posted a notice.',
        "Later, after a long walk past the river, I found a handwritten sign taped to a lamppost.",
        "I don't think anyone planned that detour.",
      ].join(' '),
    });

    expect(templated.ok && varied.ok).toBe(true);
    if (templated.ok && varied.ok) {
      const templatedRisk = templated.metrics.find(
        (metric) => metric.metricType === MetricType.AI_AUTHORSHIP_RISK,
      );
      const variedRisk = varied.metrics.find((metric) => metric.metricType === MetricType.AI_AUTHORSHIP_RISK);

      expect(templatedRisk?.score).toBeGreaterThan(variedRisk?.score ?? 0);
      expect(templated.authorship.explanation).toMatch(/not a verdict/i);
      expect(templated.authorship.explanation).not.toMatch(/AI-written|human-written/i);
      expect(templated.evidence.some((item) => item.evidenceType === 'authorship-disclaimer')).toBe(true);
      expect(templated.evidence.some((item) => item.evidenceType === 'authorship-detector-output')).toBe(
        true,
      );
      expect(templated).not.toHaveProperty('overallScore');
      expect(templated.metrics.some((metric) => metric.metricType === MetricType.ORIGINALITY)).toBe(true);
    }
  });
});

describe('OpenAICompatibleProvider', () => {
  it('posts a JSON-mode completion and parses structured output', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const provider = new OpenAICompatibleProvider({
      apiKey: 'test-key',
      baseUrl: 'https://api.example.test/v1',
      model: 'gpt-test',
      fetchImpl: (async (url, init) => {
        calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
        return new Response(
          JSON.stringify({
            model: 'gpt-test',
            choices: [{ message: { content: JSON.stringify({ articleType: 'essay', confidence: 0.4, rationale: 'ok' }) } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }) as typeof fetch,
    });

    const result = await provider.analyzeStructured({
      promptId: 'article-type-v1',
      promptVersion: 'v2',
      system: 'Return JSON.',
      userTemplate: 'Classify the article.',
      input: { title: 'T', contentHash: 'c'.repeat(64) },
    });

    expect(calls[0]?.url).toBe('https://api.example.test/v1/chat/completions');
    const userContent = JSON.stringify(calls[0]?.body);
    expect(userContent).toContain('<<<UNTRUSTED_ARTICLE_DATA>>>');
    expect(userContent).toContain('<<<END_UNTRUSTED_ARTICLE_DATA>>>');
    expect(result.modelProvider).toBe('openai-compatible');
    expect(result.value).toEqual({ articleType: 'essay', confidence: 0.4, rationale: 'ok' });
    expect(result.usage.inputTokens).toBe(10);
    expect(result.usage.outputTokens).toBe(5);
  });

  it('marks HTTP 429 as retryable and does not invent a score', async () => {
    const provider = new OpenAICompatibleProvider({
      apiKey: 'test-key',
      baseUrl: 'https://api.example.test/v1',
      model: 'gpt-test',
      fetchImpl: (async () => new Response('busy', { status: 429 })) as typeof fetch,
    });

    await expect(
      provider.analyzeStructured({
        promptId: 'article-type-v1',
        promptVersion: 'v2',
        system: 'Return JSON.',
        userTemplate: 'Classify.',
        input: {},
      }),
    ).rejects.toMatchObject({ message: 'AI provider returned HTTP 429', retryable: true });
  });
});
