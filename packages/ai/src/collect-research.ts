import {
  CitationVerificationStatus,
  HttpUrlSafety,
  SourceType,
  inspectHttpUrl,
  type CitationCheck,
  type CollectedSource,
  type ExtractedClaim,
} from '@aip/domain';
import type { ResearchLookup } from './types';

const DOI_PATTERN = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

export async function collectClaimSources(
  claims: readonly ExtractedClaim[],
  research: ResearchLookup,
): Promise<CollectedSource[]> {
  const collected = new Map<string, CollectedSource>();

  for (const claim of claims) {
    const hits = await research.search(claim.text);

    for (const hit of hits) {
      const inspection = inspectHttpUrl(hit.url);

      if (inspection.safety !== HttpUrlSafety.SAFE || !inspection.href) {
        continue;
      }

      collected.set(inspection.href, {
        url: inspection.href,
        title: hit.title,
        publisher: hit.publisher,
        doi: hit.doi,
        sourceType: hit.doi ? SourceType.DOI : SourceType.WEB,
      });
    }
  }

  return [...collected.values()];
}

export async function verifyExtractedCitations(
  urls: readonly string[],
  citations: readonly string[],
  research: ResearchLookup,
): Promise<CitationCheck[]> {
  const checks: CitationCheck[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    const check = await verifyOneCitation(url, url, research);
    const key = check.url ?? url;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    checks.push(check);
  }

  for (const citation of citations) {
    if (!DOI_PATTERN.test(citation)) {
      continue;
    }

    const doiUrl = `https://doi.org/${citation}`;
    const check = await verifyOneCitation(citation, doiUrl, research);
    const key = check.url ?? doiUrl;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    checks.push(check);
  }

  return checks;
}

async function verifyOneCitation(
  citation: string,
  url: string,
  research: ResearchLookup,
): Promise<CitationCheck> {
  const inspection = inspectHttpUrl(url);

  if (inspection.safety !== HttpUrlSafety.SAFE || !inspection.href) {
    return {
      citation,
      url,
      doi: DOI_PATTERN.test(citation) ? citation : null,
      status: CitationVerificationStatus.SUSPICIOUS,
      title: null,
      publisher: null,
      blocked: true,
    };
  }

  const lookup = await research.lookup(inspection.href);

  if (lookup.blocked) {
    return {
      citation,
      url: inspection.href,
      doi: lookup.doi ?? (DOI_PATTERN.test(citation) ? citation : null),
      status: CitationVerificationStatus.SUSPICIOUS,
      title: lookup.title ?? null,
      publisher: lookup.publisher ?? null,
      blocked: true,
    };
  }

  return {
    citation,
    url: inspection.href,
    doi: lookup.doi ?? (DOI_PATTERN.test(citation) ? citation : null),
    status: lookup.exists
      ? CitationVerificationStatus.PARTIALLY_VERIFIED
      : CitationVerificationStatus.UNVERIFIED,
    title: lookup.title ?? null,
    publisher: lookup.publisher ?? null,
    blocked: false,
  };
}
