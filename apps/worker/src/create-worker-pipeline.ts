import {
  FakeAIProvider,
  OpenAICompatibleProvider,
  createContentAnalysisPipeline,
  type ArticleAnalysisPipeline,
} from '@aip/ai';
import type { AppConfig } from '@aip/config';
import { FakeResearchProvider, SsrfGuardedResearchProvider } from '@aip/research';

export function createWorkerPipeline(config: AppConfig): ArticleAnalysisPipeline {
  const provider =
    config.AI_PROVIDER === 'openai' && config.AI_API_KEY.length > 0
      ? new OpenAICompatibleProvider({
          apiKey: config.AI_API_KEY,
          baseUrl: config.AI_BASE_URL,
          model: config.AI_MODEL,
        })
      : new FakeAIProvider();

  return createContentAnalysisPipeline({
    provider,
    research: new SsrfGuardedResearchProvider(new FakeResearchProvider()),
  });
}
