import type {
  AnalysisPipeline,
  AnalyzeArticleCommand,
  ArticleAnalysisOutcome,
  ArticleAnalyzer,
} from './ports';

export class PipelineArticleAnalyzer implements ArticleAnalyzer {
  public constructor(private readonly pipeline: AnalysisPipeline) {}

  public async analyze(input: AnalyzeArticleCommand): Promise<ArticleAnalysisOutcome> {
    return this.pipeline.run({
      title: input.version.title,
      abstract: input.version.abstract,
      content: input.version.content,
      contentHash: input.version.contentHash.value,
      language: input.article.language,
      categories: input.categories,
      tags: input.tags,
    });
  }
}
