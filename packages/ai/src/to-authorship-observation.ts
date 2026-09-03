import type { AuthorshipDetectorObservation } from '@aip/domain';
import type { AuthorshipDetectionResult } from './types';

export function toAuthorshipObservation(
  name: string,
  result: AuthorshipDetectionResult,
): AuthorshipDetectorObservation {
  return {
    name,
    riskScore: result.riskScore,
    confidenceScore: result.confidenceScore,
    signals: result.signals.map((signal) => ({
      name: signal,
      description: `${signal} reported by ${name}`,
    })),
    explanation: result.explanation,
    modelVersion: result.modelVersion,
    detectorVersion: result.detectorVersion,
  };
}
