# ADR-014 Research engine

## Context

Phase 7 scored structure, topic, and content quality from observations. Citation quality, evidence, and factual reliability still need a research path. Article citations and retrieved pages are untrusted. A model that invents URLs must not turn those URLs into trusted evidence. Fetching author-supplied URLs is an SSRF risk.

## Decision

- Extract important verifiable claims with a versioned prompt. Limit verification to `CLAIM_VERIFICATION_BUDGET`.
- Collect sources only from `ResearchProvider.search` / `lookup` after SSRF checks. Domain `inspectHttpUrl` blocks private hosts and non-HTTP schemes; `@aip/research` re-resolves DNS and blocks redirects to non-public addresses.
- Verify extracted citations against provider lookup. A missing page is `unverified` or `broken`, never automatically false.
- Fact-evaluation may only cite collected source URLs. Domain scoring drops any other URL and records `rejected-untrusted-url` evidence.
- Persist `CITATION_QUALITY`, `EVIDENCE`, and `FACTUAL_RELIABILITY` metrics plus `SourceReference` rows. Do not write `ScoreSnapshot` or an overall score.
- Default research remains `FakeResearchProvider` wrapped in `SsrfGuardedResearchProvider`. Opinion articles are not punished for missing citations.

## Alternatives

Trust model-emitted URLs; fetch citation URLs without DNS/IP checks; treat unverified claims as false; write a partial `ScoreSnapshot`.

## Consequences

Authors can inspect citation, evidence, and factual-reliability scores for the current `ArticleVersion`. Phase 9 adds authorship metrics. Phase 10 can assemble `ScoreSnapshot` through `ScoringEngine`.
