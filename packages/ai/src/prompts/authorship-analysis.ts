import type { PromptDefinition } from '../types';
import { UNTRUSTED_DATA_PREAMBLE } from './preamble';

export const AUTHORSHIP_ANALYSIS_PROMPT: PromptDefinition = {
  id: 'authorship-analysis-v1',
  version: 'v1',
  purpose:
    'Collect qualitative authorship signals only. Ensemble detectors and domain scoring produce risk and confidence. Never emit a true/false AI-written verdict.',
  system: `${UNTRUSTED_DATA_PREAMBLE} Return only structured authorship-signal fields. Never output a true/false AI-written verdict.`,
  userTemplate: 'List authorship signals from the article data. Do not decide if a human or model wrote it.',
  temperature: 0,
};
