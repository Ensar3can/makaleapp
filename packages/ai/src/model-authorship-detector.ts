import type { AuthorshipDetectionResult } from './types';

export const MODEL_AUTHORSHIP_DETECTOR_VERSION = 'model-authorship-signals-1';

const SIGNAL_RISK: Readonly<Record<string, number>> = {
  'uniform-sentence-length': 68,
  'low-burstiness': 66,
  'low-lexical-diversity': 64,
  'repetitive-openers': 62,
  'generic-transitions': 70,
  'varied-sentence-length': 34,
  'high-burstiness': 32,
  'high-lexical-diversity': 36,
  'idiosyncratic-voice': 30,
  'limited-signal': 50,
  'foundation-probe': 50,
};

const WEAK_SIGNALS = new Set(['limited-signal', 'foundation-probe']);

export function interpretModelAuthorshipSignals(
  output: { readonly signals: readonly string[]; readonly notes: string },
  modelVersion: string,
): AuthorshipDetectionResult {
  const signals = output.signals.map((signal) => signal.trim()).filter((signal) => signal.length > 0);
  const known = signals.filter((signal) => signal in SIGNAL_RISK);
  const directional = known.filter((signal) => !WEAK_SIGNALS.has(signal));
  const riskScore =
    known.length === 0
      ? 50
      : roundScore(known.reduce((total, signal) => total + (SIGNAL_RISK[signal] ?? 50), 0) / known.length);

  return {
    riskScore,
    confidenceScore: directional.length > 0 ? 42 : 28,
    signals,
    explanation:
      output.notes.trim() ||
      'Model-emitted authorship signals were interpreted as observations. The model was not asked for a human-or-AI verdict.',
    modelVersion,
    detectorVersion: MODEL_AUTHORSHIP_DETECTOR_VERSION,
  };
}

export function inferFakeAuthorshipSignals(text: string): readonly string[] {
  const lower = text.toLowerCase();
  const signals: string[] = [];

  if (
    /furthermore|moreover|it is important to note|in conclusion|in today's world|delve into/.test(
      lower,
    )
  ) {
    signals.push('generic-transitions');
  }

  if (/\b(i|we)\b.*\b(i|we)\b/s.test(lower) || /don't|can't|won't|it's/.test(lower)) {
    signals.push('idiosyncratic-voice');
  }

  if (signals.length === 0) {
    signals.push('limited-signal');
  }

  return signals;
}

function roundScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;
}
