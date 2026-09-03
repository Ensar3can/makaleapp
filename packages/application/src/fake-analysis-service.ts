import {
  AnalysisJob,
  asAnalysisJobId,
  type AnalysisJobRepository,
  type Article,
  type ArticleRepository,
} from '@aip/domain';
import { ANALYZE_ARTICLE_JOB } from './analysis-job-policy';
import type { AnalysisScheduler, IdGenerator, JobDispatcher } from './ports';

export class FakeAnalysisService implements AnalysisScheduler {
  public constructor(
    private readonly articles: ArticleRepository,
    private readonly jobs: AnalysisJobRepository,
    private readonly ids: IdGenerator,
    private readonly dispatcher: JobDispatcher,
  ) {}

  public async schedule(
    article: Article,
    now: Date,
  ): Promise<{ article: Article; job: AnalysisJob }> {
    const existing = await this.jobs.findActiveByArticleVersionId(article.currentVersionId);
    const queued = article.queueForAnalysis(now);
    const job =
      existing ??
      AnalysisJob.enqueue({
        id: asAnalysisJobId(this.ids.next()),
        articleId: article.id,
        articleVersionId: article.currentVersionId,
        now,
      });

    if (!existing) {
      await this.jobs.save(job);
    }

    await this.articles.save(queued.article);
    await this.dispatcher.dispatch(
      ANALYZE_ARTICLE_JOB,
      { analysisJobId: job.id },
      { jobId: job.id },
    );
    return { article: queued.article, job };
  }
}
