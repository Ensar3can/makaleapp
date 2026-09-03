import { fenceUntrustedPayload } from '@aip/domain';
import { AIProviderError } from './errors';
import type { AIProvider, RawStructuredAnalysis, StructuredAnalysisRequest } from './types';

export interface OpenAICompatibleProviderOptions {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly fetchImpl?: typeof fetch;
}

interface ChatCompletionResponse {
  readonly choices?: ReadonlyArray<{
    readonly message?: { readonly content?: string | null };
  }>;
  readonly usage?: {
    readonly prompt_tokens?: number;
    readonly completion_tokens?: number;
  };
  readonly model?: string;
}

const INPUT_USD_PER_TOKEN = 0.15 / 1_000_000;
const OUTPUT_USD_PER_TOKEN = 0.6 / 1_000_000;

export class OpenAICompatibleProvider implements AIProvider {
  private readonly fetchImpl: typeof fetch;

  public constructor(private readonly options: OpenAICompatibleProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public async analyzeStructured(request: StructuredAnalysisRequest): Promise<RawStructuredAnalysis> {
    const started = Date.now();
    const response = await this.fetchImpl(completionsUrl(this.options.baseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.options.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: request.system },
          {
            role: 'user',
            content: `${request.userTemplate}\n\n${fenceUntrustedPayload(request.input)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new AIProviderError(
        `AI provider returned HTTP ${response.status}`,
        response.status === 429 || response.status >= 500,
      );
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIProviderError('AI provider returned an empty completion', true);
    }

    let value: unknown;

    try {
      value = JSON.parse(content) as unknown;
    } catch {
      throw new AIProviderError('AI provider returned non-JSON content', false);
    }

    const inputTokens = payload.usage?.prompt_tokens ?? 0;
    const outputTokens = payload.usage?.completion_tokens ?? 0;

    return {
      value,
      modelProvider: 'openai-compatible',
      modelName: payload.model ?? this.options.model,
      usage: {
        inputTokens,
        outputTokens,
        estimatedCost: inputTokens * INPUT_USD_PER_TOKEN + outputTokens * OUTPUT_USD_PER_TOKEN,
        latencyMs: Date.now() - started,
      },
    };
  }
}

function completionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/chat/completions`;
}
