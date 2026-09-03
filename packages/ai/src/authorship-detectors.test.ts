import { describe, expect, it } from 'vitest';
import { interpretModelAuthorshipSignals } from './model-authorship-detector';
import { StylometricAuthorshipDetector } from './stylometric-authorship-detector';

const TEMPLATED = [
  'Furthermore it is important to note that the system is useful.',
  'Moreover it is important to note that the system is useful.',
  'Furthermore it is important to note that the system is useful.',
  'Moreover it is important to note that the system is useful.',
  'In conclusion it is important to note that the system is useful.',
  'Furthermore it is important to note that the system is useful.',
].join(' ');

const VARIED = [
  'I kept missing the bus that week. Why?',
  'The schedule changed on Tuesday — nobody posted a notice.',
  "Later, after a long walk past the river, I found a handwritten sign taped to a lamppost.",
  "I don't think anyone planned that detour, but the river path smelled like rain and diesel.",
  'A cyclist shouted something I could not catch, then vanished under the bridge.',
].join(' ');

describe('StylometricAuthorshipDetector', () => {
  const detector = new StylometricAuthorshipDetector();

  it('is deterministic and never returns a binary verdict', async () => {
    const first = await detector.detect(TEMPLATED);
    const second = await detector.detect(TEMPLATED);

    expect(first).toEqual(second);
    expect(detector.name).toBe('stylometric');
    expect(first.explanation).toMatch(/not a verdict/i);
    expect(first.signals).toContain('generic-transitions');
  });

  it('scores uniform templated prose as higher risk than varied first-person prose', async () => {
    const templated = await detector.detect(TEMPLATED);
    const varied = await detector.detect(VARIED);

    expect(templated.riskScore).toBeGreaterThan(varied.riskScore);
    expect(templated.signals.length).toBeGreaterThan(0);
  });

  it('keeps confidence low on short text', async () => {
    const short = await detector.detect('Hello there.');

    expect(short.confidenceScore).toBeLessThan(30);
    expect(short.riskScore).toBeGreaterThanOrEqual(0);
    expect(short.riskScore).toBeLessThanOrEqual(100);
  });
});

describe('interpretModelAuthorshipSignals', () => {
  it('maps qualitative signals to risk without asking for a verdict', () => {
    const directional = interpretModelAuthorshipSignals(
      { signals: ['generic-transitions', 'low-burstiness'], notes: 'Observed markers.' },
      'fake',
    );
    const weak = interpretModelAuthorshipSignals(
      { signals: ['foundation-probe'], notes: 'Deterministic fake authorship signals. Not a binary verdict.' },
      'fake',
    );

    expect(directional.riskScore).toBeGreaterThan(weak.riskScore);
    expect(directional.confidenceScore).toBeGreaterThan(weak.confidenceScore);
    expect(weak.riskScore).toBe(50);
    expect(weak.explanation).toMatch(/not a binary verdict/i);
  });
});
