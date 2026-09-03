# ADR-013 Content analysis

## Context

Phase 6 ran versioned prompts through fake providers and persisted only `AnalysisRun` metadata. Phase 7 needs real content analysis: preprocessing, article type, structure, topic relevance, and content quality. A complete `ScoreSnapshot` still lacks citation, evidence, factual reliability, originality, and authorship (Phases 8–10).

## Decision

- Preprocess the article version with a pure domain function (`preprocessArticle`). No model is involved.
- Classify type, then score structure against `ArticleEvaluationPolicy` for that type. Opinion and news articles are not punished for missing Methods.
- AI stages return validated observations. Domain `scoreContentAnalysis` converts those observations into `Score` values. Routes and React never calculate scores.
- Persist `AnalysisMetric` (STRUCTURE, CONTENT_QUALITY, TOPIC_RELEVANCE) and `AnalysisEvidence` on the `AnalysisRun`. Do not write `ScoreSnapshot` or an overall/quality score.
- `OpenAICompatibleProvider` is available after the fake pipeline and tests pass. The worker uses it only when `AI_PROVIDER=openai` and `AI_API_KEY` is set; the default remains `fake`.

## Alternatives

Ask one model for numeric scores; persist a partial `ScoreSnapshot` with invented citation/authorship values; call a vendor SDK from the worker without the `AIProvider` port.

## Consequences

Authors can inspect type-aware metric scores for the current `ArticleVersion`. Phase 8–10 can add remaining metrics and then assemble `ScoreSnapshot` through `ScoringEngine`.
