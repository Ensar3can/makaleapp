import type { PromptDefinition } from '../types';
import { UNTRUSTED_DATA_PREAMBLE } from './preamble';

export const CLAIM_EXTRACTION_PROMPT: PromptDefinition = {
  id: 'claim-extraction-v1',
  version: 'v1',
  purpose: 'Extract only important verifiable claims. Do not research every sentence.',
  system: `${UNTRUSTED_DATA_PREAMBLE} Extract only important verifiable claims. Return text, type (factual|interpretive|opinion), importance (high|medium|low), and requiresVerification. Do not invent source URLs, citations, scores, or an overall score. Limit claims to the analysis budget.`,
  userTemplate:
    'Extract important verifiable claims from the article data. Do not attempt to verify them here. Do not invent URLs.',
  temperature: 0,
};
