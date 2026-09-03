import {
  AiUsageRecord,
  AnalysisEvidence,
  AnalysisEvidenceType,
  AnalysisJobStatus,
  AnalysisMetric,
  AnalysisRun,
  AnalysisRunStatus,
  ArticleStatus,
  AuditAction,
  AuditLog,
  IncompleteAnalysisScoreError,
  InvalidIdentifierError,
  OperationalEvent,
  OperationalEventKind,
  Score,
  ScoreSnapshot,
  ScoringEngine,
  ScoringPolicy,
  ScoringPolicyNotFoundError,
  SourceReference,
  asAiUsageRecordId,
  asAnalysisEvidenceId,
  asAnalysisJobId,
  asAnalysisMetricId,
  asAnalysisRunId,
  asAuditLogId,
  asOperationalEventId,
  asScoreSnapshotId,
  asSourceReferenceId,
  evaluateModerationFlags,
  isAnalysisCostWithinBudget,
  metricTypeForFlag,
  type AiUsageRecordRepository,
  type AnalysisEvidenceRepository,
  type AnalysisJob,
  type AnalysisJobRepository,
  type AnalysisMetricRepository,
  type AnalysisRunRepository,
  type OperationalEventRepository,
  type Article,
  type ArticleRepository,
  type ArticleTaxonomyRepository,
  type ArticleVersionRepository,
  type AuditLogRepository,
  type CategoryRepository,
  type ScoreSnapshotRepository,
  type ScoringPolicyRepository,
  type SourceReferenceRepository,
  type TagRepository,
} from '@aip/domain';
import { ANALYSIS_JOB_POLICY } from '../analysis-job-policy';
import type { ArticleAnalysisOutcome, ArticleAnalyzer, Clock, IdGenerator } from '../ports';
import type { UseCase } from '../use-case';

export interface ProcessAnalysisJobInput {
  readonly analysisJobId: string;
}

export type ProcessAnalysisJobOutcome = 'completed' | 'failed' | 'retried' | 'ignored';

export interface ProcessAnalysisJobResult {
  readonly outcome: ProcessAnalysisJobOutcome;
  readonly articleStatus: ArticleStatus | null;
  readonly jobStatus: AnalysisJobStatus | null;
}

