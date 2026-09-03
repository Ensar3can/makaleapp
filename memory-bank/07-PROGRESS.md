# Progress

Append-only. Newest entries at the top.

## 2026-09-03 — Vercel preview host

ENSAR asked for a browser URL on Vercel, with the repo also on GitHub.

- GitHub remains the source of truth: `https://github.com/Ensar3can/makaleapp` (public)
- Vercel project `ensar-ueccan/makaleapp` is linked to that GitHub repo, root `apps/web`
- Production boot on Vercel allows in-memory Redis only because `VERCEL=1` (D-032)
- SQL Server, worker, and SMTP are not on Vercel; discovery pages will not have live article data until Wave A has a real database host

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm test` — pass (281 / 52)
- `pnpm build` — pass

## 2026-09-03 — GitHub sync + post-v1.0 backlog

ENSAR asked to publish the repo to GitHub and keep `main` current, plus a gap list and a plan.

- Remote: `https://github.com/Ensar3can/makaleapp.git` (private; was empty)
- First commit `1ac8980` on GitHub `main`; local `master` tracks `origin/main`
- CI: `.github/workflows/ci.yml` on push/PR
- Tracking issue: https://github.com/Ensar3can/makaleapp/issues/1
- Root duplicate Stitch zip gitignored; `.env` files stay untracked
- Post-v1.0 waves A–D recorded in `05-PHASE-PLAN.md` (SMTP / Compose / env / AI; e2e; reserved product; optional FTS)

No product code. Quality gate not re-run (report/docs/git only).

## 2026-08-31 — Production frontend Task 10

ENSAR approved Task 10. Final report only; no product code.

Gate results: not a development task. Last quality gate remains Task 9: lint, typecheck, 281 / 52 tests, production build pass.

Report: scoped v1.0 product is complete (backend 0–16 + frontend tasks 1–9). Public go-live is blocked by console `EmailSender`. No known critical code defects. Score **86/100**. Full report is in the Task 10 session reply (Tamamlananlar / Eksik kalanlar / Backend bekleyenler / Opsiyonel / go-live / kritik hata / puan).

## 2026-08-31 — Production frontend Task 9

ENSAR approved Task 9. Walked the production-ready flow checklist on existing APIs and closed the login return-path gap.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate reused locked client)
- `pnpm test` — pass (281 / 52), including `safeInternalPath` / login href and catalog filter/pagination URL helpers
- `pnpm build` — pass (Next.js 15.5.24; `/icon.svg` added)

Shipped: validated `next` after login; signed-in users redirected from login/register; `requirePageSession` only treats `UnauthenticatedError` as a login redirect; auth page titles + noindex; verify-email Sign in link; app icon. No new APIs. Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Login return path and open-redirect rejection are covered by unit tests. Live click-through of login → editor was not run here.

## 2026-08-31 — Production frontend Task 8

ENSAR approved Task 8. Extracted repeated reserved pages and analysis labels; removed unused internal exports; replaced leftover slate chrome with Stitch tokens.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate reused locked client)
- `pnpm test` — pass (275 / 50), including shared authorship/metric labels
- `pnpm build` — pass (Next.js 15.5.24)

Shipped: `ReservedPage` for six coming-soon routes; `metricLabel` / `authorshipClassificationLabel`; editor, analysis, and moderation share those labels; leftover `text-slate-*` on editor/moderation/admin/auth chrome mapped to `ink`/`muted`/`line`. Dialog and ScoreBadge kept as Task 5 primitives. No new APIs. Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session.

## 2026-08-31 — Production frontend Task 7

ENSAR approved Task 7. Added skeleton variants, debounced catalog/header search, lazy images and code-split editor/flag form, skip link, landmarks, keyboard focus trap, and ARIA on chrome.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate reused locked client)
- `pnpm test` — pass (273 / 49), including debounce, live-search URL, and tab-wrap helpers
- `pnpm build` — pass (Next.js 15.5.24)

Shipped: `SkipLink` + `MainContent`; HeaderNav dialog focus trap; 400ms debounce on existing GET search/listing URLs; `PageSkeleton` catalog/article/form variants; lazy avatars; dynamic `ArticleEditor` / `FlagArticleForm`. Infinite scroll not added (cursor “Load more” remains). No new APIs. Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session.

