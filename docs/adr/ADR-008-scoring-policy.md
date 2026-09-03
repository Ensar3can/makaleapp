# ADR-008 ScoringPolicy owns weights and mix

## Context

Quality and authorship weights must stay explainable and changeable without rewriting analysis services. Final scores must not be calculated in React or API routes.

## Decision

`ScoringPolicy` is the only owner of metric weights, the quality/authorship mix, confidence threshold, and authorship classification bands. `ScoringPolicy.evaluate` produces `ComputedArticleScore`. A `ScoreSnapshot` stores the result against an `ArticleVersion` and policy version.

The initial Evidence & Citation 20% split is citation 10% + evidence 10% so both `ScoringEngine` inputs remain first-class. Authorship weight scales by `min(1, confidence / threshold)`.

## Alternatives

Hardcoded weights in analysis services; storing live scores only on `Article`.

## Consequences

Policy changes are versioned and historical snapshots stay reproducible. `ScoringEngine` in Phase 10 will assemble metrics; it will not embed weights.
