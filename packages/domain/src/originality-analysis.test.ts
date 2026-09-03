import { describe, expect, it } from 'vitest';
import { AnalysisEvidenceType, MetricType } from './enums';
import { scoreOriginality } from './originality-analysis-scoring';

const VARIED = [
  'Editorial review should stay bound to a specific article version.',
  'Changing the abstract or body creates a new hash and invalidates the previous publication score.',
  'Moderators can inspect evidence later without inventing an overall number in the browser.',
  'That separation keeps scoring explainable when policy weights change.',
].join(' ');

const REPEATED = [
  'The system is useful and the system is useful.',
  'The system is useful and the system is useful.',
  'The system is useful and the system is useful.',
  'The system is useful and the system is useful.',
].join(' ');

describe('scoreOriginality', () => {
  it('scores varied wording higher than copy-pasted repetition', () => {
    const varied = scoreOriginality({ content: VARIED });
    const repeated = scoreOriginality({ content: REPEATED });
    const variedScore = varied.metrics[0];
    const repeatedScore = repeated.metrics[0];

    expect(variedScore?.metricType).toBe(MetricType.ORIGINALITY);
    expect(repeatedScore?.metricType).toBe(MetricType.ORIGINALITY);
    expect(variedScore?.score).toBeGreaterThan(repeatedScore?.score ?? 100);
    expect(repeated.evidence.some((item) => item.evidenceType === AnalysisEvidenceType.ORIGINALITY_SIGNAL)).toBe(
      true,
    );
    expect(repeated.metrics[0]?.explanation).toMatch(/internal uniqueness|repeated/i);
  });

  it('fails closed on empty content with a low-confidence originality metric', () => {
    const result = scoreOriginality({ content: '   ' });

    expect(result.metrics[0]?.score).toBe(0);
    expect(result.metrics[0]?.confidence).toBe(10);
    expect(result.metrics[0]?.explanation).toMatch(/no body text/i);
  });

  it('is deterministic for the same body', () => {
    expect(scoreOriginality({ content: VARIED })).toEqual(scoreOriginality({ content: VARIED }));
  });
});
