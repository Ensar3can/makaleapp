import { HttpUrlSafety, inspectHttpUrl, isBlockedIpAddress } from '@aip/domain';
import type { DnsResolver, ResolvedAddress } from './types';

export class SsrfBlockedError extends Error {
  public readonly retryable = false;

  public constructor(
    public readonly url: string,
    message: string,
  ) {
    super(message);
    this.name = 'SsrfBlockedError';
  }
}

export class SsrfUrlGuard {
  public constructor(private readonly dns: DnsResolver) {}

  public async assertSafe(raw: string): Promise<URL> {
    const parsed = this.assertSyntacticallySafe(raw);
    const addresses = await this.dns.lookup(parsed.hostname);

    if (addresses.length === 0) {
      throw new SsrfBlockedError(raw, `Hostname ${parsed.hostname} did not resolve`);
    }

    this.assertResolvedAddresses(raw, parsed.hostname, addresses);
    return parsed;
  }

  public assertSyntacticallySafe(raw: string): URL {
    const inspection = inspectHttpUrl(raw);

    if (inspection.safety !== HttpUrlSafety.SAFE || !inspection.href) {
      throw new SsrfBlockedError(raw, inspection.reason);
    }

    return new URL(inspection.href);
  }

  public assertResolvedAddresses(
    raw: string,
    hostname: string,
    addresses: readonly ResolvedAddress[],
  ): void {
    for (const resolved of addresses) {
      if (isBlockedIpAddress(resolved.address)) {
        throw new SsrfBlockedError(
          raw,
          `Hostname ${hostname} resolved to a non-public address`,
        );
      }
    }
  }
}
