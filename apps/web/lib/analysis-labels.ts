const METRIC_LABELS: Record<string, string> = {
  STRUCTURE: 'Structure',
  CONTENT_QUALITY: 'Content quality',
  TOPIC_RELEVANCE: 'Topic relevance',
  CITATION_QUALITY: 'Citation quality',
  EVIDENCE: 'Evidence',
  FACTUAL_RELIABILITY: 'Factual reliability',
  ORIGINALITY: 'Originality',
};

/** Stitch 5-level authorship bands. Display only; never a binary verdict. */
const AUTHORSHIP_CLASSIFICATION_LABELS: Record<string, string> = {
  very_low: 'Very low',
  low: 'Low',
  uncertain: 'Uncertain',
  elevated: 'High',
  high: 'Very high',
};

export function metricLabel(metricType: string): string {
  return METRIC_LABELS[metricType] ?? metricType;
}

export function authorshipClassificationLabel(classification: string): string {
  return AUTHORSHIP_CLASSIFICATION_LABELS[classification] ?? classification;
}
