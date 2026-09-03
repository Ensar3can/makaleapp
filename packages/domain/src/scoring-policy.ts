import { AuthorshipClassification } from './enums';
import { InvalidScoringPolicyError } from './errors';
import { Score } from './score';

const WEIGHT_EPSILON = 1e-8;

export interface QualityWeights {
  readonly structure: number;
  readonly contentQuality: number;
  readonly topicRelevance: number;
  readonly citationQuality: number;
  readonly evidence: number;
  readonly factualReliability: number;
  readonly originality: number;
}

export interface QualityMetricScores {
  readonly structure: Score;
  readonly contentQuality: Score;
  readonly topicRelevance: Score;
  readonly citationQuality: Score;
  readonly evidence: Score;
  readonly factualReliability: Score;
  readonly originality: Score;
}

export interface AuthorshipClassificationThresholds {
  readonly veryLowMax: Score;
  readonly lowMax: Score;
  readonly uncertainMax: Score;
  readonly elevatedMax: Score;
}

export interface ScoringPolicyProps {
  readonly version: string;
  readonly qualityWeights: QualityWeights;
  readonly qualityWeight: number;
  readonly authorshipIntegrityWeight: number;
  readonly authorshipConfidenceThreshold: Score;
  readonly authorshipClassificationThresholds: AuthorshipClassificationThresholds;
}

export interface ComputedArticleScore {
  readonly qualityScore: Score;
  readonly authorshipRisk: Score;
  readonly authorshipConfidence: Score;
  readonly authorshipIntegrity: Score;
  readonly authorshipClassification: AuthorshipClassification;
  readonly effectiveAuthorshipWeight: number;
  readonly overallScore: Score;
  readonly scoringPolicyVersion: string;
}

const INITIAL_QUALITY_WEIGHTS: QualityWeights = {
  structure: 0.2,
  contentQuality: 0.2,
  topicRelevance: 0.15,
  citationQuality: 0.1,
  evidence: 0.1,
  factualReliability: 0.15,
  originality: 0.1,
};

export class ScoringPolicy {
  public readonly version: string;
  public readonly qualityWeights: QualityWeights;
  public readonly qualityWeight: number;
  public readonly authorshipIntegrityWeight: number;
  public readonly authorshipConfidenceThreshold: Score;
  public readonly authorshipClassificationThresholds: AuthorshipClassificationThresholds;

  private constructor(props: ScoringPolicyProps) {
    this.version = props.version;
    this.qualityWeights = props.qualityWeights;
    this.qualityWeight = props.qualityWeight;
    this.authorshipIntegrityWeight = props.authorshipIntegrityWeight;
    this.authorshipConfidenceThreshold = props.authorshipConfidenceThreshold;
    this.authorshipClassificationThresholds = props.authorshipClassificationThresholds;
  }

  public static initial(): ScoringPolicy {
    return ScoringPolicy.create({
      version: 'v1',
      qualityWeights: INITIAL_QUALITY_WEIGHTS,
      qualityWeight: 0.85,
      authorshipIntegrityWeight: 0.15,
      authorshipConfidenceThreshold: Score.from(60),
      authorshipClassificationThresholds: {
        veryLowMax: Score.from(20),
        lowMax: Score.from(40),
        uncertainMax: Score.from(60),
        elevatedMax: Score.from(80),
      },
    });
  }

  public static create(props: ScoringPolicyProps): ScoringPolicy {
    if (props.version.trim().length === 0) {
      throw new InvalidScoringPolicyError('Scoring policy version is required');
    }

    assertWeightsSumToOne(props.qualityWeights, 'Quality metric weights must sum to 1');
    assertUnitWeight(props.qualityWeight, 'Quality mix weight');
    assertUnitWeight(props.authorshipIntegrityWeight, 'Authorship integrity mix weight');

    if (Math.abs(props.qualityWeight + props.authorshipIntegrityWeight - 1) > WEIGHT_EPSILON) {
      throw new InvalidScoringPolicyError('Quality and authorship mix weights must sum to 1');
    }

    assertThresholdOrder(props.authorshipClassificationThresholds);

    return new ScoringPolicy(props);
  }

