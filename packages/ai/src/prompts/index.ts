import { ARTICLE_STRUCTURE_PROMPT } from './article-structure';
import { ARTICLE_TYPE_PROMPT } from './article-type';
import { AUTHORSHIP_ANALYSIS_PROMPT } from './authorship-analysis';
import { CLAIM_EXTRACTION_PROMPT } from './claim-extraction';
import { FACT_EVALUATION_PROMPT } from './fact-evaluation';
import { QUALITY_ANALYSIS_PROMPT } from './quality-analysis';
import { TOPIC_ANALYSIS_PROMPT } from './topic-analysis';
import type { PromptDefinition } from '../types';

export { UNTRUSTED_DATA_PREAMBLE } from './preamble';
export { ARTICLE_TYPE_PROMPT } from './article-type';
export { ARTICLE_STRUCTURE_PROMPT } from './article-structure';
export { TOPIC_ANALYSIS_PROMPT } from './topic-analysis';
export { QUALITY_ANALYSIS_PROMPT } from './quality-analysis';
export { CLAIM_EXTRACTION_PROMPT } from './claim-extraction';
export { FACT_EVALUATION_PROMPT } from './fact-evaluation';
export { AUTHORSHIP_ANALYSIS_PROMPT } from './authorship-analysis';

export const FOUNDATION_PROMPT_BUNDLE_VERSION = 'prompt-bundle-authorship-1';
export const CONTENT_PROMPT_BUNDLE_VERSION = FOUNDATION_PROMPT_BUNDLE_VERSION;
export const RESEARCH_PROMPT_BUNDLE_VERSION = FOUNDATION_PROMPT_BUNDLE_VERSION;
export const AUTHORSHIP_PROMPT_BUNDLE_VERSION = FOUNDATION_PROMPT_BUNDLE_VERSION;

export const FOUNDATION_PROMPTS: readonly PromptDefinition[] = [
  ARTICLE_TYPE_PROMPT,
  ARTICLE_STRUCTURE_PROMPT,
  TOPIC_ANALYSIS_PROMPT,
  QUALITY_ANALYSIS_PROMPT,
  CLAIM_EXTRACTION_PROMPT,
  FACT_EVALUATION_PROMPT,
  AUTHORSHIP_ANALYSIS_PROMPT,
];