## 2026-08-31 — Production frontend Task 6

ENSAR approved Task 6. Completed responsive layout at 320/375/768/1024/1440/1920 and added the missing mobile menu.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate reused locked client)
- `pnpm test` — pass (268 / 48), including HeaderNav breakpoint token
- `pnpm build` — pass (Next.js 15.5.24)

Shipped: `HeaderNav` drawer below 1024px on public/dashboard/settings chrome; catalog filters collapse under `lg`; tables scroll; type/toast/rail/card overflow fixes. No new APIs. Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session.

## 2026-08-31 — Production frontend Task 5

ENSAR approved Task 5. Extracted a shared Stitch UI kit under `apps/web/components/ui` and wired forms, chrome, empty/error/404/500, tables, and pagination to it.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate reused locked client)
- `pnpm test` — pass (267 / 48), including UI token class maps
- `pnpm build` — pass (Next.js 15.5.24)

Shipped: Button/ButtonLink (incl. danger), Card, Text/Select/Textarea/Checkbox/Radio fields, Alert/FormStatus, EmptyState, DataTable, Pagination, CatalogLayout, AppHeader, SideNav/TabNav, StatusPage, Dialog surface. ScoreGauge gained a readable name. No new APIs. Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session.

## 2026-08-30 — Production frontend Task 4

ENSAR approved Task 4. Added missing Stitch screens as empty / reserved pages, with no mock data. Author analysis uses the existing `GetAuthorArticleUseCase`.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate EPERM reused locked client)
- `pnpm test` — pass (263 / 47)
- `pnpm build` — pass (Next.js 15.5.24; new analysis, admin, settings, and notifications routes)

Shipped: `/dashboard/articles/[id]/analysis` (persisted metrics + snapshot, honest empty/in-progress); reserved `/dashboard/admin/categories`, `/dashboard/admin/users`, `/settings/account`, `/settings/notifications`, `/settings/privacy`, `/dashboard/notifications`; `/admin/*` redirects; homepage “For you” and dashboard activity/trend empty; disabled Google/ORCID. No new APIs. Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session.

## 2026-08-30 — Production frontend Task 3

ENSAR approved Task 3. Brought existing screens pixel-close to Stitch without pasting HTML or adding dummy data.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate EPERM reused locked client)
- `pnpm test` — pass (263 / 47)
- `pnpm build` — pass (Next.js 15.5.24; turbo needed `.bin` on PATH)

Shipped: Stitch spacing/typography/hover/focus/active/transitions on shared chrome; article cards as tile/rail/row with snapshot gauges; catalog sidebar; article detail sticky sidebar; auth split panel; dashboard/settings/admin/moderation restyle. No new APIs. Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session.

## 2026-08-30 — Production frontend Task 2

ENSAR approved Task 2. Wired remaining UX states on existing APIs: shared toast region, flash toasts across navigations, success feedback on mutations, optimistic analysis-job retry.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate EPERM reused locked client)
- `pnpm test` — pass (263 / 47), including toast store flash/hydrate
- `pnpm build` — pass (Next.js 15.5.24)

Shipped: `toast-store` + `Toaster`, mutation toasts (auth, profile, editor, flag, moderate, resend, retry, logout), sessionStorage flash for redirects. Retry is optimistic and rolls back. Editor submit is not optimistic (poll would race). Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session.



## 2026-08-30 — Production frontend Task 1

ENSAR started the v1.0 frontend completion sprint. Task 1 audited every API route and page, then wired the real gaps without adding endpoints or dummy data.

Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate EPERM reused locked client)
- `pnpm test` — pass (259 / 46)
- `pnpm build` — pass (Next.js 15.5.24; `/categories` added). `pnpm build` needs `.bin` on PATH for turbo on this workstation

Shipped: `loading.tsx` / `error.tsx` / `global-error.tsx`, resend-verification on dashboard, flag form on public article (moderators), `/categories` index, category filters, header search submit + Categories link, settings nav, auth/profile/logout network errors, empty-panel consistency, leftover Phase 5 copy removed. `PublicArticleDetail.id` added so flag can use the existing admin API. Scores still from snapshots. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session.



## 2026-08-30 — Design mapping quality gate

