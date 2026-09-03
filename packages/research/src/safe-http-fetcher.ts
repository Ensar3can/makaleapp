import { SsrfBlockedError, SsrfUrlGuard } from './ssrf-url-guard';
import type { DnsResolver, HttpGetResult, HttpGetter } from './types';

const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 512_000;

export interface SafeHttpFetcherOptions {
  readonly dns: DnsResolver;
  readonly http: HttpGetter;
  readonly maxRedirects?: number;
  readonly maxBytes?: number;
}

export class SafeHttpFetcher {
  private readonly guard: SsrfUrlGuard;
  private readonly http: HttpGetter;
  private readonly maxRedirects: number;
  private readonly maxBytes: number;

  public constructor(options: SafeHttpFetcherOptions) {
    this.guard = new SsrfUrlGuard(options.dns);
    this.http = options.http;
    this.maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
    this.maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  }

  public async get(url: string): Promise<HttpGetResult> {
    return this.getFollowing(url, 0);
  }

  private async getFollowing(url: string, depth: number): Promise<HttpGetResult> {
    const safe = await this.guard.assertSafe(url);
    const result = await this.http.get(safe.href);

    if (result.bodyBytes > this.maxBytes) {
      throw new SsrfBlockedError(url, 'Response exceeded the research fetch size limit');
    }

    if (result.status >= 300 && result.status < 400) {
      if (!result.location) {
        throw new SsrfBlockedError(url, 'Redirect was missing a Location header');
      }

      if (depth >= this.maxRedirects) {
        throw new SsrfBlockedError(url, 'Too many redirects');
      }

      const next = new URL(result.location, safe.href).href;
      return this.getFollowing(next, depth + 1);
    }

    return result;
  }
}
