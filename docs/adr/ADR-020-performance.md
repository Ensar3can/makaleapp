# ADR-020 Performance: measure, then optimize

## Context

Phase 13 hardened security. Public discovery, author dashboards, moderation queues, and the worker poll were live. The masterplan required benchmarking real paths before adding cache or indexes. SQL Server Full-Text Search was deferred from ADR-017 until Phase 14 could confirm it on local SQLEXPRESS.

Measured query patterns:

- Homepage and listing selected `ArticleVersion.content` (`NVARCHAR(MAX)`) only to estimate reading minutes.
- Worker `findDueQueued` filtered `status + queuedAt` while only `status` was indexed.
- Author dashboard ordered by `updatedAt`; moderation queue listed `REQUIRES_REVIEW` by `updatedAt`; language-filtered discovery used `status + language + publishedAt`.
- Author list loaded taxonomy per article. Moderation queue loaded version/profile/snapshot/runs/evidence per row.
- Public article pages fetched the same detail twice (`generateMetadata` + page).
- `FULLTEXTSERVICEPROPERTY('IsFullTextInstalled')` is probed; FTS is not assumed.

## Decision

- Listing/search SQL omits article body and computes a whitespace token count in SQL. Detail still loads content. Cards use `wordCount`, not `version.content`.
- Composite indexes match those predicates: `Article(status, language, publishedAt)`, `Article(authorId, updatedAt)`, `Article(status, updatedAt)`, `AnalysisJob(status, queuedAt)`, `Category(isActive, name)`.
- `CacheStore` is an application port. `@aip/cache` implements in-memory and Redis stores. Redis failures fail open. Personalized and auth routes are not cached.
- Public homepage, first-page listings (no tokens/cursor), categories, and article detail use short TTLs. Publish, moderate, and flag invalidate those keys.
- Public GET/HEAD pages send `Cache-Control: public, s-maxage=30, stale-while-revalidate=120`. Dashboard, auth, and API stay uncached.
- Author and moderation lists batch repository reads. Token search on title/abstract stays; FTS remains deferred until a catalog is installed and ENSAR approves a search swap.

## Alternatives

Blind Redis caching of every search token; OFFSET pagination; `%LIKE%` over article body; requiring FTS on SQLEXPRESS; persisting `wordCount` as a new column in this phase.

## Consequences

Homepage and listing no longer ship article bodies over the wire. Multi-instance web processes share cache when `REDIS_URL` is Redis. Scores still come only from `ScoreSnapshot`. Authorship remains risk + confidence + disclaimer. Search contract is unchanged so FTS can replace token LIKE later.
