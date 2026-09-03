import { describe, expect, it } from 'vitest';
import { FAKE_RESEARCH_HOST, FakeResearchProvider } from './fake-research-provider';
import { SafeHttpFetcher } from './safe-http-fetcher';
import { SsrfGuardedResearchProvider } from './ssrf-guarded-research-provider';
import { SsrfBlockedError, SsrfUrlGuard } from './ssrf-url-guard';
import type { DnsResolver, HttpGetter } from './types';

const PUBLIC_DNS: DnsResolver = {
  lookup: async () => [{ address: '93.184.216.34', family: 4 }],
};

const LOOPBACK_DNS: DnsResolver = {
  lookup: async () => [{ address: '127.0.0.1', family: 4 }],
};

describe('FakeResearchProvider', () => {
  it('returns no sources by default so the pipeline cannot treat invented URLs as evidence', async () => {
    const provider = new FakeResearchProvider();

    expect(await provider.search('Queued Analysis')).toEqual([]);
    expect(await provider.lookup('https://invented.example/not-real')).toEqual({
      url: 'https://invented.example/not-real',
      exists: false,
      blocked: false,
      status: 'not_found',
    });
  });

  it('returns only explicitly seeded probe hits', async () => {
    const provider = new FakeResearchProvider({
      results: [{ url: `https://${FAKE_RESEARCH_HOST}/probe`, title: 'Untrusted probe' }],
      lookups: {
        [`https://${FAKE_RESEARCH_HOST}/probe`]: {
          url: `https://${FAKE_RESEARCH_HOST}/probe`,
          exists: true,
          blocked: false,
          status: 'ok',
          title: 'Untrusted probe',
        },
      },
    });

    expect(await provider.search('Queued Analysis')).toEqual([
      { url: `https://${FAKE_RESEARCH_HOST}/probe`, title: 'Untrusted probe' },
    ]);
    expect((await provider.lookup(`https://${FAKE_RESEARCH_HOST}/probe`)).exists).toBe(true);
  });
});

describe('SsrfUrlGuard', () => {
  it('blocks private hosts before any lookup is delegated', async () => {
    const guard = new SsrfUrlGuard(PUBLIC_DNS);

    await expect(guard.assertSafe('http://127.0.0.1/secret')).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(guard.assertSafe('http://169.254.169.254/latest/meta-data')).rejects.toBeInstanceOf(
      SsrfBlockedError,
    );
    await expect(guard.assertSafe('file:///etc/passwd')).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('blocks hostnames that resolve to loopback even when the name looks public', async () => {
    const guard = new SsrfUrlGuard(LOOPBACK_DNS);

    await expect(guard.assertSafe('https://evil.example/paper')).rejects.toMatchObject({
      message: /non-public address/,
    });
  });
});

describe('SsrfGuardedResearchProvider', () => {
  it('strips blocked search hits and never looks up private URLs', async () => {
    const inner = new FakeResearchProvider({
      results: [
        { url: 'https://example.org/paper', title: 'Public paper' },
        { url: 'http://127.0.0.1/secret', title: 'Loopback trap' },
      ],
    });
    const provider = new SsrfGuardedResearchProvider(inner, PUBLIC_DNS);

    expect(await provider.search('energy')).toEqual([
      { url: 'https://example.org/paper', title: 'Public paper' },
    ]);
    expect(await provider.lookup('http://169.254.169.254/latest/meta-data')).toEqual({
      url: 'http://169.254.169.254/latest/meta-data',
      exists: false,
      blocked: true,
      status: 'blocked',
    });
  });
});

describe('SafeHttpFetcher', () => {
  it('refuses redirects that land on a private address', async () => {
    const http: HttpGetter = {
      async get(url) {
        if (url === 'https://example.org/out') {
          return {
            status: 302,
            location: 'http://169.254.169.254/latest/meta-data',
            title: null,
            bodyBytes: 0,
          };
        }

        throw new Error(`unexpected fetch ${url}`);
      },
    };
    const fetcher = new SafeHttpFetcher({ dns: PUBLIC_DNS, http });

    await expect(fetcher.get('https://example.org/out')).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('fetches a public URL when DNS and redirects stay public', async () => {
    const http: HttpGetter = {
      async get(url) {
        expect(url).toBe('https://example.org/paper');
        return { status: 200, location: null, title: 'Paper', bodyBytes: 12 };
      },
    };
    const fetcher = new SafeHttpFetcher({ dns: PUBLIC_DNS, http });

    await expect(fetcher.get('https://example.org/paper')).resolves.toEqual({
      status: 200,
      location: null,
      title: 'Paper',
      bodyBytes: 12,
    });
  });
});
