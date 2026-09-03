export const UNTRUSTED_DATA_FENCE_BEGIN = '<<<UNTRUSTED_ARTICLE_DATA>>>';
export const UNTRUSTED_DATA_FENCE_END = '<<<END_UNTRUSTED_ARTICLE_DATA>>>';

export function sanitizeUntrustedText(value: string): string {
  return [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      const isC0 = code < 32 && code !== 9 && code !== 10 && code !== 13;
      const isC1 = code >= 127 && code <= 159;
      return !isC0 && !isC1;
    })
    .join('');
}

export function fenceUntrustedPayload(value: unknown): string {
  const serialized = sanitizeUntrustedText(JSON.stringify(value));
  return `${UNTRUSTED_DATA_FENCE_BEGIN}\n${serialized}\n${UNTRUSTED_DATA_FENCE_END}`;
}

export function escapeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
}
