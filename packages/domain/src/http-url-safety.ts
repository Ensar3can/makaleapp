import { HttpUrlSafety } from './enums';

export interface HttpUrlInspection {
  readonly raw: string;
  readonly safety: HttpUrlSafety;
  readonly href: string | null;
  readonly hostname: string | null;
  readonly reason: string;
}

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data',
]);

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home', '.corp'];

export function inspectHttpUrl(raw: string): HttpUrlInspection {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { raw, safety: HttpUrlSafety.INVALID, href: null, hostname: null, reason: 'URL is empty' };
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      raw,
      safety: HttpUrlSafety.INVALID,
      href: null,
      hostname: null,
      reason: 'URL could not be parsed',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      raw,
      safety: HttpUrlSafety.BLOCKED,
      href: parsed.href,
      hostname: parsed.hostname,
      reason: `Scheme ${parsed.protocol} is not allowed`,
    };
  }

  if (parsed.username.length > 0 || parsed.password.length > 0) {
    return {
      raw,
      safety: HttpUrlSafety.BLOCKED,
      href: parsed.href,
      hostname: parsed.hostname,
      reason: 'Embedded credentials are not allowed',
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname.length === 0) {
    return {
      raw,
      safety: HttpUrlSafety.INVALID,
      href: parsed.href,
      hostname: null,
      reason: 'Hostname is missing',
    };
  }

  if (isBlockedHostname(hostname)) {
    return {
      raw,
      safety: HttpUrlSafety.BLOCKED,
      href: parsed.href,
      hostname,
      reason: 'Hostname is not a public internet name',
    };
  }

  const literalIp = literalIpFromHostname(hostname);

  if (literalIp && isBlockedIpAddress(literalIp)) {
    return {
      raw,
      safety: HttpUrlSafety.BLOCKED,
      href: parsed.href,
      hostname,
      reason: 'Literal address is not a public internet address',
    };
  }

  return {
    raw,
    safety: HttpUrlSafety.SAFE,
    href: parsed.href,
    hostname,
    reason: 'Syntactically public HTTP(S) URL',
  };
}

export function normalizeHttpUrl(raw: string): string | null {
  const inspection = inspectHttpUrl(raw);

  if (inspection.safety !== HttpUrlSafety.SAFE || !inspection.href) {
    return null;
  }

  const parsed = new URL(inspection.href);
  parsed.hash = '';

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.href;
}

export function isTrustedSourceUrl(url: string, trustedUrls: readonly string[]): boolean {
  const normalized = normalizeHttpUrl(url);

  if (!normalized) {
    return false;
  }

  return trustedUrls.some((candidate) => normalizeHttpUrl(candidate) === normalized);
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();

  if (BLOCKED_HOSTS.has(host)) {
    return true;
  }

  return BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export function isBlockedIpAddress(address: string): boolean {
  const ipv4 = ipv4FromMapped(address);

  if (ipv4) {
    return isBlockedIpv4(ipv4);
  }

  return isBlockedIpv6(address);
}

export function literalIpFromHostname(hostname: string): string | null {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1);
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return hostname;
  }

  if (hostname.includes(':')) {
    return hostname;
  }

  return null;
}

function ipv4FromMapped(address: string): string | null {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) {
    return address;
  }

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);

  return mapped?.[1] ?? null;
}

function isBlockedIpv4(address: string): boolean {
  const parts = address.split('.').map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;

  if (a === undefined || b === undefined) {
    return true;
  }

  if (a === 0 || a === 10 || a === 127) {
    return true;
  }

  if (a === 169 && b === 254) {
    return true;
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }

  if (a === 192 && b === 168) {
    return true;
  }

  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }

  return false;
}

function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === '::' || normalized === '::1') {
    return true;
  }

  const first = parseIpv6FirstGroup(normalized);

  if (first === null) {
    return true;
  }

  if ((first & 0xfe00) === 0xfc00) {
    return true;
  }

  if ((first & 0xffc0) === 0xfe80) {
    return true;
  }

  if (first === 0) {
    return true;
  }

  return false;
}

function parseIpv6FirstGroup(address: string): number | null {
  const head = address.split(':')[0];

  if (!head || head.length === 0) {
    return 0;
  }

  if (!/^[0-9a-f]{1,4}$/i.test(head)) {
    return null;
  }

  return Number.parseInt(head, 16);
}
