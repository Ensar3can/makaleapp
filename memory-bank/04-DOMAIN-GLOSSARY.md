# Domain Glossary

## Roles

USER, MODERATOR, ADMIN

## ArticleStatus

DRAFT, SUBMITTED, QUEUED_FOR_ANALYSIS, PROCESSING, ANALYSIS_COMPLETED, READY_FOR_PUBLICATION, REQUIRES_REVIEW, REJECTED, PUBLISHED, ANALYSIS_FAILED, ARCHIVED, REMOVED

## AnalysisJobStatus

QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED

## AnalysisRunStatus

PENDING, RUNNING, COMPLETED, FAILED

## UserStatus

ACTIVE, SUSPENDED, DELETED

## Core entities

User, Profile, Category, Tag, Article, ArticleVersion, ArticleFile, ArticleCategory, ArticleTag, AnalysisJob, AnalysisRun, AnalysisMetric, AnalysisEvidence, SourceReference, ScoreSnapshot, ModerationReview, Bookmark, ArticleView, AuditLog, AiUsageRecord, OperationalEvent

## Metric types

STRUCTURE, CONTENT_QUALITY, TOPIC_RELEVANCE, CITATION_QUALITY, EVIDENCE, FACTUAL_RELIABILITY, ORIGINALITY, AI_AUTHORSHIP_RISK

## Scoring terms

- `Score` — value object, always 0 ≤ n ≤ 100
- `ScoringPolicy` — versioned weights
- `QualityScore` — weighted editorial/academic score
- `AIAuthorshipRisk` — 0 low AI signals, 100 high
- `AuthorshipIntegrityScore` — 100 − risk, confidence-adjusted
- `FinalScore` / `overallScore` — quality 85% + authorship integrity 15% (configurable; authorship weight scales by confidence)
- Citation and evidence are separate 10% + 10% weights (not a single 20% bucket)

## Authorship classification

very_low, low, uncertain, elevated, high

## Claim verification

SUPPORTED, PARTIALLY_SUPPORTED, DISPUTED, UNVERIFIED, OUTDATED

Citation verification: verified, partially_verified, unverified, suspicious, broken

## Invariant

Analysis is bound to ArticleVersion. Editing content creates a new version and invalidates the previous score for publication.

`ScoreSnapshot` is the persisted score source of truth. `Article` does not store title, body, or calculated scores.
