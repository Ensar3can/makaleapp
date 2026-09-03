export const ARTICLE_LIMITS = {
  maxTitleLength: 200,
  maxAbstractLength: 2000,
  maxContentLength: 200_000,
  maxWords: 20_000,
  minCategories: 1,
  maxCategories: 5,
  maxTags: 10,
} as const;

export function countWords(content: string): number {
  const trimmed = content.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}
