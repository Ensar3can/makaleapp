import { InvalidAiUsageRecordError } from './errors';
import type { AiUsageRecordId, AnalysisRunId } from './ids';

const PROVIDER_MAX = 64;
const MODEL_MAX = 128;
const PROMPT_ID_MAX = 64;
const PROMPT_VERSION_MAX = 64;

export interface AiUsageRecordProps {
  readonly id: AiUsageRecordId;
  readonly analysisRunId: AnalysisRunId;
  readonly provider: string;
  readonly model: string;
  readonly promptId: string;
  readonly promptVersion: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCost: number;
  readonly latencyMs: number;
  readonly recordedAt: Date;
}

export class AiUsageRecord {
  public readonly id: AiUsageRecordId;
  public readonly analysisRunId: AnalysisRunId;
  public readonly provider: string;
  public readonly model: string;
  public readonly promptId: string;
  public readonly promptVersion: string;
  public readonly inputTokens: number;
  public readonly outputTokens: number;
  public readonly estimatedCost: number;
  public readonly latencyMs: number;
  public readonly recordedAt: Date;

  private constructor(props: AiUsageRecordProps) {
    this.id = props.id;
    this.analysisRunId = props.analysisRunId;
    this.provider = props.provider;
    this.model = props.model;
    this.promptId = props.promptId;
    this.promptVersion = props.promptVersion;
    this.inputTokens = props.inputTokens;
    this.outputTokens = props.outputTokens;
    this.estimatedCost = props.estimatedCost;
    this.latencyMs = props.latencyMs;
    this.recordedAt = props.recordedAt;
  }

  public static record(props: AiUsageRecordProps): AiUsageRecord {
    const provider = props.provider.trim();
    const model = props.model.trim();
    const promptId = props.promptId.trim();
    const promptVersion = props.promptVersion.trim();

    if (provider.length === 0 || provider.length > PROVIDER_MAX) {
      throw new InvalidAiUsageRecordError('Provider is required');
    }

    if (model.length === 0 || model.length > MODEL_MAX) {
      throw new InvalidAiUsageRecordError('Model is required');
    }

    if (promptId.length === 0 || promptId.length > PROMPT_ID_MAX) {
      throw new InvalidAiUsageRecordError('Prompt id is required');
    }

    if (promptVersion.length === 0 || promptVersion.length > PROMPT_VERSION_MAX) {
      throw new InvalidAiUsageRecordError('Prompt version is required');
    }

    assertNonNegativeInteger(props.inputTokens, 'Input tokens');
    assertNonNegativeInteger(props.outputTokens, 'Output tokens');
    assertNonNegativeInteger(props.latencyMs, 'Latency');

    if (!Number.isFinite(props.estimatedCost) || props.estimatedCost < 0) {
      throw new InvalidAiUsageRecordError('Estimated cost must be a non-negative number');
    }

    return new AiUsageRecord({
      ...props,
      provider,
      model,
      promptId,
      promptVersion,
    });
  }

  public static reconstitute(props: AiUsageRecordProps): AiUsageRecord {
    return AiUsageRecord.record(props);
  }

  public get totalTokens(): number {
    return this.inputTokens + this.outputTokens;
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidAiUsageRecordError(`${label} must be a non-negative integer`);
  }
}
