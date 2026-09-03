export interface ResearchResult {
  readonly url: string;
  readonly title: string;
  readonly publisher?: string;
  readonly doi?: string;
  readonly snippet?: string;
}

export type SourceLookupStatus = 'ok' | 'blocked' | 'not_found' | 'error';

export interface SourceLookupResult {
  readonly url: string;
  readonly exists: boolean;
  readonly blocked: boolean;
  readonly status: SourceLookupStatus;
  readonly title?: string;
  readonly publisher?: string;
  readonly doi?: string;
}

export interface ResearchProvider {
  search(query: string): Promise<ResearchResult[]>;
  lookup(url: string): Promise<SourceLookupResult>;
}

export interface ResolvedAddress {
  readonly address: string;
  readonly family: 4 | 6;
}

export interface DnsResolver {
  lookup(hostname: string): Promise<readonly ResolvedAddress[]>;
}

export interface HttpRedirect {
  readonly status: number;
  readonly location: string | null;
}

export interface HttpGetResult {
  readonly status: number;
  readonly location: string | null;
  readonly title: string | null;
  readonly bodyBytes: number;
}

export interface HttpGetter {
  get(url: string): Promise<HttpGetResult>;
}
