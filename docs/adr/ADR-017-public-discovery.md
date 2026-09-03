# ADR-017 Public discovery from ScoreSnapshot

## Context

Phase 10 persisted `ScoreSnapshot` as the score source of truth. Phase 11 needs homepage, listing, detail, category, author, search, filters, cursor pagination, and SEO. Articles become public only after `PUBLISHED`. Moderation (ready vs review) is Phase 12. SQL Server Full-Text Search is not assumed to be installed on local SQLEXPRESS.

## Decision

- Public discovery reads only `PUBLISHED` articles that have a `ScoreSnapshot` bound to `currentVersionId`. Missing snapshots fail closed (the article is not listed).
- Ranking uses the persisted `overallScore` and `publishedAt`. Routes and React never mix weights.
- Author `PublishArticleUseCase` composes `ANALYSIS_COMPLETED` → `READY_FOR_PUBLICATION` → `PUBLISHED` when a snapshot exists. Flagging for review remains Phase 12.
- Search tokenizes title and abstract (bounded tokens, no full-body `%LIKE%`). SQL Server Full-Text Search is deferred until it is confirmed available (Phase 14).
- List pages use keyset/cursor pagination on score + publishedAt + id, not OFFSET.

## Alternatives

Auto-publish after analysis; rank in the Next.js page; `%LIKE%` over article body; OFFSET pagination; require SQL Server FTS in this phase.

## Consequences

Public pages can rank by snapshot score immediately. Authors publish after they see analysis. Unpublished drafts remain 404 by slug. FTS can replace token LIKE later without changing the use-case contract.