Backend phases 0–16 reviewed: no remaining numbered backend work. ENSAR approved binding the UI to Stitch tokens. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (turbo; Prisma generate reused locked client)
- `pnpm test` — pass (259 / 46)
- `pnpm build` — pass (Next.js 15.5.24; EB Garamond + Hanken Grotesk via next/font)

Shipped: Tailwind tokens from pack DESIGN.md, shared chrome, score gauges, 5-level authorship dots, 404, existing public/auth/dashboard/settings/editor/moderation screens restyled. Stitch HTML not pasted. Admin category/user screens not built (no use cases). Scores still from ScoreSnapshot. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Sign-off is `/`, `/login`, `/articles/[slug]`, `/dashboard`.



## 2026-08-30 — Phase 16 continuation

Hardened the production-prep surface after ENSAR asked to continue Phase 16. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass via `scripts/typecheck.mjs` (turbo found `.bin/pnpm`; database generate EPERM fell back to per-package `tsc`)
- `pnpm test` — pass (259 tests / 46 files). `scripts/prisma-generate.mjs` reused the locked client
- `pnpm build` — pass (Next.js 15.5.24)

Shipped: session cookies `Secure` only when `APP_URL` is HTTPS (local Compose login works); production `APP_URL` must be https except loopback; Redis AOF config; Caddy forwarded headers; OpenSSL in the image; CI Compose validation; `.env.production.example`; typecheck/generate wrappers. Docker CLI still not installed on this machine.



## 2026-08-30 — Phase 16 quality gate

Implemented production preparation. Phase 15 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (15 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine; turbo could not resolve the pnpm binary, so packages were typechecked with `pnpm -r typecheck`)
- `pnpm test` — pass (254 tests / 45 files), including S3 adapter key safety, storage factory, production Redis/S3 config, Prisma probe, and database URL bootstrap helpers. Full suite run via `vitest run` because `prisma generate` hit the same Windows EPERM lock
- `pnpm build` — pass (Next.js 15.5.24 production build; middleware included)

Shipped: production Docker images and Compose (web, worker, mssql, redis, minio; optional Caddy/Mailpit), S3-compatible `IObjectStorage`, production Redis + SESSION_PEPPER enforcement, Prisma readiness instead of `sqlcmd` on health/worker/admin, `db:ensure` + migrate on web startup, backup scripts, `docs/DEPLOYMENT.md`, GitHub Actions CI. Windows-native local-disk + SQLEXPRESS remains the default. Scores still from `ScoreSnapshot` only. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Docker CLI is not installed on this machine, so Compose was not booted. Sign-off is `docs/DEPLOYMENT.md` plus optional `docker compose up --build`.



## 2026-08-30 — Phase 15 quality gate

Implemented observability. Phase 14 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (15 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine; turbo could not resolve the pnpm binary, so packages were typechecked with `pnpm -r typecheck`)
- `pnpm test` — pass (239 tests / 40 files), including usage-record validation, operational-event redaction, dashboard rate assembly, admin-only dashboard/retry IDOR, persisted pipeline usage, and MSSQL observability aggregates
- `pnpm build` — pass (Next.js 15.5.24 production build; middleware included)

Shipped: request-correlated structured logs (`x-request-id`, duration, status), in-process metrics, persisted `AiUsageRecord` and sanitized `OperationalEvent`, worker heartbeat, admin observability dashboard and analysis-job list, authorized failed-job retry with `AuditLog`. Health endpoints stay non-leaky. Scores still from `ScoreSnapshot` only. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Sign-off is `/dashboard/admin` as `admin@local.test` after re-seed, plus `x-request-id` on responses.



## 2026-08-30 — Phase 14 quality gate

Implemented performance work after measuring query shapes. Phase 13 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (15 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine; turbo could not resolve the pnpm binary, so packages were typechecked with `pnpm -r typecheck`)
- `pnpm test` — pass (230 tests / 38 files), including listing without article body, new query indexes, FTS probe, public HTTP cache policy, in-memory cache TTL/prefix delete, and homepage cache invalidation after publish
- `pnpm build` — pass (Next.js 15.5.24 production build; middleware included)

