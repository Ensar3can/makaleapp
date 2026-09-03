# Project Brief

Production web platform: users publish articles that are AI-evaluated before public discovery. Ranked primarily by evaluation score. Scoring must be explainable, not unexplained numbers.

## Core loop (MVP)

User creates profile → submits article → analysis runs async → quality + AI authorship risk generated → user views detailed analysis → article published → others discover/filter/search.

## Scoring model

Academic/Editorial Quality (0–100), initial weights (config, not hardcoded):

| Metric | Weight |
| --- | --- |
| Structure Compliance | 20% |
| Content Quality | 20% |
| Topic Relevance | 15% |
| Citation Quality | 10% |
| Evidence | 10% |
| Factual Reliability | 15% |
| Originality / Similarity | 10% |

AuthorshipIntegrityScore = 100 − AIAuthorshipRisk.

FinalScore = QualityScore × 0.85 + AuthorshipIntegrityAdjustedScore × 0.15.

If AI confidence is low, authorship must not heavily alter the final score. All calculation lives in domain/application. Owned by `ScoringPolicy` / `ScoringEngine`.

## AI authorship principle

Never binary `AI_WRITTEN = true/false`. Use `AIAuthorshipAssessment`:

- `aiRiskScore` 0–100
- `confidenceScore` 0–100
- `classification`: very_low | low | uncertain | elevated | high
- `signals[]`, `explanation`, `modelVersion`, `detectorVersion`, `createdAt`

UI language: "AI authorship risk". One detector never auto-makes a high-impact moderation decision.

## Article lifecycle

DRAFT → SUBMITTED → QUEUED_FOR_ANALYSIS → PROCESSING → ANALYSIS_COMPLETED → READY_FOR_PUBLICATION | REQUIRES_REVIEW | REJECTED → PUBLISHED.

Additional: ANALYSIS_FAILED, ARCHIVED, REMOVED.

Explicit status enum. Validated transitions. No boolean flags like `isPublished`.

Analysis belongs to **ArticleVersion**, not Article. Content change requires re-analysis.

## Roles

USER, MODERATOR, ADMIN. Server-side RBAC always. Never frontend-only authz.

## Critical principles

Explainability, reproducibility (pipeline/prompt/policy versions), fairness, security (article + web research are untrusted data), async analysis, maintainability, observability, cost control, versioning.
