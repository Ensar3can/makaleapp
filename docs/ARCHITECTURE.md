# Architecture

Article Intelligence Platform is a modular content-intelligence system. Next.js delivers the web application. A separate worker runs long analysis jobs. Microsoft SQL Server stores durable data. Redis (Memurai on Windows) will back queues and rate limits. Object storage is behind `IObjectStorage`.

## Dependency rule

Dependencies point inward.

Domain ← Application ← Infrastructure ← Presentation

Domain contains entities, value objects, scoring rules, and repository interfaces. It must not import Prisma, Next.js, Redis, React, AI SDKs, or storage SDKs.

Application contains use cases and orchestration against interfaces.

Infrastructure packages implement those interfaces.

Presentation (`apps/web`) stays thin.

`eslint-plugin-boundaries` enforces package boundaries.

## Repository layout

```
apps/web
apps/worker
packages/domain
packages/application
packages/database
packages/ai
packages/research
packages/storage
packages/queue
packages/validation
packages/config
packages/logging
packages/testing
packages/auth
packages/cache
docs/
memory-bank/
```

## Analysis ownership

An analysis belongs to an `ArticleVersion`, not an `Article`. Editing content creates a new version and invalidates the previous publication score.

## Scoring

`ScoringPolicy` owns versioned weights and applies them. `ScoringEngine` assembles metrics from an analysis run and calls `ScoringPolicy.evaluate`. UI and API routes never calculate scores.

Initial quality mix: structure 20%, content 20%, topic 15%, citation 10%, evidence 10%, factual reliability 15%, originality 10%. Final mix: quality 85% + authorship integrity 15%. Confidence below the policy threshold scales the authorship weight down so low-confidence detection cannot dominate.

`ScoreSnapshot` is the source of truth for a published score and is bound to `ArticleVersion`. `Article` does not own calculated scores.

AI authorship is `risk + confidence + classification`, never a binary verdict.

## Article lifecycle

Validated transitions only. Primary path: DRAFT → SUBMITTED → QUEUED_FOR_ANALYSIS → PROCESSING → ANALYSIS_COMPLETED → READY_FOR_PUBLICATION → PUBLISHED. Analysis completion may also go to REQUIRES_REVIEW (automatic flags) or REJECTED. Moderators approve (`READY_FOR_PUBLICATION` or restore `PUBLISHED`), request revision (`DRAFT`), or reject. Additional states: ANALYSIS_FAILED, ARCHIVED, REMOVED.

## Phase 0 infrastructure

- SQL Server: existing local named instance, Windows integrated auth, `sqlcmd` probe
- Redis: `IJobQueue` / `probeRedis`. `memory://` driver until Memurai is installed
- Storage: `IObjectStorage` with `local-disk` (Windows default) or S3-compatible MinIO/AWS
- Queue: `IJobQueue` with `InMemoryJobQueue` and a BullMQ adapter when `REDIS_URL` is a Redis URL

## Phase 3 authentication

Use cases live in `@aip/application`. `@aip/auth` hashes passwords with scrypt, hashes session tokens, and provides an in-memory rate limiter plus console email. Presentation only sets the HttpOnly session cookie and maps typed errors. Roles are USER, MODERATOR, and ADMIN. Scores are still never calculated in routes or React.

## Phase 4 article management

Authors create drafts and edit them through use cases. Title, abstract, and body live on `ArticleVersion`. A content change creates a new version and invalidates prior publication eligibility. Submit calls `FakeAnalysisService`, which stores an `AnalysisJob` in `QUEUED`, moves the article to `QUEUED_FOR_ANALYSIS`, and dispatches `analyze-article` through `IJobQueue`. No scores are computed.

## Phase 5 job system

`apps/worker` processes `AnalysisJob` rows. Redis + BullMQ is the fast path when `REDIS_URL` is a Redis URL. The worker also polls due `QUEUED` jobs so analysis still runs on `memory://`. `ProcessAnalysisJobUseCase` claims a job once (`saveIfStatus`), runs `PipelineArticleAnalyzer` over `ArticleAnalysisPipeline`, writes an `AnalysisRun`, and moves the article to `ANALYSIS_COMPLETED` or `ANALYSIS_FAILED`. Retry is domain-owned (max 3). Duplicate queue deliveries are idempotent. Routes and React still never calculate scores.

## Phase 6 AI pipeline foundation

`@aip/ai` owns `AIProvider`, `PromptRegistry`, `StructuredOutputValidator`, `UsageTracker`, `AIAuthorshipDetector`, and `ArticleAnalysisPipeline`. `@aip/research` owns `ResearchProvider` with SSRF guards. The worker defaults to `FakeAIProvider` and `FakeResearchProvider` (SSRF-wrapped). `OpenAICompatibleProvider` is used only when configured. Phase 8 persists citation, evidence, and factual-reliability metrics plus collected `SourceReference` rows. Hallucinated source URLs are never trusted. Phase 9 persists `AI_AUTHORSHIP_RISK` from an ensemble (stylometric + model signals) through domain `AIAuthorshipAssessmentService`. Authorship is risk + confidence + classification, never a binary verdict. Phase 10 persists `ScoreSnapshot` through `ScoringEngine`. Phase 11 public discovery ranks `PUBLISHED` articles by that snapshot. Phase 12 flags high-confidence review signals into `REQUIRES_REVIEW` without auto-rejecting; moderators approve, request revision, or reject, and those actions are audited. Phase 13 hardens headers, CSRF origin checks, Redis-backed operation rate limits, AI cost budgets, HTTPS profile URLs, prompt fencing, and upload inspection. Phase 14 measures discovery, listing, and job-poll queries, then adds matching indexes, a `CacheStore` port (`memory://` or Redis), listing queries that omit article bodies, batched author/moderation reads, and short-lived public HTTP cache. SQL Server Full-Text Search stays deferred until it is installed. Phase 15 adds request-correlated structured logs, persisted AI usage and operational events, worker heartbeats, and an admin-only observability dashboard with authorized failed-job retry. Phase 16 adds production Docker images, S3-compatible object storage, Prisma readiness probes, migration/backup/rollback docs, and CI. Authorship is risk + confidence + classification, never a binary verdict.

## Phase 2 persistence

Prisma owns the SQL Server schema in `@aip/database`. Repositories implement domain interfaces and reconstitute entities. `Article` does not store title, body, or scores. `ScoreSnapshot` is bound to `ArticleVersion`. Prisma connects to SQLEXPRESS on TCP 1433 with Windows integrated auth. The SQL Server connector stores statuses as `NVARCHAR` plus CHECK constraints.
