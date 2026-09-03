import { ArticleType } from './enums';
import { InvalidArticleEvaluationPolicyError } from './errors';

export interface StructuralExpectations {
  readonly requiresIntroduction: boolean;
  readonly requiresConclusion: boolean;
  readonly requiresMethods: boolean;
  readonly requiresReferences: boolean;
  readonly minimumSections: number;
}

export interface ResearchExpectations {
  readonly requiresCitations: boolean;
  readonly claimVerificationExpected: boolean;
}

export interface ArticleEvaluationPolicyProps {
  readonly articleType: ArticleType;
  readonly structure: StructuralExpectations;
  readonly research: ResearchExpectations;
}

interface TypePolicy {
  readonly structure: StructuralExpectations;
  readonly research: ResearchExpectations;
}

const POLICIES: Record<ArticleType, TypePolicy> = {
  [ArticleType.RESEARCH]: {
    structure: {
      requiresIntroduction: true,
      requiresConclusion: true,
      requiresMethods: true,
      requiresReferences: true,
      minimumSections: 4,
    },
    research: { requiresCitations: true, claimVerificationExpected: true },
  },
  [ArticleType.TECHNICAL]: {
    structure: {
      requiresIntroduction: true,
      requiresConclusion: true,
      requiresMethods: false,
      requiresReferences: false,
      minimumSections: 3,
    },
    research: { requiresCitations: false, claimVerificationExpected: true },
  },
  [ArticleType.OPINION]: {
    structure: {
      requiresIntroduction: true,
      requiresConclusion: true,
      requiresMethods: false,
      requiresReferences: false,
      minimumSections: 2,
    },
    research: { requiresCitations: false, claimVerificationExpected: false },
  },
  [ArticleType.REVIEW]: {
    structure: {
      requiresIntroduction: true,
      requiresConclusion: true,
      requiresMethods: false,
      requiresReferences: true,
      minimumSections: 3,
    },
    research: { requiresCitations: true, claimVerificationExpected: true },
  },
  [ArticleType.EDUCATIONAL]: {
    structure: {
      requiresIntroduction: true,
      requiresConclusion: true,
      requiresMethods: false,
      requiresReferences: false,
      minimumSections: 3,
    },
    research: { requiresCitations: false, claimVerificationExpected: true },
  },
  [ArticleType.NEWS]: {
    structure: {
      requiresIntroduction: true,
      requiresConclusion: true,
      requiresMethods: false,
      requiresReferences: false,
      minimumSections: 2,
    },
    research: { requiresCitations: false, claimVerificationExpected: true },
  },
  [ArticleType.ESSAY]: {
    structure: {
      requiresIntroduction: true,
      requiresConclusion: true,
      requiresMethods: false,
      requiresReferences: false,
      minimumSections: 2,
    },
    research: { requiresCitations: false, claimVerificationExpected: false },
  },
  [ArticleType.OTHER]: {
    structure: {
      requiresIntroduction: true,
      requiresConclusion: true,
      requiresMethods: false,
      requiresReferences: false,
      minimumSections: 2,
    },
    research: { requiresCitations: false, claimVerificationExpected: false },
  },
};

export class ArticleEvaluationPolicy {
  public readonly articleType: ArticleType;
  public readonly structure: StructuralExpectations;
  public readonly research: ResearchExpectations;

  private constructor(props: ArticleEvaluationPolicyProps) {
    this.articleType = props.articleType;
    this.structure = props.structure;
    this.research = props.research;
  }

  public static forType(articleType: ArticleType): ArticleEvaluationPolicy {
    const policy = POLICIES[articleType];

    if (!policy) {
      throw new InvalidArticleEvaluationPolicyError(`Unknown article type: ${articleType}`);
    }

    return new ArticleEvaluationPolicy({
      articleType,
      structure: policy.structure,
      research: policy.research,
    });
  }

  public static reconstitute(props: ArticleEvaluationPolicyProps): ArticleEvaluationPolicy {
    return ArticleEvaluationPolicy.forType(props.articleType);
  }
}