export class ProcessAnalysisJobUseCase
  implements UseCase<ProcessAnalysisJobInput, ProcessAnalysisJobResult>
{
  public constructor(
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly jobs: AnalysisJobRepository,
    private readonly runs: AnalysisRunRepository,
    private readonly metrics: AnalysisMetricRepository,
    private readonly evidence: AnalysisEvidenceRepository,
    private readonly sources: SourceReferenceRepository,
    private readonly snapshots: ScoreSnapshotRepository,
    private readonly policies: ScoringPolicyRepository,
    private readonly taxonomy: ArticleTaxonomyRepository,
    private readonly categories: CategoryRepository,
    private readonly tags: TagRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly analyzer: ArticleAnalyzer,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly maxCostPerAnalysis = 1,
    private readonly usageRecords: AiUsageRecordRepository | null = null,
    private readonly operationalEvents: OperationalEventRepository | null = null,
  ) {}

  public async execute(input: ProcessAnalysisJobInput): Promise<ProcessAnalysisJobResult> {
    let jobId;

    try {
      jobId = asAnalysisJobId(input.analysisJobId);
    } catch (error) {
      if (error instanceof InvalidIdentifierError) {
        return ignored(null, null);
      }

      throw error;
    }

    const job = await this.jobs.findById(jobId);

    if (!job) {
      return ignored(null, null);
    }

    const now = this.clock.now();
    const article = await this.articles.findById(job.articleId);

    if (!article) {
      return ignored(null, job.status);
    }

    if (job.status === AnalysisJobStatus.COMPLETED || job.status === AnalysisJobStatus.CANCELLED) {
      return ignored(article.status, job.status);
    }

    if (job.status === AnalysisJobStatus.FAILED) {
      return ignored(article.status, job.status);
    }

    if (
      article.currentVersionId !== job.articleVersionId ||
      article.status === ArticleStatus.DRAFT ||
      article.status === ArticleStatus.REMOVED ||
      article.status === ArticleStatus.ARCHIVED
    ) {
      return this.cancelIfActive(job, article, now);
    }

    if (
      article.status === ArticleStatus.ANALYSIS_COMPLETED ||
      article.status === ArticleStatus.REQUIRES_REVIEW ||
      article.status === ArticleStatus.READY_FOR_PUBLICATION ||
      article.status === ArticleStatus.PUBLISHED ||
      article.status === ArticleStatus.REJECTED
    ) {
      return this.completeAlreadyAnalyzed(job, article, now);
    }

    if (job.status === AnalysisJobStatus.RUNNING) {
      if (!isStaleRunning(job, now)) {
        return ignored(article.status, job.status);
      }

      return this.failOrRetry(job, article, 'Worker lease expired', now, false);
    }

    const started = job.start(now);
    const claimed = await this.jobs.saveIfStatus(started, AnalysisJobStatus.QUEUED);

    if (!claimed) {
      return ignored(article.status, job.status);
    }

    let currentArticle = article;

    if (currentArticle.status === ArticleStatus.QUEUED_FOR_ANALYSIS) {
      currentArticle = currentArticle.startProcessing(now).article;
      await this.articles.save(currentArticle);
    }

    if (currentArticle.status !== ArticleStatus.PROCESSING) {
      return this.cancelIfActive(started, currentArticle, now);
    }

    const existingRuns = await this.runs.listByArticleVersionId(started.articleVersionId);
    const completedRun = existingRuns.find((run) => run.status === AnalysisRunStatus.COMPLETED);

    if (completedRun) {
      try {
        await this.persistScoreSnapshot(currentArticle.id, started.articleVersionId, completedRun.id, now);
      } catch (error) {
        if (isNonRetryableScoreError(error)) {
          return this.failOrRetry(started, currentArticle, error.message, now, false);
        }

        throw error;
      }

      return this.finishSuccess(started, currentArticle, now);
    }

    const version = await this.versions.findById(started.articleVersionId);

    if (!version) {
      return this.failOrRetry(started, currentArticle, 'Article version is missing', now, false);
    }

    const labels = await this.loadTaxonomyLabels(currentArticle.id);
    const outcome = await this.analyzer.analyze({
      article: currentArticle,
      version,
      job: started,
      categories: labels.categories,
      tags: labels.tags,
    });

    if (!outcome.ok) {
      return this.failOrRetry(started, currentArticle, outcome.reason, now, outcome.retryable);
    }

    if (!isAnalysisCostWithinBudget(outcome.estimatedCost, this.maxCostPerAnalysis)) {
      return this.failOrRetry(started, currentArticle, 'Analysis exceeded the cost budget', now, false);
    }

    const run = AnalysisRun.start({
      id: asAnalysisRunId(this.ids.next()),
      articleId: currentArticle.id,
      articleVersionId: version.id,
      pipelineVersion: outcome.pipelineVersion,
      promptVersion: outcome.promptVersion,
      modelProvider: outcome.modelProvider,
      modelName: outcome.modelName,
      now,
    }).complete({
      tokenUsage: outcome.tokenUsage,
      estimatedCost: outcome.estimatedCost,
      now,
    });

    await this.runs.save(run);
    await this.persistUsageRecords(run.id, outcome, now);

    try {
      await this.persistAnalysisOutputs(currentArticle.id, run.id, outcome, now);
      await this.persistScoreSnapshot(currentArticle.id, version.id, run.id, now);
    } catch (error) {
      if (isNonRetryableScoreError(error)) {
        return this.failOrRetry(started, currentArticle, error.message, now, false);
      }

      throw error;
    }

    return this.finishSuccess(started, currentArticle, now);
  }

  private async loadTaxonomyLabels(
    articleId: Article['id'],
  ): Promise<{ categories: readonly string[]; tags: readonly string[] }> {
    const [categoryIds, tagIds] = await Promise.all([
      this.taxonomy.listCategoryIds(articleId),
      this.taxonomy.listTagIds(articleId),
    ]);
    const [categories, tags] = await Promise.all([
      this.categories.findManyByIds(categoryIds),
      this.tags.findManyByIds(tagIds),
    ]);

    return {
      categories: categories.map((category) => category.name),
      tags: tags.map((tag) => tag.name),
    };
  }

  private async persistAnalysisOutputs(
    articleId: Article['id'],
    analysisRunId: AnalysisRun['id'],
    outcome: Extract<ArticleAnalysisOutcome, { ok: true }>,
    now: Date,
  ): Promise<void> {
    const metrics = (outcome.metrics ?? []).map((metric) =>
      AnalysisMetric.record({
        id: asAnalysisMetricId(this.ids.next()),
        analysisRunId,
        metricType: metric.metricType,
        score: Score.from(metric.score),
        confidence: Score.from(metric.confidence),
        explanation: metric.explanation,
        createdAt: now,
      }),
    );
    const evidence = (outcome.evidence ?? []).map((item) =>
      AnalysisEvidence.record({
        id: asAnalysisEvidenceId(this.ids.next()),
        analysisRunId,
        metricType: item.metricType,
        evidenceType: item.evidenceType,
        claim: item.claim,
        evidence: item.evidence,
        sourceUrl: item.sourceUrl ?? null,
        sourceTitle: item.sourceTitle ?? null,
        reliability: item.reliability ?? null,
        createdAt: now,
      }),
    );
    const sources = (outcome.sources ?? []).map((source) =>
      SourceReference.record({
        id: asSourceReferenceId(this.ids.next()),
        articleId,
        analysisRunId,
        url: source.url,
        title: source.title,
        publisher: source.publisher,
        doi: source.doi,
        sourceType: source.sourceType,
        verificationStatus: source.verificationStatus,
        reliabilityScore:
          source.reliabilityScore === null || source.reliabilityScore === undefined
            ? null
            : Score.from(source.reliabilityScore),
        createdAt: now,
      }),
    );

    if (metrics.length > 0) {
      await this.metrics.saveMany(metrics);
    }

    if (evidence.length > 0) {
      await this.evidence.saveMany(evidence);
    }

    if (sources.length > 0) {
      await this.sources.saveMany(sources);
    }
  }

  private async persistUsageRecords(
    analysisRunId: AnalysisRun['id'],
    outcome: Extract<ArticleAnalysisOutcome, { ok: true }>,
    now: Date,
  ): Promise<void> {
    if (!this.usageRecords || !outcome.usageRecords || outcome.usageRecords.length === 0) {
      return;
    }

    await this.usageRecords.saveMany(
      outcome.usageRecords.map((record) =>
        AiUsageRecord.record({
          id: asAiUsageRecordId(this.ids.next()),
          analysisRunId,
          provider: record.provider,
          model: record.model,
          promptId: record.promptId,
          promptVersion: record.promptVersion,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          estimatedCost: record.estimatedCost,
          latencyMs: record.latencyMs,
          recordedAt: now,
        }),
      ),
    );
  }

  private async recordOperationalEvent(input: {
    readonly kind: (typeof OperationalEventKind)[keyof typeof OperationalEventKind];
    readonly jobId: AnalysisJob['id'];
    readonly articleId: Article['id'];
    readonly status: string;
    readonly message: string;
    readonly now: Date;
  }): Promise<void> {
    if (!this.operationalEvents) {
      return;
    }

    await this.operationalEvents.save(
      OperationalEvent.record({
        id: asOperationalEventId(this.ids.next()),
        kind: input.kind,
        jobId: input.jobId,
        articleId: input.articleId,
        status: input.status,
        message: input.message,
        createdAt: input.now,
      }),
    );
  }

  private async persistScoreSnapshot(
    articleId: Article['id'],
    articleVersionId: Article['currentVersionId'],
    analysisRunId: AnalysisRun['id'],
    now: Date,
  ): Promise<void> {
    const existing = await this.snapshots.findByAnalysisRunId(analysisRunId);

    if (existing) {
      return;
    }

    const recorded = await this.metrics.listByAnalysisRunId(analysisRunId);

    if (recorded.length === 0) {
      return;
    }

    const policy = await this.policies.findActive();

    if (!policy) {
      throw new ScoringPolicyNotFoundError();
    }

    const computed = new ScoringEngine(policy).evaluate(recorded);
    await this.snapshots.save(
      ScoreSnapshot.fromComputed({
        id: asScoreSnapshotId(this.ids.next()),
        articleId,
        articleVersionId,
        analysisRunId,
        computed,
        createdAt: now,
      }),
    );
  }

  private async applyAutomaticFlags(article: Article, now: Date): Promise<Article> {
    if (article.status !== ArticleStatus.ANALYSIS_COMPLETED) {
      return article;
    }

    const version = await this.versions.findById(article.currentVersionId);
    const snapshot = await this.snapshots.findLatestByArticleVersionId(article.currentVersionId);
    const policy = (await this.policies.findActive()) ?? ScoringPolicy.initial();
    const runs = await this.runs.listByArticleVersionId(article.currentVersionId);
    const completedRun = [...runs].reverse().find((run) => run.status === AnalysisRunStatus.COMPLETED);
    const [evidence, sources, duplicates] = await Promise.all([
      completedRun ? this.evidence.listByAnalysisRunId(completedRun.id) : Promise.resolve([]),
      completedRun ? this.sources.listByAnalysisRunId(completedRun.id) : Promise.resolve([]),
      this.articles.listByCurrentContentHash(article.currentContentHash),
    ]);
    const duplicate = duplicates.find((candidate) => candidate.id !== article.id) ?? null;
    const flags = evaluateModerationFlags({
      snapshot,
      policy,
      evidence,
      sources,
      version,
      duplicateArticleId: duplicate?.id ?? null,
    });

    if (flags.length === 0) {
      return article;
    }

    if (completedRun) {
      await this.evidence.saveMany(
        flags.map((flag) =>
          AnalysisEvidence.record({
            id: asAnalysisEvidenceId(this.ids.next()),
            analysisRunId: completedRun.id,
            metricType: metricTypeForFlag(flag.code),
            evidenceType: AnalysisEvidenceType.MODERATION_FLAG,
            claim: flag.code,
            evidence: flag.summary,
            sourceUrl: null,
            sourceTitle: null,
            reliability: null,
            createdAt: now,
          }),
        ),
      );
    }

    await this.auditLogs.save(
      AuditLog.record({
        id: asAuditLogId(this.ids.next()),
        actorUserId: null,
        action: AuditAction.ARTICLE_FLAGGED,
        entityType: 'Article',
        entityId: article.id,
        metadata: JSON.stringify({
          articleVersionId: article.currentVersionId,
          flags: flags.map((flag) => ({ code: flag.code, summary: flag.summary })),
        }),
        ipHash: null,
        createdAt: now,
      }),
    );

    return article.requireReview(now).article;
  }

  private async completeAlreadyAnalyzed(
    job: AnalysisJob,
    article: Article,
    now: Date,
  ): Promise<ProcessAnalysisJobResult> {
    if (job.status === AnalysisJobStatus.QUEUED) {
      const started = job.start(now);
      const claimed = await this.jobs.saveIfStatus(started, AnalysisJobStatus.QUEUED);

      if (claimed) {
        await this.jobs.saveIfStatus(started.complete(now), AnalysisJobStatus.RUNNING);
        return { outcome: 'completed', articleStatus: article.status, jobStatus: AnalysisJobStatus.COMPLETED };
      }
    }

    if (job.status === AnalysisJobStatus.RUNNING) {
      await this.jobs.saveIfStatus(job.complete(now), AnalysisJobStatus.RUNNING);
      return { outcome: 'completed', articleStatus: article.status, jobStatus: AnalysisJobStatus.COMPLETED };
    }

    return ignored(article.status, job.status);
  }

  private async finishSuccess(
    job: AnalysisJob,
    article: Article,
    now: Date,
  ): Promise<ProcessAnalysisJobResult> {
    const completed = await this.jobs.saveIfStatus(job.complete(now), AnalysisJobStatus.RUNNING);

    if (!completed) {
      return ignored(article.status, job.status);
    }

    if (article.status === ArticleStatus.PROCESSING) {
      const analyzed = article.completeAnalysis(now).article;
      const finished = await this.applyAutomaticFlags(analyzed, now);
      await this.articles.save(finished);
      return {
        outcome: 'completed',
        articleStatus: finished.status,
        jobStatus: AnalysisJobStatus.COMPLETED,
      };
    }

    return {
      outcome: 'completed',
      articleStatus: article.status,
      jobStatus: AnalysisJobStatus.COMPLETED,
    };
  }

  private async failOrRetry(
    job: AnalysisJob,
    article: Article,
    reason: string,
    now: Date,
    retryable: boolean,
  ): Promise<ProcessAnalysisJobResult> {
    const failed = job.fail(reason, now);
    const attemptsExhausted =
      !retryable || failed.attemptCount >= ANALYSIS_JOB_POLICY.maxAttempts;

    if (attemptsExhausted) {
      await this.jobs.saveIfStatus(failed, job.status);
      const nextArticle =
        article.status === ArticleStatus.PROCESSING ||
        article.status === ArticleStatus.QUEUED_FOR_ANALYSIS
          ? article.failAnalysis(now).article
          : article;

      if (nextArticle !== article) {
        await this.articles.save(nextArticle);
      }

      await this.recordOperationalEvent({
        kind: retryable ? OperationalEventKind.AI_PROVIDER_FAILURE : OperationalEventKind.WORKER_FAILURE,
        jobId: failed.id,
        articleId: article.id,
        status: AnalysisJobStatus.FAILED,
        message: reason,
        now,
      });

      return {
        outcome: 'failed',
        articleStatus: nextArticle.status,
        jobStatus: AnalysisJobStatus.FAILED,
      };
    }

    const retryAt = new Date(now.getTime() + ANALYSIS_JOB_POLICY.retryDelayMs);
    await this.jobs.saveIfStatus(failed.retry(retryAt), job.status);
    return {
      outcome: 'retried',
      articleStatus: article.status,
      jobStatus: AnalysisJobStatus.QUEUED,
    };
  }

  private async cancelIfActive(
    job: AnalysisJob,
    article: Article,
    now: Date,
  ): Promise<ProcessAnalysisJobResult> {
    if (job.status === AnalysisJobStatus.QUEUED || job.status === AnalysisJobStatus.RUNNING) {
      await this.jobs.saveIfStatus(job.cancel(now), job.status);
      return { outcome: 'ignored', articleStatus: article.status, jobStatus: AnalysisJobStatus.CANCELLED };
    }

    return ignored(article.status, job.status);
  }
}

function isStaleRunning(job: AnalysisJob, now: Date): boolean {
  if (!job.startedAt) {
    return true;
  }

  return now.getTime() - job.startedAt.getTime() >= ANALYSIS_JOB_POLICY.staleRunningMs;
}

function ignored(
  articleStatus: ArticleStatus | null,
  jobStatus: AnalysisJobStatus | null,
): ProcessAnalysisJobResult {
  return { outcome: 'ignored', articleStatus, jobStatus };
}

function isNonRetryableScoreError(
  error: unknown,
): error is IncompleteAnalysisScoreError | ScoringPolicyNotFoundError {
  return error instanceof IncompleteAnalysisScoreError || error instanceof ScoringPolicyNotFoundError;
}
