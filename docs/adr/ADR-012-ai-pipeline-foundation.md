# ADR-012 AI pipeline foundation

## Context

Phase 5 verified claim, retry, and idempotency with `FakeArticleAnalyzer`. Phase 6 needs provider, prompt, validation, and usage abstractions before real content analysis (Phase 7) or paid vendor SDKs.

## Decision

- `AIProvider`, `AIAuthorshipDetector`, `PromptRegistry`, `StructuredOutputValidator`, `UsageTracker`, and `ArticleAnalysisPipeline` live in `@aip/ai`.
- `ResearchProvider` / `FakeResearchProvider` live in `@aip/research`. The pipeline depends on a structural `ResearchLookup` so `@aip/ai` does not import `@aip/research`.
- Application stays vendor-free. `PipelineArticleAnalyzer` adapts an `AnalysisPipeline` port onto `ArticleAnalyzer`. The worker composes fake deterministic providers.
- Prompts are versioned in `@aip/ai` and treat article text as untrusted data. Structured outputs are Zod-validated. Invalid JSON fails closed and is not a score of 0.
- The foundation pipeline writes only `AnalysisRun` metadata (pipeline/prompt/model/usage). It does not persist `ScoreSnapshot` or calculate an overall score.

## Alternatives

Call a vendor SDK from the worker; one giant prompt; keep `FakeArticleAnalyzer` until Phase 10.

## Consequences

Phase 7 can replace `FakeAIProvider` without changing job claim/retry. Authorship remains risk + confidence. Research hits from the fake provider are untrusted and unused as evidence.
