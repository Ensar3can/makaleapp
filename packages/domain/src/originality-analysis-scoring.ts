import { AnalysisEvidenceType, MetricType } from './enums';
import type { OriginalityAnalysisResult } from './originality-analysis';
import { Score } from './score';

const MIN_WORDS_FOR_FULL_CONFIDENCE = 120;
const NGRAM_SIZE = 4;

export interface ScoreOriginalityInput {
  readonly content: string;
}

export function scoreOriginality(input: ScoreOriginalityInput): OriginalityAnalysisResult {
  const text = input.content.trim();
  const words = tokenizeWords(text);
  const sentences = splitSentences(text);
  const wordCount = words.length;

  if (wordCount === 0) {
    return toResult(Score.zero(), Score.from(10), 'No body text was available to score originality.', {
      lexicalDiversity: 0,
      repeatedPassageRatio: 1,
      duplicateSentenceRatio: 1,
    });
  }

  const uniqueWordCount = new Set(words.map((word) => word.toLowerCase())).size;
  const rawTtr = uniqueWordCount / wordCount;
  const lengthScale = Math.min(1, wordCount / 40);
  const lexicalDiversity = clamp(rawTtr * lengthScale * 160, 0, 100);
  const repeatedPassageRatio = ngramRepeatRatio(words, NGRAM_SIZE);
  const duplicateSentenceRatio = duplicateRatio(sentences.map(normalizeSentence).filter((item) => item.length > 0));
  const uniqueness = (1 - repeatedPassageRatio) * 100;
  const sentenceUniqueness = (1 - duplicateSentenceRatio) * 100;
  const score = Score.from(lexicalDiversity * 0.45 + uniqueness * 0.35 + sentenceUniqueness * 0.2);
  const confidence = Score.from(
    clamp(25 + (wordCount / MIN_WORDS_FOR_FULL_CONFIDENCE) * 55, 25, 80),
  );
  const explanation = buildExplanation(score, lexicalDiversity, repeatedPassageRatio, duplicateSentenceRatio);

  return toResult(score, confidence, explanation, {
    lexicalDiversity,
    repeatedPassageRatio,
    duplicateSentenceRatio,
  });
}

function toResult(
  score: Score,
  confidence: Score,
  explanation: string,
  signals: {
    readonly lexicalDiversity: number;
    readonly repeatedPassageRatio: number;
    readonly duplicateSentenceRatio: number;
  },
): OriginalityAnalysisResult {
  return {
    metrics: [
      {
        metricType: MetricType.ORIGINALITY,
        score: score.value,
        confidence: confidence.value,
        explanation,
      },
    ],
    evidence: [
      {
        metricType: MetricType.ORIGINALITY,
        evidenceType: AnalysisEvidenceType.ORIGINALITY_SIGNAL,
        claim: 'lexical-diversity',
        evidence: `type-token ratio mapped to ${round(signals.lexicalDiversity)}`,
        sourceUrl: null,
        sourceTitle: null,
        reliability: round(signals.lexicalDiversity),
      },
      {
        metricType: MetricType.ORIGINALITY,
        evidenceType: AnalysisEvidenceType.ORIGINALITY_SIGNAL,
        claim: 'repeated-passages',
        evidence: `repeated ${NGRAM_SIZE}-gram ratio ${round(signals.repeatedPassageRatio * 100)}%`,
        sourceUrl: null,
        sourceTitle: null,
        reliability: round((1 - signals.repeatedPassageRatio) * 100),
      },
      {
        metricType: MetricType.ORIGINALITY,
        evidenceType: AnalysisEvidenceType.ORIGINALITY_SIGNAL,
        claim: 'duplicate-sentences',
        evidence: `duplicate sentence ratio ${round(signals.duplicateSentenceRatio * 100)}%`,
        sourceUrl: null,
        sourceTitle: null,
        reliability: round((1 - signals.duplicateSentenceRatio) * 100),
      },
    ],
  };
}

function buildExplanation(
  score: Score,
  lexicalDiversity: number,
  repeatedPassageRatio: number,
  duplicateSentenceRatio: number,
): string {
  if (repeatedPassageRatio >= 0.45 || duplicateSentenceRatio >= 0.45) {
    return `Originality is reduced by repeated passages. Duplicate-sentence ratio ${round(duplicateSentenceRatio * 100)}%, repeated 4-gram ratio ${round(repeatedPassageRatio * 100)}%. This is an internal uniqueness estimate, not an external plagiarism check.`;
  }

  return `Originality reflects internal lexical diversity (${round(lexicalDiversity)}) and passage uniqueness. Score ${score.value}. This is not a corpus plagiarism search.`;
}

function ngramRepeatRatio(words: readonly string[], size: number): number {
  if (words.length < size + 1) {
    return 0;
  }

  const seen = new Map<string, number>();
  let repeated = 0;
  let total = 0;

  for (let index = 0; index <= words.length - size; index += 1) {
    const gram = words
      .slice(index, index + size)
      .map((word) => word.toLowerCase())
      .join(' ');
    total += 1;
    const count = (seen.get(gram) ?? 0) + 1;
    seen.set(gram, count);

    if (count > 1) {
      repeated += 1;
    }
  }

  return total === 0 ? 0 : repeated / total;
}

function duplicateRatio(items: readonly string[]): number {
  if (items.length <= 1) {
    return 0;
  }

  const seen = new Set<string>();
  let duplicates = 0;

  for (const item of items) {
    if (seen.has(item)) {
      duplicates += 1;
    } else {
      seen.add(item);
    }
  }

  return duplicates / items.length;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function tokenizeWords(text: string): string[] {
  return text.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9']+/g) ?? [];
}

function normalizeSentence(sentence: string): string {
  return sentence.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
