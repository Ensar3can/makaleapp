import type { ResearchProvider, ResearchResult, SourceLookupResult } from './types';

export const FAKE_RESEARCH_HOST = 'fake.research.local';

export interface FakeResearchProviderOptions {
  readonly results?: readonly ResearchResult[];
  readonly lookups?: Readonly<Record<string, SourceLookupResult>>;
}

export class FakeResearchProvider implements ResearchProvider {
  public constructor(private readonly options: FakeResearchProviderOptions = {}) {}

  public async search(query: string): Promise<ResearchResult[]> {
    if (this.options.results) {
      return [...this.options.results];
    }

    if (query.trim().length === 0) {
      return [];
    }

    return [];
  }

  public async lookup(url: string): Promise<SourceLookupResult> {
    const seeded = this.options.lookups?.[url];

    if (seeded) {
      return { ...seeded };
    }

    return {
      url,
      exists: false,
      blocked: false,
      status: 'not_found',
    };
  }
}
