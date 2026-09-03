import { describe, expect, it } from 'vitest';
import { AiUsageRecord } from './ai-usage-record';
import { OperationalEventKind } from './enums';
import { InvalidAiUsageRecordError, InvalidOperationalEventError } from './errors';
import { asAiUsageRecordId, asAnalysisRunId, asOperationalEventId } from './ids';
import {
  analysisDurationMs,
  assembleObservabilityDashboard,
  averageOrNull,
  ratioOrNull,
  startOfUtcDay,
  startOfUtcMonth,
} from './observability';
import { OperationalEvent, sanitizeOperationalMessage } from './operational-event';

const NOW = new Date('2026-08-30T18:30:00.000Z');

describe('AiUsageRecord', () => {
  it('records per-stage tokens and cost', () => {
    const record = AiUsageRecord.record({
      id: asAiUsageRecordId('usage-1'),
      analysisRunId: asAnalysisRunId('run-1'),
      provider: 'fake',
      model: 'deterministic',
      promptId: 'article-type-v1',
      promptVersion: 'v2',
      inputTokens: 12,
      outputTokens: 8,
      estimatedCost: 0.01,
      latencyMs: 40,
      recordedAt: NOW,
    });

    expect(record.totalTokens).toBe(20);
    expect(() =>
      AiUsageRecord.record({
        id: asAiUsageRecordId('usage-2'),
        analysisRunId: asAnalysisRunId('run-1'),
        provider: 'fake',
        model: 'deterministic',
        promptId: 'article-type-v1',
        promptVersion: 'v2',
        inputTokens: -1,
        outputTokens: 0,
        estimatedCost: 0,
        latencyMs: 0,
        recordedAt: NOW,
      }),
    ).toThrow(InvalidAiUsageRecordError);
  });
});

describe('OperationalEvent', () => {
  it('redacts secret-bearing messages and requires a kind', () => {
    const event = OperationalEvent.record({
      id: asOperationalEventId('event-1'),
      kind: OperationalEventKind.API_ERROR,
      requestId: 'req-1',
      status: '500',
      message: 'password=hunter2 leaked',
      createdAt: NOW,
    });

    expect(event.message).toBe('[redacted]');
    expect(sanitizeOperationalMessage('worker lease expired')).toBe('worker lease expired');
    expect(() =>
      OperationalEvent.record({
        id: asOperationalEventId('event-2'),
        kind: 'not-a-kind',
        status: 'failed',
        message: 'boom',
        createdAt: NOW,
      }),
    ).toThrow(InvalidOperationalEventError);
  });
});

describe('observability dashboard assembly', () => {
  it('computes rates and averages from persisted counts, not scores', () => {
    const dashboard = assembleObservabilityDashboard(NOW, {
      jobsQueued: 2,
      jobsRunning: 1,
      jobsFailed: 1,
      jobsCompleted: 3,
      completedDurationsMs: [1000, 3000],
      completedRunCount: 3,
      failedRunCount: 1,
      tokenUsageSum: 300,
      tokenUsageCount: 3,
      costToday: 0.4,
      costThisMonth: 1.2,
      costCompletedSum: 0.9,
      costCompletedCount: 3,
      articlesRequiringReview: 4,
      aiProviderFailureCount: 1,
      expensiveStages: [{ promptId: 'fact-evaluation-v1', totalCost: 0.5, callCount: 3 }],
      recentErrors: [],
      workerHeartbeatAt: NOW,
    });

    expect(dashboard.analysisSuccessRate).toBe(0.75);
    expect(dashboard.averageAnalysisDurationMs).toBe(2000);
    expect(dashboard.averageTokensPerArticle).toBe(100);
    expect(dashboard.averageCostPerAnalysis).toBe(0.3);
    expect(dashboard.providerErrorRate).toBe(0.25);
    expect(dashboard.aiCostToday).toBe(0.4);
    expect(ratioOrNull(1, 0)).toBeNull();
    expect(averageOrNull([])).toBeNull();
    expect(analysisDurationMs(NOW, new Date(NOW.getTime() + 500))).toBe(500);
    expect(startOfUtcDay(NOW).toISOString()).toBe('2026-08-30T00:00:00.000Z');
    expect(startOfUtcMonth(NOW).toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });
});
