export interface PreprocessArticleInput {
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly contentHash: string;
  readonly language: string;
}

export interface PreprocessedStructuralMetrics {
  readonly headingCount: number;
  readonly hasNumberedHeadings: boolean;
  readonly averageParagraphWords: number;
}

export interface PreprocessedArticle {
  readonly title: string;
  readonly abstract: string;
  readonly language: string;
  readonly wordCount: number;
  readonly characterCount: number;
  readonly headings: readonly string[];
  readonly paragraphCount: number;
  readonly references: readonly string[];
  readonly urls: readonly string[];
  readonly citations: readonly string[];
  readonly keywords: readonly string[];
  readonly contentHash: string;
  readonly structural: PreprocessedStructuralMetrics;
}

const URL_PATTERN = /https?:\/\/[^\s)\]>'"]+/gi;
const NUMERIC_CITATION_PATTERN = /\[(\d+)\]/g;
const AUTHOR_YEAR_PATTERN =
  /\(([A-Z][A-Za-z.'-]+(?:\s+(?:and|&)\s+[A-Z][A-Za-z.'-]+)?,?\s+\d{4}[a-z]?)\)/g;
const DOI_PATTERN = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
const MARKDOWN_HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;
const NUMBERED_HEADING_PATTERN = /^(\d+)[.)]\s+([A-Z].{1,80})$/;
const REFERENCE_HEADING_PATTERN = /^(#{1,6}\s+)?(references|bibliography|works cited)\s*$/i;
const KEYWORD_LINE_PATTERN = /^keywords?\s*[:-]\s*(.+)$/im;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function preprocessArticle(input: PreprocessArticleInput): PreprocessedArticle {
  const headings = extractHeadings(input.content);
  const paragraphs = extractParagraphs(input.content);
  const urls = unique(input.content.match(URL_PATTERN) ?? []);
  const citations = extractCitations(input.content);
  const references = extractReferences(input.content);
  const keywords = extractKeywords(input.title, input.abstract, input.content);
  const paragraphWordCounts = paragraphs.map((paragraph) => countWords(paragraph));
  const averageParagraphWords =
    paragraphWordCounts.length === 0
      ? 0
      : paragraphWordCounts.reduce((total, count) => total + count, 0) / paragraphWordCounts.length;

  return {
    title: input.title,
    abstract: input.abstract,
    language: input.language,
    wordCount: countWords(input.content),
    characterCount: input.content.length,
    headings,
    paragraphCount: paragraphs.length,
    references,
    urls,
    citations,
    keywords,
    contentHash: input.contentHash,
    structural: {
      headingCount: headings.length,
      hasNumberedHeadings: headings.some((heading) => /^\d+[.)]\s/.test(heading)),
      averageParagraphWords: Math.round(averageParagraphWords * 100) / 100,
    },
  };
}

function extractHeadings(content: string): string[] {
  const headings: string[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0) {
      continue;
    }

    const markdown = MARKDOWN_HEADING_PATTERN.exec(line);
    if (markdown?.[2]) {
      headings.push(markdown[2].trim());
      continue;
    }

    const numbered = NUMBERED_HEADING_PATTERN.exec(line);
    if (numbered?.[1] && numbered[2]) {
      headings.push(`${numbered[1]}. ${numbered[2].trim()}`);
      continue;
    }

    if (line.length <= 80 && line === line.toUpperCase() && /[A-Z]/.test(line) && !line.endsWith('.')) {
      headings.push(line);
    }
  }

  return unique(headings);
}

function extractParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0 && !MARKDOWN_HEADING_PATTERN.test(paragraph));
}

function extractCitations(content: string): string[] {
  const citations: string[] = [];

  for (const match of content.matchAll(NUMERIC_CITATION_PATTERN)) {
    citations.push(`[${match[1]}]`);
  }

  for (const match of content.matchAll(AUTHOR_YEAR_PATTERN)) {
    citations.push(`(${match[1]})`);
  }

  for (const match of content.matchAll(DOI_PATTERN)) {
    citations.push(match[0].replace(/[.,;:]+$/u, ''));
  }

  return unique(citations);
}

function extractReferences(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => REFERENCE_HEADING_PATTERN.test(line.trim()));

  if (start === -1) {
    return [];
  }

  const references: string[] = [];

  for (const rawLine of lines.slice(start + 1)) {
    const line = rawLine.trim();

    if (line.length === 0) {
      continue;
    }

    if (
      (MARKDOWN_HEADING_PATTERN.test(line) && !REFERENCE_HEADING_PATTERN.test(line)) ||
      KEYWORD_LINE_PATTERN.test(line)
    ) {
      break;
    }

    references.push(line);
  }

  return references;
}

function extractKeywords(title: string, abstract: string, content: string): string[] {
  const declared = KEYWORD_LINE_PATTERN.exec(`${abstract}\n${content}`);

  if (declared?.[1]) {
    return unique(
      declared[1]
        .split(/[,;]/)
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0),
    ).slice(0, 12);
  }

  return unique(
    title
      .split(/[^\p{L}\p{N}]+/u)
      .map((word) => word.trim())
      .filter((word) => word.length > 3),
  ).slice(0, 8);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
