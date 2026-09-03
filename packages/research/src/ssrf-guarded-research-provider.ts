import { HttpUrlSafety, inspectHttpUrl } from '@aip/domain';
import { SsrfBlockedError, SsrfUrlGuard } from './ssrf-url-guard';
import type { DnsResolver, ResearchProvider, ResearchResult, SourceLookupResult } from './types';

export class SsrfGuardedResearchProvider implements ResearchProvider {
  private readonly guard: SsrfUrlGuard;

  public constructor(
    private readonly inner: ResearchProvider,
    dns: DnsResolver = { lookup: async () => [{ address: '8.8.8.8', family: 4 }] },
  ) {
    this.guard = new SsrfUrlGuard(dns);
  }

  public async search(query: string): Promise<ResearchResult[]> {
    const results = await this.inner.search(query);
    const allowed: ResearchResult[] = [];

    for (const result of results) {
      if (inspectHttpUrl(result.url).safety !== HttpUrlSafety.SAFE) {
        continue;
      }

      try {
        await this.guard.assertSafe(result.url);
        allowed.push(result);
      } catch (error) {
        if (error instanceof SsrfBlockedError) {
          continue;
        }

        throw error;
      }
    }

    return allowed;
  }

  public async lookup(url: string): Promise<SourceLookupResult> {
    const inspection = inspectHttpUrl(url);

    if (inspection.safety !== HttpUrlSafety.SAFE) {
      return {
        url,
        exists: false,
        blocked: true,
        status: 'blocked',
      };
    }

    try {
      await this.guard.assertSafe(url);
    } catch (error) {
      if (error instanceof SsrfBlockedError) {
        return {
          url,
          exists: false,
          blocked: true,
          status: 'blocked',
        };
      }

      throw error;
    }

    return this.inner.lookup(url);
  }
}
