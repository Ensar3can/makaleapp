import type { AuthorshipClassification } from './enums';
import type { Score } from './score';
import type { ScoringPolicy } from './scoring-policy';

export interface AIAuthorshipSignal {
  readonly name: string;
  readonly description: string;
}

export class AIAuthorshipAssessment {
  public readonly riskScore: Score;
  public readonly confidenceScore: Score;
  public readonly classification: AuthorshipClassification;
  public readonly signals: readonly AIAuthorshipSignal[];
  public readonly explanation: string;
  public readonly modelVersion: string;
  public readonly detectorVersion: string;
  public readonly createdAt: Date;

  private constructor(props: {
    riskScore: Score;
    confidenceScore: Score;
    classification: AuthorshipClassification;
    signals: readonly AIAuthorshipSignal[];
    explanation: string;
    modelVersion: string;
    detectorVersion: string;
    createdAt: Date;
  }) {
    this.riskScore = props.riskScore;
    this.confidenceScore = props.confidenceScore;
    this.classification = props.classification;
    this.signals = props.signals;
    this.explanation = props.explanation;
    this.modelVersion = props.modelVersion;
    this.detectorVersion = props.detectorVersion;
    this.createdAt = props.createdAt;
  }

  public static create(
    input: {
      riskScore: Score;
      confidenceScore: Score;
      signals: readonly AIAuthorshipSignal[];
      explanation: string;
      modelVersion: string;
      detectorVersion: string;
      createdAt: Date;
    },
    policy: ScoringPolicy,
  ): AIAuthorshipAssessment {
    return new AIAuthorshipAssessment({
      ...input,
      classification: policy.classifyAuthorship(input.riskScore),
    });
  }

  public static reconstitute(props: {
    riskScore: Score;
    confidenceScore: Score;
    classification: AuthorshipClassification;
    signals: readonly AIAuthorshipSignal[];
    explanation: string;
    modelVersion: string;
    detectorVersion: string;
    createdAt: Date;
  }): AIAuthorshipAssessment {
    return new AIAuthorshipAssessment(props);
  }
}
