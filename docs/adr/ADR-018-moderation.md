# ADR-018 Moderation queue from analysis flags

## Context

Phase 11 made `PUBLISHED` articles with a current-version `ScoreSnapshot` publicly discoverable. Analysis can still produce high authorship risk, suspicious citations, disputed claims, unsafe heuristics, spam, or exact content-hash duplicates. The product must not auto-reject those cases. Moderators (and admins) need a review queue, a version-bound decision record, and an audit trail. Routes and React must not calculate scores. Authorship stays risk + confidence + disclaimer.

## Decision

- Domain `evaluateModerationFlags` inspects the persisted snapshot, evidence, sources, version text, and exact `currentContentHash` duplicates. High authorship risk flags only when the ensemble classification is `high` and confidence meets `ScoringPolicy.authorshipConfidenceThreshold`. A single detector never flags.
- `ProcessAnalysisJobUseCase` completes analysis first, then moves the article to `REQUIRES_REVIEW` when flags exist. Flag reasons persist as `AnalysisEvidence` (`moderation-flag`) plus an `AuditLog` (`article.flagged`). Nothing is auto-rejected.
- Moderator decisions are `APPROVE` (ready, or restore `PUBLISHED` if it was public), `REQUEST_REVISION` (back to `DRAFT`, `publishedAt` cleared), and `REJECT` (`REJECTED`, `publishedAt` cleared). Each writes `ModerationReview` bound to `ArticleVersion` and `AuditLog` (`article.moderated`).
- Queue and detail views read scores only from `ScoreSnapshot`. Authors cannot publish while `REQUIRES_REVIEW`. Moderators can manually flag `ANALYSIS_COMPLETED` / `READY_FOR_PUBLICATION` / `PUBLISHED` articles.

## Alternatives

Auto-reject high risk; flag from a single detector; store flag reasons only in audit metadata; let authors publish during review; calculate overall score in the moderation page.

## Consequences

The review queue is the `REQUIRES_REVIEW` list. Historical decisions stay on `ModerationReview`. Public discovery still lists only `PUBLISHED` snapshots. Security hardening of the queue (Phase 13) can tighten IDOR and abuse cases further.
