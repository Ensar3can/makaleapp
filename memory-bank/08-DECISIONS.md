# Decisions

Short log. Full ADRs live in `docs/adr/`.

| ID | Decision |
| --- | --- |
| ADR-001 | Next.js App Router for web presentation |
| ADR-002 | Microsoft SQL Server + Prisma (native instance in Phase 0) |
| ADR-003 | Separate worker app; queue behind `IJobQueue` (BullMQ from Phase 5) |
| ADR-004 | `IObjectStorage`; LocalDisk in Phase 0, S3/Azure/MinIO later |
| ADR-005 | AI provider abstraction; no vendor in domain |
| ADR-006 | Analysis is versioned and bound to ArticleVersion |
| ADR-007 | AI authorship is risk + confidence, never binary |
| D-008 | Native Windows infra for Phase 0 (no Docker/WSL). Memurai instead of Redis. Local SQL Server. |
| D-009 | Node 22 LTS + pnpm workspaces + Turborepo |
| D-010 | Package name prefix `@aip/*` |
| D-011 | Phase 0 Redis uses `memory://` driver after Memurai MSI 1603; same `probeRedis` interface |
| D-012 | Phase 0 SQL probe uses `sqlcmd` + Windows auth; Prisma/TCP deferred to Phase 2 |
| D-013 | Use `corepack pnpm` plus repo `.bin/pnpm.cmd` because `corepack enable` cannot write Program Files |
| ADR-008 | `ScoringPolicy` owns weights and mix; `evaluate` produces `ComputedArticleScore` |
| D-014 | `ScoreSnapshot` is the score source of truth and is bound to `ArticleVersion`. `Article` does not own calculated scores |
| D-015 | Initial Evidence & Citation 20% is split citation 10% + evidence 10% |
| D-016 | Authorship mix weight scales by `min(1, confidence / threshold)` so low confidence cannot dominate |
| ADR-009 | Prisma SQL Server: NVARCHAR + CHECK instead of enums/JSON; no FK on `Article.currentVersionId`; scores stay on `ScoreSnapshot` |
| D-017 | Prisma connects to SQLEXPRESS over TCP 1433 with Windows integrated auth; `sqlcmd` still uses the named instance |
| D-018 | `aip` is the development database; `aip_test` is the integration-test database |
| D-019 | `docs/STITCH-UI-PROMPTS.md` is a Google Stitch mockup prompt set. Visual reference only; Stitch HTML/CSS is not product code |
| D-020 | Prisma SQL auth is Windows integrated. Mixed Mode is not required on the local SQLEXPRESS instance |
| ADR-010 | Opaque session cookies; scrypt password hashes; console `EmailSender`; in-memory rate limiter until Redis |
| D-021 | Session token is random; only SHA-256 (optional pepper) is stored. Never put auth tokens in localStorage |
| D-022 | Phase 4 `FakeAnalysisService` queues an `AnalysisJob` and moves the article to `QUEUED_FOR_ANALYSIS`. It does not run analysis or compute scores. The worker is Phase 5 |
| ADR-011 | Worker processes `AnalysisJob` through `IJobQueue` / poll. BullMQ when Redis; `memory://` uses durable job rows. `FakeArticleAnalyzer` writes `AnalysisRun` only |
| ADR-012 | Phase 6 pipeline lives in `@aip/ai` with fake providers, versioned prompts, schema validation, and usage tracking. Worker adapts it through `PipelineArticleAnalyzer`. No `ScoreSnapshot` |
| ADR-013 | Phase 7 scores structure, topic, and content quality in domain from type-aware observations. Persist `AnalysisMetric` / `AnalysisEvidence`. Default provider stays fake; OpenAI-compatible is opt-in. No `ScoreSnapshot` |
| ADR-014 | Phase 8 extracts claims, collects SSRF-safe sources, verifies citations, and scores citation/evidence/factual reliability in domain. Hallucinated URLs are dropped. No `ScoreSnapshot` |
| ADR-016 | Phase 10 ScoringEngine assembles persisted metrics into ScoreSnapshot. Originality is internal uniqueness. Incomplete metrics fail closed. UI reads the snapshot. |
| ADR-017 | Public discovery lists only PUBLISHED articles with a current-version ScoreSnapshot. Author publish composes ready+published. Token search on title/abstract; FTS deferred. Cursor pagination. |
| ADR-018 | Auto-flags move articles to REQUIRES_REVIEW without rejecting. Moderator APPROVE / REQUEST_REVISION / REJECT writes ModerationReview + AuditLog. Snapshot scores only. |
| D-027 | Worker research defaults to `FakeResearchProvider` wrapped in `SsrfGuardedResearchProvider`. Search hits and lookups that fail SSRF never become trusted evidence |
| D-026 | Worker `AI_PROVIDER` defaults to `fake`. `OpenAICompatibleProvider` is used only when `AI_PROVIDER=openai` and `AI_API_KEY` is set |
| D-023 | Domain owns retry (max 3) and claim (`saveIfStatus`). Duplicate queue deliveries are idempotent. Web does not import BullMQ; Next stays free of the optional Valkey client |
| D-024 | Application does not import `@aip/ai`. `PipelineArticleAnalyzer` takes an `AnalysisPipeline` port. `@aip/ai` uses a structural `ResearchLookup` so it does not import `@aip/research` |
| D-025 | ENSAR parked `docs/stitch-exports/stitch_scholarflow_design_system.zip`. Design pack is recorded only. Do not use until backend is complete and ENSAR approves a design/mapping phase. Stitch HTML is still not product code (D-019). |
| ADR-019 | Phase 13: CSP/security headers, Origin CSRF check, Redis rate limiter, operation quotas, AI cost cap, HTTPS profile URLs, prompt fences, upload inspection. Production requires SESSION_PEPPER. |
| ADR-020 | Phase 14: measure then optimize. Listing omits body; indexes from real predicates; CacheStore for public TTL cache; batched author/moderation lists; public HTTP cache. FTS stays deferred. |
| ADR-021 | Phase 15: structured logs with request/job correlation; persisted AiUsageRecord + OperationalEvent; admin-only SYSTEM_OBSERVE dashboard; authorized failed-job retry. No vendor APM. |
| ADR-022 | Phase 16: Docker Compose + production images; S3-compatible storage; Prisma readiness; migrate/backup/rollback docs; CI unit+build. Windows-native stays default. |
| ADR-023 | Design mapping: extract Stitch tokens into Tailwind/React chrome. Do not paste generated HTML. No admin CRUD screens without use cases. |
| D-026 | `PublicArticleDetail` exposes `id` so the existing `POST /api/admin/articles/:id/flag` can be used from the public article page. No new endpoint. Cards still omit `id`. |
| D-028 | Presentation toast store (no extra package). Same-page `showToast`; navigation uses sessionStorage flash (not auth tokens). Analysis-job retry is optimistic; article submit/publish wait for the API so poll cannot race. |
| D-029 | Presentation UI kit lives in `apps/web/components/ui`. Stitch CSS classes remain the visual tokens. Pages compose primitives; they do not invent new button/field/alert styles. |
| D-030 | Task 7: listing search debounces existing GET URLs (no new search API). User avatar URLs stay on native lazy `<img>` so the Next image optimizer cannot fetch untrusted hosts. Cursor “Load more” stays; infinite scroll was not added. |
| D-031 | Task 9: unauthenticated page guards redirect to `/login?next=` with a validated internal path. Open redirects and `/api`/`/_next`/auth loops fall back to `/dashboard`. `requirePageSession` rethrows non-auth failures instead of masking them as login. |
