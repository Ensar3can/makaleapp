# ADR-016 Complete score via ScoringEngine

## Context

Phases 7–9 persisted structure, quality, topic, citation, evidence, factual reliability, and AI authorship risk as version-bound metrics. The product still needed a single overall score. Weights already live on `ScoringPolicy`. Routes and React must not calculate the mix. Originality was a quality weight without a persisted metric.

## Decision

- Domain `scoreOriginality` produces an internal uniqueness `ORIGINALITY` metric from the article body (lexical diversity, repeated n-grams, duplicate sentences). It is not an external plagiarism search.
- Domain `ScoringEngine` assembles the required metrics and calls `ScoringPolicy.evaluate`. Missing or duplicate required metrics fail closed (`IncompleteAnalysisScoreError`). Weights stay on the policy.
- `ProcessAnalysisJobUseCase` persists `ScoreSnapshot` from the engine after metrics are stored. Empty metric sets (the job-system fake analyzer) skip the snapshot. Partial metric sets fail the job and do not invent an overall score.
- The author editor displays the persisted snapshot. Authorship remains risk + confidence + classification with the disclaimer. No binary AI-written verdict.

## Alternatives

Calculate overall score in the API or React; persist a partial snapshot when originality is missing; treat originality as a corpus plagiarism score without a corpus.

## Consequences

`ScoreSnapshot` is the score source of truth for an `ArticleVersion`. Historical snapshots stay reproducible against `scoringPolicyVersion`. Phase 11 can rank public discovery by the persisted overall score.