Shipped: listing/search omit `NVARCHAR(MAX)` content and use SQL `wordCount`; composite indexes for discovery language, author dashboard, moderation queue, and worker job poll; `CacheStore` (`@aip/cache`) for public homepage/listing/categories/article TTL cache with invalidation on publish/moderate/flag; batched author and moderation list reads; public GET Cache-Control. SQL Server Full-Text Search was probed and remains deferred. Scores still from `ScoreSnapshot` only. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Sign-off is public Cache-Control headers plus a publish that appears on the homepage.



## 2026-08-30 — Phase 13 quality gate

Implemented security hardening. Phase 12 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine; turbo could not resolve the pnpm binary, so packages were typechecked with `pnpm -r typecheck`)
- `pnpm test` — pass (223 tests / 36 files), including headers/CSP, CSRF origin, upload inspection, HTTPS profile URLs, prompt fences, Redis limiter, submit/search/reset/resend/moderate rate limits, and AI cost budget fail-closed
- `pnpm build` — pass (Next.js 15.5.24 production build; middleware included)

Shipped: security headers, Origin CSRF check, Redis-or-memory rate limiter, operation quotas, AI cost cap, HTTPS-only profile URLs, fenced AI payloads, upload inspection (no upload route), redacted health ready payload. Scores still from `ScoreSnapshot` only. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Sign-off is response headers plus a rejected cross-origin POST.

## 2026-08-30 — Phase 12 quality gate

Implemented moderation. Phase 11 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine)
- `pnpm test` — pass (203 tests / 34 files), including auto-flag vs low-risk, moderator IDOR, approve/revision/reject, restore published after manual flag, domain flag heuristics, and MSSQL review/audit/queue listing
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: automatic flags into `REQUIRES_REVIEW` (no auto-reject), moderator queue/detail, APPROVE / REQUEST_REVISION / REJECT, version-bound `ModerationReview`, `AuditLog`, manual flag of published items. Scores read from `ScoreSnapshot` only. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Sign-off is `/dashboard/moderation` as `moderator@local.test` after re-seed.

## 2026-08-30 — Phase 11 quality gate

Implemented public discovery. Phase 10 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine)
- `pnpm test` — pass (181 tests / 31 files), including discovery token/cursor ranking, publish+IDOR, unpublished 404, snapshot ranking, and MSSQL published-only search
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: author Publish (ANALYSIS_COMPLETED → READY_FOR_PUBLICATION → PUBLISHED when a ScoreSnapshot exists), public homepage/listing/detail/category/search/profile, title/abstract token search, score filters, cursor pagination, SEO (metadata, canonical, OG, JSON-LD, sitemap, robots). Unpublished slugs 404. Routes/React never calculate scores. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Sign-off is the public pages plus the author Publish button after analysis.

## 2026-08-30 — Phase 11 started

Phase 10 approved by ENSAR (`faz 11 e geç`). Implementing public discovery: publish use case, snapshot-ranked listing, search/filters/cursor pagination, public pages, SEO.

## 2026-08-30 — Phase 10 quality gate

Implemented complete score. Phase 9 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine)
- `pnpm test` — pass (167 tests / 29 files), including ScoringEngine missing/duplicate metrics, originality varied-vs-repeated, zero-confidence authorship not dominating overall, ScoreSnapshot persistence, incomplete metrics failing the job, and author score-view mapping
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: `scoreOriginality`, `ScoringEngine`, `ScoreSnapshot` persistence, author editor complete-score card. Originality is internal uniqueness, not a corpus plagiarism search. Incomplete metrics fail closed. Routes/React never calculate the mix. Authorship remains risk + confidence + disclaimer.

HTTP/browser check: no browser tools in this session. Sign-off is the same worker+web path as Phase 9, expecting `analysis-pipeline-score-1` and a Complete score card sourced from `ScoreSnapshot`.

## 2026-08-30 — Phase 9 quality gate

Implemented AI authorship. Phase 8 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine)
- `pnpm test` — pass (149 tests / 27 files), including ensemble aggregation, disagreement lowering confidence, stylometric templated-vs-varied risk, model-signal interpretation, pipeline authorship metric + disclaimer evidence, and author-view mapping
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: stylometric detector, model-signal interpreter, `AIAuthorshipAssessmentService`, `AI_AUTHORSHIP_RISK` persistence, detector/signal/classification/disclaimer evidence, author editor risk card. No binary verdict. No `ScoreSnapshot`.