  public static reconstitute(props: ScoringPolicyProps): ScoringPolicy {
    return ScoringPolicy.create(props);
  }

  public computeQualityScore(metrics: QualityMetricScores): Score {
    const weighted =
      metrics.structure.value * this.qualityWeights.structure +
      metrics.contentQuality.value * this.qualityWeights.contentQuality +
      metrics.topicRelevance.value * this.qualityWeights.topicRelevance +
      metrics.citationQuality.value * this.qualityWeights.citationQuality +
      metrics.evidence.value * this.qualityWeights.evidence +
      metrics.factualReliability.value * this.qualityWeights.factualReliability +
      metrics.originality.value * this.qualityWeights.originality;

    return Score.from(weighted);
  }

  public computeAuthorshipIntegrity(risk: Score): Score {
    return risk.invert();
  }

  public computeEffectiveAuthorshipWeight(confidence: Score): number {
    const threshold = this.authorshipConfidenceThreshold.value;

    if (threshold === 0) {
      return this.authorshipIntegrityWeight;
    }

    const scale = Math.min(1, confidence.value / threshold);
    return this.authorshipIntegrityWeight * scale;
  }

  public classifyAuthorship(risk: Score): AuthorshipClassification {
    const thresholds = this.authorshipClassificationThresholds;

    if (risk.value <= thresholds.veryLowMax.value) {
      return AuthorshipClassification.VERY_LOW;
    }

    if (risk.value <= thresholds.lowMax.value) {
      return AuthorshipClassification.LOW;
    }

    if (risk.value <= thresholds.uncertainMax.value) {
      return AuthorshipClassification.UNCERTAIN;
    }

    if (risk.value <= thresholds.elevatedMax.value) {
      return AuthorshipClassification.ELEVATED;
    }

    return AuthorshipClassification.HIGH;
  }

  public evaluate(input: {
    metrics: QualityMetricScores;
    authorshipRisk: Score;
    authorshipConfidence: Score;
  }): ComputedArticleScore {
    const qualityScore = this.computeQualityScore(input.metrics);
    const authorshipIntegrity = this.computeAuthorshipIntegrity(input.authorshipRisk);
    const effectiveAuthorshipWeight = this.computeEffectiveAuthorshipWeight(
      input.authorshipConfidence,
    );
    const effectiveQualityWeight = 1 - effectiveAuthorshipWeight;
    const overall =
      qualityScore.value * effectiveQualityWeight +
      authorshipIntegrity.value * effectiveAuthorshipWeight;

    return {
      qualityScore,
      authorshipRisk: input.authorshipRisk,
      authorshipConfidence: input.authorshipConfidence,
      authorshipIntegrity,
      authorshipClassification: this.classifyAuthorship(input.authorshipRisk),
      effectiveAuthorshipWeight,
      overallScore: Score.from(overall),
      scoringPolicyVersion: this.version,
    };
  }
}

function assertUnitWeight(weight: number, label: string): void {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
    throw new InvalidScoringPolicyError(`${label} must be between 0 and 1 inclusive`);
  }
}

function assertWeightsSumToOne(weights: QualityWeights, message: string): void {
  const values = Object.values(weights);
  const sum = values.reduce((total, weight) => total + weight, 0);

  for (const weight of values) {
    assertUnitWeight(weight, 'Quality metric weight');
  }

  if (Math.abs(sum - 1) > WEIGHT_EPSILON) {
    throw new InvalidScoringPolicyError(`${message} (received ${sum})`);
  }
}

function assertThresholdOrder(thresholds: AuthorshipClassificationThresholds): void {
  if (
    thresholds.veryLowMax.value >= thresholds.lowMax.value ||
    thresholds.lowMax.value >= thresholds.uncertainMax.value ||
    thresholds.uncertainMax.value >= thresholds.elevatedMax.value
  ) {
    throw new InvalidScoringPolicyError(
      'Authorship classification thresholds must be strictly increasing',
    );
  }
}
