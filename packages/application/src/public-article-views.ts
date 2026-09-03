import {
  AUTHORSHIP_RISK_DISCLAIMER,
  countWords,
  type Article,
  type ArticleVersion,
  type AuthorshipClassification,
  type Category,
  type Profile,
  type PublicDiscoveryRecord,
  type ScoreSnapshot,
  type Tag,
} from '@aip/domain';
import {
  toPublicCategory,
  toPublicTag,
  type AuthorContentMetricView,
  type AuthorSourceReferenceView,
  type PublicCategory,
  type PublicTag,
} from './article-views';

export const READING_WORDS_PER_MINUTE = 200;

export interface PublicAuthorSummary {
  readonly displayName: string;
  readonly username: string;
  readonly avatarUrl: string | null;
}

export interface PublicScoreCard {
  readonly overallScore: number;
  readonly qualityScore: number;
  readonly authorshipRisk: number;
  readonly authorshipConfidence: number;
  readonly authorshipIntegrity: number;
  readonly authorshipClassification: AuthorshipClassification;
  readonly scoringPolicyVersion: string;
}

export interface PublicArticleCard {
  readonly slug: string;
  readonly title: string;
  readonly abstract: string;
  readonly language: string;
  readonly publishedAt: string;
  readonly readingMinutes: number;
  readonly author: PublicAuthorSummary;
  readonly categories: readonly PublicCategory[];
  readonly tags: readonly PublicTag[];
  readonly score: PublicScoreCard;
}

export interface PublicAuthorshipCard {
  readonly riskScore: number;
  readonly confidenceScore: number;
  readonly classification: AuthorshipClassification;
  readonly disclaimer: string;
}

export interface PublicArticleDetail extends PublicArticleCard {
  readonly id: string;
  readonly content: string;
  readonly author: PublicAuthorSummary & {
    readonly bio: string;
    readonly websiteUrl: string | null;
  };
  readonly metrics: readonly AuthorContentMetricView[];
  readonly authorship: PublicAuthorshipCard;
  readonly sources: readonly AuthorSourceReferenceView[];
  readonly related: readonly PublicArticleCard[];
}

export interface PublicArticlePage {
  readonly items: readonly PublicArticleCard[];
  readonly nextCursor: string | null;
}

export interface PublicAuthorProfilePage {
  readonly displayName: string;
  readonly username: string;
  readonly bio: string;
  readonly avatarUrl: string | null;
  readonly websiteUrl: string | null;
  readonly articles: PublicArticlePage;
}

export interface HomepageDiscovery {
  readonly topRated: readonly PublicArticleCard[];
  readonly recentlyPublished: readonly PublicArticleCard[];
  readonly categories: readonly PublicCategory[];
}

export function estimateReadingMinutes(content: string): number {
  return estimateReadingMinutesFromWordCount(countWords(content));
}

export function toPublicScoreCard(snapshot: ScoreSnapshot): PublicScoreCard {
  return {
    overallScore: snapshot.overallScore.value,
    qualityScore: snapshot.qualityScore.value,
    authorshipRisk: snapshot.authorshipRisk.value,
    authorshipConfidence: snapshot.authorshipConfidence.value,
    authorshipIntegrity: snapshot.authorshipIntegrity.value,
    authorshipClassification: snapshot.authorshipClassification,
    scoringPolicyVersion: snapshot.scoringPolicyVersion,
  };
}

export function toPublicAuthorSummary(profile: Profile): PublicAuthorSummary {
  return {
    displayName: profile.displayName,
    username: profile.username.value,
    avatarUrl: profile.avatarUrl,
  };
}

export function toPublicArticleCard(record: PublicDiscoveryRecord): PublicArticleCard {
  return toPublicArticleCardFromParts(
    record.article,
    record.version,
    record.snapshot,
    record.author,
    record.categories,
    record.tags,
    record.wordCount,
  );
}

export function toPublicArticleCardFromParts(
  article: Article,
  version: ArticleVersion,
  snapshot: ScoreSnapshot,
  author: Profile,
  categories: readonly Category[],
  tags: readonly Tag[],
  wordCount: number,
): PublicArticleCard {
  if (!article.publishedAt) {
    throw new Error('Published discovery records require publishedAt');
  }

  return {
    slug: article.slug.value,
    title: version.title,
    abstract: version.abstract,
    language: article.language,
    publishedAt: article.publishedAt.toISOString(),
    readingMinutes: estimateReadingMinutesFromWordCount(wordCount),
    author: toPublicAuthorSummary(author),
    categories: categories.map(toPublicCategory),
    tags: tags.map(toPublicTag),
    score: toPublicScoreCard(snapshot),
  };
}

export function estimateReadingMinutesFromWordCount(wordCount: number): number {
  return Math.max(1, Math.round(Math.max(wordCount, 1) / READING_WORDS_PER_MINUTE));
}

export function toPublicAuthorshipCard(snapshot: ScoreSnapshot, disclaimer?: string): PublicAuthorshipCard {
  return {
    riskScore: snapshot.authorshipRisk.value,
    confidenceScore: snapshot.authorshipConfidence.value,
    classification: snapshot.authorshipClassification,
    disclaimer: disclaimer && disclaimer.trim().length > 0 ? disclaimer : AUTHORSHIP_RISK_DISCLAIMER,
  };
}
