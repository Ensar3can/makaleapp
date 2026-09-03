# ADR-005 AI provider abstraction

## Context

Analysis will call LLMs and later multiple vendors. Vendor lock-in would infect the domain.

## Decision

Depend on `AIProvider`, `ResearchProvider`, and `AIAuthorshipDetector` interfaces. No vendor SDK in domain or application.

## Alternatives

Call OpenAI directly from API routes.

## Consequences

Fake providers can test the pipeline. Real providers plug in from Phase 7 onward.
