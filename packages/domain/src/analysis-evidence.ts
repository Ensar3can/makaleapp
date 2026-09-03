import { InvalidAnalysisEvidenceError } from './errors';
import type { AnalysisEvidenceId, AnalysisRunId } from './ids';
import type { MetricType } from './enums';

export interface AnalysisEvidenceProps {
  readonly id: AnalysisEvidenceId;
  readonly analysisRunId: AnalysisRunId;
  readonly metricType: MetricType;
  readonly evidenceType: string;
  readonly claim: string;
  readonly evidence: string;
  readonly sourceUrl: string | null;
  readonly sourceTitle: string | null;
  readonly reliability: number | null;
  readonly createdAt: Date;
}

export class AnalysisEvidence {
  public readonly id: AnalysisEvidenceId;
  public readonly analysisRunId: AnalysisRunId;
  public readonly metricType: MetricType;
  public readonly evidenceType: string;
  public readonly claim: string;
  public readonly evidence: string;
  public readonly sourceUrl: string | null;
  public readonly sourceTitle: string | null;
  public readonly reliability: number | null;
  public readonly createdAt: Date;

  private constructor(props: AnalysisEvidenceProps) {
    this.id = props.id;
    this.analysisRunId = props.analysisRunId;
    this.metricType = props.metricType;
    this.evidenceType = props.evidenceType;
    this.claim = props.claim;
    this.evidence = props.evidence;
    this.sourceUrl = props.sourceUrl;
    this.sourceTitle = props.sourceTitle;
    this.reliability = props.reliability;
    this.createdAt = props.createdAt;
  }

  public static record(props: AnalysisEvidenceProps): AnalysisEvidence {
    if (props.evidenceType.trim().length === 0) {
      throw new InvalidAnalysisEvidenceError('Evidence type is required');
    }

    if (props.claim.trim().length === 0) {
      throw new InvalidAnalysisEvidenceError('Evidence claim is required');
    }

    if (props.evidence.trim().length === 0) {
      throw new InvalidAnalysisEvidenceError('Evidence text is required');
    }

    if (props.reliability !== null && (!Number.isFinite(props.reliability) || props.reliability < 0 || props.reliability > 100)) {
      throw new InvalidAnalysisEvidenceError('Evidence reliability must be between 0 and 100');
    }

    return new AnalysisEvidence({
      ...props,
      evidenceType: props.evidenceType.trim(),
      claim: props.claim.trim(),
      evidence: props.evidence.trim(),
    });
  }

  public static reconstitute(props: AnalysisEvidenceProps): AnalysisEvidence {
    return AnalysisEvidence.record(props);
  }

  public isBoundTo(analysisRunId: AnalysisRunId): boolean {
    return this.analysisRunId === analysisRunId;
  }
}
