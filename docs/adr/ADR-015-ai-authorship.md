# ADR-015 AI authorship

## Context

Phase 8 persisted citation, evidence, and factual-reliability metrics. AI authorship still needed an ensemble path. The product rule is risk + confidence + classification, never a binary `AI_WRITTEN` verdict. A single detector must not authorize a high-impact moderation decision. `ScoreSnapshot` remains Phase 10.

## Decision

- Individual detectors implement `AIAuthorshipDetector` and return observations only. The default worker detector is `StylometricAuthorshipDetector`. The authorship-analysis prompt contributes qualitative `model-signals`, not a score.
- Domain `AIAuthorshipAssessmentService` aggregates detector outputs. Disagreement and a single detector lower confidence. Classification comes from `ScoringPolicy`.
- Persist `AI_AUTHORSHIP_RISK` as an `AnalysisMetric` (score = risk, confidence = confidence) plus detector, signal, classification, and disclaimer evidence. Persist each detector output so a later policy can re-read it.
- The author editor displays persisted risk, confidence, classification, signals, and the disclaimer. Routes and React never calculate scores or invent a human/AI verdict.

## Alternatives

Ask one model for a true/false AI-written label; persist only the aggregated risk and drop detector rows; treat stylometric uniformity as proof; write `ScoreSnapshot` in this phase.

## Consequences

Authors can inspect AI authorship risk for the current `ArticleVersion` with an explicit disclaimer. Phase 10 can fold the persisted risk and confidence into `ScoringEngine` / `ScoreSnapshot`.
