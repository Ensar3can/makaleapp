import { stableInt } from './stable-hash';
import type { AIAuthorshipDetector, AuthorshipDetectionResult } from './types';

export const FAKE_AUTHORSHIP_DETECTOR_VERSION = 'fake-authorship-detector-1';

export class FakeAIAuthorshipDetector implements AIAuthorshipDetector {
  public readonly name = 'fake';

  public async detect(content: string): Promise<AuthorshipDetectionResult> {
    return {
      riskScore: stableInt(`${content}:risk`, 40, 60),
      confidenceScore: stableInt(`${content}:confidence`, 30, 50),
      signals: ['foundation-probe'],
      explanation:
        'Deterministic fake authorship probe. This is a risk and confidence estimate, not a verdict that a human or a model wrote the article.',
      modelVersion: 'fake-authorship-model-1',
      detectorVersion: FAKE_AUTHORSHIP_DETECTOR_VERSION,
    };
  }
}
