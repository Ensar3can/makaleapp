import type { AIAuthorshipDetector, AuthorshipDetectionResult } from './types';

export const STYLOMETRIC_AUTHORSHIP_DETECTOR_VERSION = 'stylometric-authorship-1';

const GENERIC_TRANSITIONS = [
  'furthermore',
  'moreover',
  'in conclusion',
  'in summary',
  'it is important to note',
  'it is worth noting',
  "in today's world",
  'in this paper we',
  'as previously mentioned',
  'on the other hand',
  'in other words',
  'to summarize',
  'overall it can be said',
  'this paper aims',
  'a comprehensive overview',
  'delve into',
  'landscape of',
] as const;

export class StylometricAuthorshipDetector implements AIAuthorshipDetector {
  public readonly name = 'stylometric';

  public async detect(content: string): Promise<AuthorshipDetectionResult> {
    const text = content.trim();
    const words = tokenizeWords(text);
    const sentences = splitSentences(text);
    const sentenceLengths = sentences.map((sentence) => tokenizeWords(sentence).length).filter((length) => length > 0);
    const burstinessRisk = burstinessSignal(sentenceLengths);
    const diversityRisk = lexicalDiversitySignal(words);
    const repetitionRisk = repetitiveOpenerSignal(sentences);
    const transitionRisk = genericTransitionSignal(text, sentences.length);
    const riskScore = roundScore(
      burstinessRisk.risk * 0.35 +
        diversityRisk.risk * 0.25 +
        repetitionRisk.risk * 0.2 +
        transitionRisk.risk * 0.2,
    );
    const signals = [burstinessRisk, diversityRisk, repetitionRisk, transitionRisk].filter(
      (signal) => signal.include,
    );

    return {
      riskScore,
      confidenceScore: stylometricConfidence(words.length),
      signals: signals.map((signal) => signal.name),
      explanation:
        'Stylometric features (sentence-length variation, lexical diversity, repeated openers, and generic transitions) produced a risk estimate. Perplexity or style uniformity alone does not prove AI authorship. This is not a verdict that a human or a model wrote the article.',
      modelVersion: 'none',
      detectorVersion: STYLOMETRIC_AUTHORSHIP_DETECTOR_VERSION,
    };
  }
}

function burstinessSignal(sentenceLengths: readonly number[]): ScoredSignal {
  if (sentenceLengths.length < 3) {
    return {
      name: 'limited-signal',
      risk: 50,
      include: true,
    };
  }

  const mean = average(sentenceLengths);
  const stdev = Math.sqrt(average(sentenceLengths.map((length) => (length - mean) ** 2)));
  const burstiness = stdev + mean === 0 ? 0 : (stdev - mean) / (stdev + mean);

  if (burstiness > 0.15) {
    return { name: 'high-burstiness', risk: 32, include: true };
  }

  if (burstiness < -0.15) {
    return { name: 'low-burstiness', risk: 70, include: true };
  }

  return { name: 'varied-sentence-length', risk: 48, include: true };
}

function lexicalDiversitySignal(words: readonly string[]): ScoredSignal {
  if (words.length < 40) {
    return { name: 'limited-signal', risk: 50, include: false };
  }

  const unique = new Set(words.map((word) => word.toLowerCase())).size;
  const ttr = unique / words.length;

  if (ttr < 0.38) {
    return { name: 'low-lexical-diversity', risk: 66, include: true };
  }

  if (ttr > 0.62) {
    return { name: 'high-lexical-diversity', risk: 36, include: true };
  }

  return { name: 'lexical-diversity-typical', risk: 50, include: false };
}

function repetitiveOpenerSignal(sentences: readonly string[]): ScoredSignal {
  if (sentences.length < 4) {
    return { name: 'limited-signal', risk: 50, include: false };
  }

  const openers = sentences
    .map((sentence) => tokenizeWords(sentence).slice(0, 3).join(' ').toLowerCase())
    .filter((opener) => opener.length > 0);
  const counts = new Map<string, number>();

  for (const opener of openers) {
    counts.set(opener, (counts.get(opener) ?? 0) + 1);
  }

  const repeated = [...counts.values()].filter((count) => count > 1).reduce((total, count) => total + count, 0);
  const ratio = openers.length === 0 ? 0 : repeated / openers.length;

  if (ratio >= 0.25) {
    return { name: 'repetitive-openers', risk: 64, include: true };
  }

  return { name: 'varied-openers', risk: 42, include: false };
}

function genericTransitionSignal(text: string, sentenceCount: number): ScoredSignal {
  const lower = text.toLowerCase();
  const hits = GENERIC_TRANSITIONS.filter((phrase) => lower.includes(phrase)).length;
  const density = sentenceCount === 0 ? 0 : hits / sentenceCount;

  if (density >= 0.2 || hits >= 3) {
    return { name: 'generic-transitions', risk: 72, include: true };
  }

  if (hits > 0) {
    return { name: 'generic-transitions', risk: 58, include: true };
  }

  return { name: 'few-generic-transitions', risk: 40, include: false };
}

function stylometricConfidence(wordCount: number): number {
  if (wordCount < 50) {
    return 18;
  }

  if (wordCount < 120) {
    return 32;
  }

  if (wordCount < 250) {
    return 48;
  }

  if (wordCount < 500) {
    return 58;
  }

  return 68;
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

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function roundScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;
}

interface ScoredSignal {
  readonly name: string;
  readonly risk: number;
  readonly include: boolean;
}