HTTP/browser check: no browser tools in this session. Sign-off is the same worker+web path as Phase 8, expecting `analysis-pipeline-authorship-1` and a separate AI authorship risk card with disclaimer.

## 2026-08-30 — Phase 8 quality gate

Implemented the research engine. Phase 7 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine)
- `pnpm test` — pass (138 tests / 24 files), including claim budget, opinion-vs-research citations, unverified≠false, hallucinated URL rejection, SSRF blocks (loopback, metadata, DNS-to-private, private redirect), pipeline research stages, and MSSQL `SourceReference` round-trip
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: claim extraction, SSRF-guarded research provider, citation verification, `scoreResearchAnalysis`, CITATION_QUALITY / EVIDENCE / FACTUAL_RELIABILITY persistence, `SourceReference`. Hallucinated URLs are dropped. Unverified is not false. No `ScoreSnapshot`.

Author editor displays the six persisted metric scores and collected sources. It does not calculate them.

HTTP/browser check: no browser tools in this session. Sign-off is the same worker+web path as Phase 7, expecting `analysis-pipeline-research-1` and six metrics.

## 2026-08-30 — Phase 7 quality gate

Implemented content analysis. Phase 6 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine)
- `pnpm test` — pass (122 tests / 23 files), including preprocess/policy/fairness scoring, 10 pipeline tests (determinism, invalid JSON, opinion-vs-research methods, OpenAI-compatible fetch), metric persistence, and MSSQL metric/evidence round-trip
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: `preprocessArticle`, `ArticleEvaluationPolicy`, `scoreContentAnalysis`, `AnalysisMetric` / `AnalysisEvidence` persistence, type-aware structure/topic/quality metrics, `OpenAICompatibleProvider` (opt-in). No `ScoreSnapshot`. Authorship remains risk + confidence and is not persisted as a metric.

Author editor displays persisted metric scores. It does not calculate them.

HTTP check (no browser tools): login 200, create 201, submit `QUEUED_FOR_ANALYSIS`, worker then `ANALYSIS_COMPLETED` with `analysis-pipeline-content-1`, metrics STRUCTURE / CONTENT_QUALITY / TOPIC_RELEVANCE present, no `overallScore`.

## 2026-08-30 — Stitch design pack parked (D-025)

ENSAR delivered `stitch_scholarflow_design_system.zip` (phase-aligned Stitch schemas). Copied to `docs/stitch-exports/` without extracting. Not opened. Not applied. Use only after backend phases finish and ENSAR approves a design/mapping phase.

## 2026-08-30 — Phase 6 quality gate

Implemented the AI pipeline foundation. Phase 5 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a process held the query engine)
- `pnpm test` — pass (111 tests / 22 files), including 7 pipeline tests (determinism, usage, invalid JSON, retryable failure, research/authorship ports) and 2 research fake tests
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: `AIProvider`, `PromptRegistry`, `StructuredOutputValidator`, `UsageTracker`, `ArticleAnalysisPipeline`, fake providers, `PipelineArticleAnalyzer`. Worker runs the deterministic pipeline. No `ScoreSnapshot`. Authorship remains risk + confidence.

No UI change. Browser verification not required for this phase.


## 2026-08-30 — Phase 5 quality gate

Implemented the job system. Phase 4 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while a Next process held the query engine)
- `pnpm test` — pass (101 tests / 20 files), including 7 process-job tests (success, idempotency, retry, max-fail, stale version, concurrent claim)
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: `ProcessAnalysisJobUseCase`, `FakeArticleAnalyzer`, BullMQ adapter, worker poll of due `QUEUED` jobs, `saveIfStatus` claim, retry (max 3), `AnalysisRun` on completion. No `ScoreSnapshot`. Editor polls queued/processing status.

HTTP check (no browser tools): login 200, create 201, submit 200 `QUEUED_FOR_ANALYSIS` + job `QUEUED`, worker then `ANALYSIS_COMPLETED`, no `overallScore`.


## 2026-08-30 — Phase 4 quality gate

