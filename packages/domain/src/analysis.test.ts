import { describe, expect, it } from 'vitest';
import { AnalysisJob } from './analysis-job';
import { AnalysisRun } from './analysis-run';
import { AnalysisJobStatus, AnalysisRunStatus, AuthorshipClassification } from './enums';
import { InvalidAnalysisJobStateError, InvalidAnalysisRunStateError } from './errors';
import {
  asAnalysisJobId,
  asAnalysisRunId,
  asArticleId,
  asArticleVersionId,
  asScoreSnapshotId,
} from './ids';
import { Score } from './score';
import { ScoreSnapshot } from './score-snapshot';

const NOW = new Date('2026-08-29T12:00:00.000Z');
const LATER = new Date('2026-08-29T13:00:00.000Z');

describe('AnalysisJob', () => {
  it('starts, completes, and stays bound to an article version', () => {
    const job = AnalysisJob.enqueue({
      id: asAnalysisJobId('job-1'),
      articleId: asArticleId('article-1'),
      articleVersionId: asArticleVersionId('version-1'),
      now: NOW,
    });

    expect(job.status).toBe(AnalysisJobStatus.QUEUED);
    expect(job.attemptCount).toBe(0);

    const running = job.start(LATER);
    expect(running.status).toBe(AnalysisJobStatus.RUNNING);
    expect(running.attemptCount).toBe(1);
    expect(running.startedAt).toEqual(LATER);

    const completed = running.complete(LATER);
    expect(completed.status).toBe(AnalysisJobStatus.COMPLETED);
    expect(completed.isBoundTo(asArticleVersionId('version-1'))).toBe(true);
    expect(() => completed.retry(LATER)).toThrow(InvalidAnalysisJobStateError);
  });

  it('increments attempts across fail and retry', () => {
    const failed = AnalysisJob.enqueue({
      id: asAnalysisJobId('job-2'),
      articleId: asArticleId('article-1'),
      articleVersionId: asArticleVersionId('version-1'),
      now: NOW,
    })
      .start(NOW)
      .fail('provider timeout', LATER);

    expect(failed.status).toBe(AnalysisJobStatus.FAILED);
    expect(failed.failureReason).toBe('provider timeout');
    expect(failed.attemptCount).toBe(1);

    const retried = failed.retry(LATER).start(LATER);
    expect(retried.status).toBe(AnalysisJobStatus.RUNNING);
    expect(retried.attemptCount).toBe(2);
    expect(retried.failureReason).toBeNull();
  });

  it('requires a failure reason', () => {
    const running = AnalysisJob.enqueue({
      id: asAnalysisJobId('job-3'),
      articleId: asArticleId('article-1'),
      articleVersionId: asArticleVersionId('version-1'),
      now: NOW,
    }).start(NOW);

    expect(() => running.fail('   ', LATER)).toThrow(InvalidAnalysisJobStateError);
  });
});

describe('AnalysisRun', () => {
  it('records pipeline versions and usage on completion', () => {
    const run = AnalysisRun.start({
      id: asAnalysisRunId('run-1'),
      articleId: asArticleId('article-1'),
      articleVersionId: asArticleVersionId('version-1'),
      pipelineVersion: 'pipeline-1',
      promptVersion: 'prompt-1',
      modelProvider: 'fake',
      modelName: 'deterministic',
      now: NOW,
    });

    expect(run.status).toBe(AnalysisRunStatus.RUNNING);

    const completed = run.complete({ tokenUsage: 1200, estimatedCost: 0.04, now: LATER });
    expect(completed.status).toBe(AnalysisRunStatus.COMPLETED);
    expect(completed.tokenUsage).toBe(1200);
    expect(completed.estimatedCost).toBe(0.04);
    expect(completed.isBoundTo(asArticleVersionId('version-1'))).toBe(true);
  });

  it('rejects negative usage and completed-run mutation', () => {
    const run = AnalysisRun.start({
      id: asAnalysisRunId('run-2'),
      articleId: asArticleId('article-1'),
      articleVersionId: asArticleVersionId('version-1'),
      pipelineVersion: 'pipeline-1',
      promptVersion: 'prompt-1',
      modelProvider: 'fake',
      modelName: 'deterministic',
      now: NOW,
    });

    expect(() => run.complete({ tokenUsage: -1, estimatedCost: 0, now: LATER })).toThrow(
      InvalidAnalysisRunStateError,
    );

    const completed = run.complete({ tokenUsage: 1, estimatedCost: 0, now: LATER });
    expect(() => completed.fail(LATER)).toThrow(InvalidAnalysisRunStateError);
  });
});

describe('ScoreSnapshot', () => {
  it('captures scores bound to an article version and policy version', () => {
    const snapshot = ScoreSnapshot.capture({
      id: asScoreSnapshotId('snap-1'),
      articleId: asArticleId('article-1'),
      articleVersionId: asArticleVersionId('version-1'),
      analysisRunId: asAnalysisRunId('run-1'),
      qualityScore: Score.from(82),
      authorshipRisk: Score.from(10),
      authorshipConfidence: Score.from(70),
      authorshipIntegrity: Score.from(90),
      authorshipClassification: AuthorshipClassification.VERY_LOW,
      overallScore: Score.from(83.2),
      scoringPolicyVersion: 'v1',
      createdAt: NOW,
    });

    expect(snapshot.isBoundTo(asArticleVersionId('version-1'))).toBe(true);
    expect(snapshot.isBoundTo(asArticleVersionId('version-2'))).toBe(false);
    expect(snapshot.scoringPolicyVersion).toBe('v1');
    expect(snapshot.overallScore.value).toBe(83.2);
  });
});
