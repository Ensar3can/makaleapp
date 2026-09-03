import { describe, expect, it } from 'vitest';
import {
  authorshipClassificationLabel,
  metricLabel,
} from '../apps/web/lib/analysis-labels';

describe('analysis labels', () => {
  it('maps the five authorship bands used by AuthorshipRiskBadge', () => {
    expect(authorshipClassificationLabel('very_low')).toBe('Very low');
    expect(authorshipClassificationLabel('low')).toBe('Low');
    expect(authorshipClassificationLabel('uncertain')).toBe('Uncertain');
    expect(authorshipClassificationLabel('elevated')).toBe('High');
    expect(authorshipClassificationLabel('high')).toBe('Very high');
    expect(authorshipClassificationLabel('unknown')).toBe('unknown');
  });

  it('maps persisted metric types for display', () => {
    expect(metricLabel('STRUCTURE')).toBe('Structure');
    expect(metricLabel('AI_AUTHORSHIP_RISK')).toBe('AI_AUTHORSHIP_RISK');
  });
});