Implemented article management. Phase 3 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages; database `tsc --noEmit` after a locked `prisma generate` while the dev server held the query engine)
- `pnpm test` — pass (90 tests / 18 files), including 8 article use-case tests and an MSSQL taxonomy/list-by-author test
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: create/edit draft, versioning, categories/tags, submit via `FakeAnalysisService` (job stays QUEUED; article `QUEUED_FOR_ANALYSIS`), author dashboard. Scores are still never calculated in routes or React.

HTTP check (no browser tools): login 200, `/dashboard/articles` 200, create draft 201 v1, content edit 200 v2, submit 200 `QUEUED_FOR_ANALYSIS` + job `QUEUED`, list includes the draft, moderator GET of that id 404.

## 2026-08-29 — Phase 3 quality gate

Implemented authentication. Phase 2 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (14 packages)
- `pnpm test` — pass (81 tests / 17 files), including MSSQL session/token repos and a register/login integration test
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: register/login/logout, HttpOnly session cookies, scrypt password hashes, email verification + password reset architecture (console mail), own-profile update, RBAC guards, in-memory rate limits, account lock. Scores are still never calculated in routes or React.

HTTP check (no browser tools): `/login` 200, `/dashboard` 307 → `/login` when anonymous, `/api/auth/me` 401 anonymous, register 201, login 200 with HttpOnly+SameSite=Lax, `/api/admin/whoami` 403 for USER, logout then `/api/auth/me` 401.

## 2026-08-29 — Memory bank refresh after Phase 2

Aligned the bank with shipped persistence: TCP 1433 + Windows integrated auth (not Mixed Mode), `aip` / `aip_test`, citation 10% + evidence 10%, `ScoreSnapshot` ownership, Prisma NVARCHAR/CHECK mapping. Indexed `docs/STITCH-UI-PROMPTS.md` as design-only; it does not start UI work.

## 2026-08-29 — Phase 2 quality gate

Implemented Prisma persistence in `@aip/database`. Phase 1 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (13 packages)
- `pnpm test` — pass (57 tests / 13 files), including 8 MSSQL repository tests against `aip_test`
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: schema + `20260829180000_init` migration, Prisma repositories for all Phase 1 interfaces, seed (`aip`: 3 users, 5 categories, 2 articles, policy v1), TCP 1433 on SQLEXPRESS. Article table has no score or body columns. No UI.

## 2026-08-29 — Phase 1 pre-Phase-2 review

ENSAR asked what to test before Phase 2. Answer recorded: no UI or runtime flow to exercise. Sign-off is a design review of article status rules, `ScoreSnapshot` ownership, and `ScoringPolicy` v1 weights. Phase 2 not started.

## 2026-08-29 — Phase 1 quality gate

Implemented the domain model in `@aip/domain`. Phase 0 approved by ENSAR. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (13 packages)
- `pnpm test` — pass (48 tests / 11 files)
- `pnpm build` — pass (Next.js 15.5.24 production build)

Shipped: `Score` (0–100), `ScoringPolicy` v1 with confidence-scaled authorship weight, article/job/run status machines, entities bound to `ArticleVersion`, repository interfaces, typed domain errors. No UI, no Prisma, no AI.

## 2026-08-29 — Phase 0 quality gate

Implemented architecture foundation. Gate results:

- `pnpm lint` — pass
- `pnpm typecheck` — pass (13 packages)
- `pnpm test` — pass (11 tests / 5 files), including SQL Server `sqlcmd` probe against `.\SQLEXPRESS`, memory Redis driver, local disk storage
- `pnpm build` — pass (Next.js 15.5.24 production build + workspace typechecks)

Node 22.23.2 installed. pnpm 10.15.0 via corepack (`corepack enable` cannot write Program Files shims; use `corepack pnpm` + `.bin` PATH shim).

Memurai Developer winget install failed with MSI 1603. Redis abstraction uses `REDIS_URL=memory://local` until a Redis-compatible server is installed.

SQL Server TCP/IP remains disabled on SQLEXPRESS / MSSQLSERVER1. `sqlcmd` connectivity works with Windows integrated auth. Application schema is deferred to Phase 2.

## 2026-08-29 — Phase 0 started

Workspace contained only `masterplan.md`. Creating memory bank, monorepo, tooling, and native Windows infrastructure connections.
