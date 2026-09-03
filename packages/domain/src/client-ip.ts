const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

export function parseClientIp(
  forwardedFor: string | null | undefined,
  realIp?: string | null,
): string {
  const firstForwarded = forwardedFor?.split(',')[0]?.trim();

  if (firstForwarded && isValidIpAddress(firstForwarded)) {
    return stripIpv6Brackets(firstForwarded);
  }

  const fallback = realIp?.trim();

  if (fallback && isValidIpAddress(fallback)) {
    return stripIpv6Brackets(fallback);
  }

  return 'unknown';
}

export function isValidIpAddress(value: string): boolean {
  const address = stripIpv6Brackets(value.trim());

  if (IPV4.test(address)) {
    return address.split('.').every((part) => {
      const octet = Number(part);
      return Number.isInteger(octet) && octet >= 0 && octet <= 255;
    });
  }

  return address.includes(':') && IPV6.test(address) && address.length <= 45;
}

function stripIpv6Brackets(value: string): string {
  return value.startsWith('[') && value.endsWith(']') ? value.slice(1, -1) : value;
}
