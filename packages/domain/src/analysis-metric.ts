import {
  AUTHORSHIP_ANALYSIS_METRIC_TYPES,
  CONTENT_ANALYSIS_METRIC_TYPES,
  ORIGINALITY_ANALYSIS_METRIC_TYPES,
  RESEARCH_ANALYSIS_METRIC_TYPES,
  MetricType,
  type AuthorshipAnalysisMetricType,
  type ContentAnalysisMetricType,
  type OriginalityAnalysisMetricType,
  type ResearchAnalysisMetricType,
} from './enums';
import { InvalidAnalysisMetricError } from './errors';
import type { AnalysisMetricId, AnalysisRunId } from './ids';
import { Score } from './score';

export interface AnalysisMetricProps {
  readonly id: AnalysisMetricId;
  readonly analysisRunId: AnalysisRunId;
  readonly metricType: MetricType;
  readonly score: Score;
  readonly confidence: Score;
  readonly explanation: string;
  readonly createdAt: Date;
}

export class AnalysisMetric {
  public readonly id: AnalysisMetricId;
  public readonly analysisRunId: AnalysisRunId;
  public readonly metricType: MetricType;
  public readonly score: Score;
  public readonly confidence: Score;
  public readonly explanation: string;
  public readonly createdAt: Date;

  private constructor(props: AnalysisMetricProps) {
    this.id = props.id;
    this.analysisRunId = props.analysisRunId;
    this.metricType = props.metricType;
    this.score = props.score;
    this.confidence = props.confidence;
    this.explanation = props.explanation;
    this.createdAt = props.createdAt;
  }

  public static record(props: AnalysisMetricProps): AnalysisMetric {
    if (props.explanation.trim().length === 0) {
      throw new InvalidAnalysisMetricError('Metric explanation is required');
    }

    return new AnalysisMetric({
      ...props,
      explanation: props.explanation.trim(),
    });
  }

  public static reconstitute(props: AnalysisMetricProps): AnalysisMetric {
    return AnalysisMetric.record(props);
  }

  public isBoundTo(analysisRunId: AnalysisRunId): boolean {
    return this.analysisRunId === analysisRunId;
  }

  public isContentAnalysisMetric(): boolean {
    return CONTENT_ANALYSIS_METRIC_TYPES.includes(this.metricType as ContentAnalysisMetricType);
  }

  public isResearchAnalysisMetric(): boolean {
    return RESEARCH_ANALYSIS_METRIC_TYPES.includes(this.metricType as ResearchAnalysisMetricType);
  }

  public isAuthorshipAnalysisMetric(): boolean {
    return AUTHORSHIP_ANALYSIS_METRIC_TYPES.includes(this.metricType as AuthorshipAnalysisMetricType);
  }

  public isOriginalityAnalysisMetric(): boolean {
    return ORIGINALITY_ANALYSIS_METRIC_TYPES.includes(this.metricType as OriginalityAnalysisMetricType);
  }
}
