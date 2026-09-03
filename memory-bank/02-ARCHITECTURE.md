# Architecture

Dependencies point inward: Domain ← Application ← Infrastructure ← Presentation.

## Layers

**Domain** — entities, value objects, domain services/rules, scoring logic, domain errors, repository interfaces. Must NOT import Prisma, Next.js, Redis, OpenAI SDK, React, HTTP libs, storage SDKs.

**Application** — use cases, commands, queries, DTOs, orchestration, interfaces for external services (`SubmitArticle`, `AnalyzeArticle`, `PublishArticle`, `SearchArticles`, `CalculateArticleScore`, `ModerateArticle`).

**Infrastructure** — Prisma repositories, MSSQL, Redis, AI providers, object storage, research APIs, logging, queue implementations.

**Presentation** — Next.js routes, React components, API handlers, view models. No business logic.

## Apps and packages

```
apps/web          Next.js App Router (presentation)
apps/worker       background analysis worker
packages/domain
packages/application
packages/database Prisma + repositories
packages/ai
packages/research
packages/storage  IObjectStorage (+ LocalDisk for Phase 0)
packages/queue    IJobQueue (+ InMemory + BullMQ)
packages/validation
packages/config   typed env via Zod
packages/logging
packages/testing
packages/auth
packages/cache
```

## Modules

Auth, Users, Profiles, Articles, Categories, Tags, Analysis, Research, Scoring, Moderation, Discovery, Administration, Observability.

Each module exposes public interfaces. No circular dependencies.

## Infrastructure (Windows native)

- MSSQL: local SQLEXPRESS. Prisma uses TCP 1433 + Windows integrated auth. `sqlcmd` still uses `.\SQLEXPRESS`. Databases: `aip` (dev), `aip_test` (integration).
- Redis protocol: Memurai Developer Edition; `memory://` until Memurai is installed
- Object storage: `IObjectStorage` (`LocalDiskObjectStorage` or S3-compatible)
- Queue: `IJobQueue` / `IJobWorker`. BullMQ when `REDIS_URL` is Redis; worker also polls due `AnalysisJob` rows

## Persistence (Phase 2)

Prisma schema and repositories live in `@aip/database` and implement domain interfaces. `Article` stores identity, slug, language, status, and `currentVersionId`. Title/abstract/content live on `ArticleVersion`. Calculated scores live on `ScoreSnapshot` (bound to `ArticleVersion`). SQL Server has no Prisma enums or JSON: statuses are `NVARCHAR` + CHECK; policy weights are JSON text.

UI mockups may be produced in Google Stitch from `docs/STITCH-UI-PROMPTS.md`. Stitch output is visual reference only; presentation stays thin and never calculates scores.

Authentication (Phase 3) uses opaque session cookies, scrypt password hashes, domain RBAC, and application use cases. Routes do not contain login rules.

Article management (Phase 4) creates versioned drafts, assigns categories/tags, and submits through `FakeAnalysisService`. Phase 5 worker claims the job and writes an `AnalysisRun`. Phase 6 replaces the stub analyzer with `ArticleAnalysisPipeline` (fake providers, `PromptRegistry`, schema validation, usage tracking). Phase 10 persists `ScoreSnapshot` through `ScoringEngine`. Phase 11 public discovery ranks `PUBLISHED` articles by that snapshot. Routes and React still never calculate scores.

## Analysis flow

Submit → validate → persist article + AnalysisJob → enqueue → worker processes → persist scores → update status → frontend polls/receives status.

Never wait on the client HTTP request for full analysis.

## Enforcement

`eslint-plugin-boundaries` forbids domain importing infrastructure/presentation.
