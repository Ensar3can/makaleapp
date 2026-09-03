# Phase Plan

Do not start the next phase without ENSAR approval.

- [x] **Phase 0** Architecture foundation — approved; quality gate passed
- [x] **Phase 1** Domain model — approved; quality gate passed
- [x] **Phase 2** Database — approved; quality gate passed
- [x] **Phase 3** Authentication — approved; quality gate passed
- [x] **Phase 4** Article management — approved; quality gate passed
- [x] **Phase 5** Job system — approved; quality gate passed
- [x] **Phase 6** AI pipeline foundation — approved; quality gate passed
- [x] **Phase 7** Content analysis — approved; quality gate passed
- [x] **Phase 8** Research engine — approved; quality gate passed
- [x] **Phase 9** AI authorship — approved; quality gate passed
- [x] **Phase 10** Complete score — approved; quality gate passed
- [x] **Phase 11** Public discovery — approved; quality gate passed
- [x] **Phase 12** Moderation — approved; quality gate passed
- [x] **Phase 13** Security hardening — approved; quality gate passed
- [x] **Phase 14** Performance — approved; quality gate passed
- [x] **Phase 15** Observability — approved; quality gate passed
- [x] **Phase 16** Production preparation — approved; quality gate passed
- [x] **Design mapping** — Stitch tokens on existing screens; quality gate passed
- [x] **Production frontend v1.0** — Tasks 1–10 complete; final report delivered
- [ ] **Post-v1.0 Wave A** Public go-live ops — waiting for ENSAR approval (SMTP, Compose boot, production env, optional real AI)
- [ ] **Post-v1.0 Wave B** Confidence — Playwright e2e + browser QA
- [ ] **Post-v1.0 Wave C** Reserved product — needs new backend (notifications, admin CRUD, settings, social auth, For you)
- [ ] **Post-v1.0 Wave D** Optional — FTS, infinite scroll, vendor APM

## Post-v1.0 backlog (do not start without ENSAR approval)

Priority order: A → B → C → D. Wave A is the only public-internet blocker. Waves C–D are new product work, not v1.0 leftovers.

| Wave | Item | How we solve it |
| --- | --- | --- |
| A1 | Console `EmailSender` | Add SMTP adapter behind existing `EmailSender` port; keep console for local; Mailpit in Compose already exists |
| A2 | Production secrets / HTTPS `APP_URL` | Fill `.env.production.example` on the host; never commit secrets |
| A3 | Docker Compose untested on this PC | Install Docker Desktop or boot Compose on a Linux host; follow `docs/DEPLOYMENT.md` |
| A4 | Default `AI_PROVIDER=fake` | Set `AI_PROVIDER=openai` + `AI_API_KEY` when real analysis is wanted; fake stays local default |
| B1 | Playwright is homepage-only | Add e2e for login→editor, submit→poll, publish, moderate; keep fakes in CI |
| B2 | No live click-through this sprint | Manual browser pass of Task 9 checklist after A is done |
| C1 | Admin category/user screens reserved | New use cases + APIs, then replace `ReservedPage` |
| C2 | Notifications inbox empty | Notification entity, persist, list API, then UI |
| C3 | Settings account / notifications / privacy empty | Account/session APIs and preference ports; privacy copy from policy |
| C4 | Google / ORCID disabled | OAuth ports + callbacks; keep `SocialAuthUnavailable` until configured |
| C5 | Homepage “For you” / dashboard activity empty | Personalized ranking is a new product rule; do not fake it |
| D1 | SQL Server FTS deferred | Enable FTS on the instance, then swap token search |
| D2 | Infinite scroll | Optional; cursor “Load more” is enough for v1.0 |
| D3 | Vendor APM | Optional; persisted metrics already exist |

## Production frontend v1.0 — Task 10 exit criteria

Final report only. No product code. Report covers completed work, remaining gaps, backend-blocked items, optional follow-ups, go-live blockers, known critical defects, and a 0–100 score. Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer.

## Production frontend v1.0 — Task 9 exit criteria

Login, register, forgot/reset, verify, dashboard, create/edit/publish, moderation, admin, search, profile, categories, homepage, article detail, score gauge, authorship risk, pagination, filter, sort, loading, error, toast, authn/authz, and route protection were checked against existing APIs. Unauthenticated visits to protected routes return to a validated `next` path after login. Signed-in users are sent away from login/register. Page session guard treats only `UnauthenticatedError` as a login redirect. Auth pages are noindex. Favicon exists. No new APIs. Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Production frontend v1.0 — Task 8 exit criteria

Repeated reserved coming-soon pages share `ReservedPage`. Metric and 5-level authorship labels live in `analysis-labels` and are used by the badge, editor, analysis, and moderation screens. Leftover `text-slate-*` chrome on those screens uses Stitch `ink`/`muted`/`line`. Unused internal exports (`jsonError`, `optionalNumber`, `ArticleCard`) are no longer public. Dialog and ScoreBadge stay as Task 5 kit primitives. No new APIs. Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Production frontend v1.0 — Task 7 exit criteria

Route skeletons cover catalog/article/form layouts. Header and catalog search debounce 400ms against existing GET listing URLs (no new API). Avatars lazy-load; the editor and flag form are code-split. Cursor “Load more” stays; infinite scroll was not added. Skip link, one main landmark, HeaderNav focus trap, and labelled controls are in place. Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Production frontend v1.0 — Task 6 exit criteria

Layouts hold at 320, 375, 768, 1024, 1440, and 1920. Primary navigation below 1024px uses `HeaderNav` (panel + overlay). Catalog filters collapse under `lg`. Tables scroll horizontally. Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Production frontend v1.0 — Task 5 exit criteria

Buttons, cards, fields, alerts, tables, empty/error/404/500, pagination, header/sidebar/footer, toast, badges, ScoreGauge, and authorship risk share one Stitch token set through `apps/web/components/ui`. No dummy data. No new APIs. Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Production frontend v1.0 — Task 4 exit criteria

Stitch screens that had no product route now exist. Author analysis at `/dashboard/articles/[id]/analysis` reads persisted `GetAuthorArticle` data (empty while queued or failed). Admin category/user, settings account/notifications/privacy, and the notification inbox are reserved empty states with no mock data. Stitch `/admin/*` aliases redirect. Homepage “For you”, dashboard activity/trend, and social sign-in stay empty or disabled. No new APIs. Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Production frontend v1.0 — Task 3 exit criteria

Existing screens follow Stitch spacing, typography, cards, chrome, hover/focus/active, and transitions. Stitch HTML was not pasted. No dummy data. Missing screens stay for Task 4. Shared primitive extraction stays for Task 5. Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Production frontend v1.0 — Task 2 exit criteria

Mutation UIs report success and failure. A shared toast region covers same-page actions; a sessionStorage flash survives full navigations (login, logout, create-draft, flag, moderate). Analysis-job retry is optimistic (shows Requeued, rolls back on error). Scores are still never calculated in React. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Production frontend v1.0 — Task 1 exit criteria

Full UI/API audit completed. Missing client callers for existing APIs were wired (`resend-verification`, `flag`). Route-level `loading.tsx` / `error.tsx` / `global-error.tsx` exist. `/categories` lists active topics from `ListPublicCategoriesUseCase`. Category pages reuse discovery filters. Auth and profile forms handle network failure. Dummy “fake analysis job” copy removed. Routes and React never calculate scores. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Phase 0 exit criteria

lint, typecheck, tests, build pass. `pnpm dev` can start web and worker. MSSQL, Redis, and local disk storage connections verified.

## Phase 1 exit criteria

Domain entities, `Score`, status machines, `ScoringPolicy`, repository interfaces, and unit tests exist in `@aip/domain`. Domain imports no infrastructure. lint, typecheck, tests, build pass.

No browser/manual product test is required for Phase 1. ENSAR sign-off is the domain rules that Phase 2 will persist: article transitions + version invalidation, `ScoreSnapshot` as score source of truth, `ScoringPolicy` v1 mix.

## Phase 2 exit criteria

Prisma schema and initial migration exist. Domain repository interfaces have Prisma implementations. Dev database `aip` is seeded. Integration tests run against `aip_test` on real MSSQL. lint, typecheck, tests, build pass.

No browser/manual product test is required for Phase 2. There is still no login or article UI.

## Phase 16 exit criteria

Production Docker images exist for web and worker. Compose boots SQL Server, Redis, and MinIO. `IObjectStorage` has an S3-compatible adapter. Production boot requires a real Redis URL and SESSION_PEPPER. Readiness probes use Prisma plus the configured storage driver and stay non-leaky. Migration, backup, HTTPS/proxy, deploy, and rollback are documented. CI runs lint, typecheck, unit tests, and the production build. Windows-native `pnpm dev` remains valid. Routes and React never calculate scores. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Phase 15 exit criteria

Structured logs include request/job correlation, duration, and status, and never log secrets. Durable metrics come from persisted jobs, runs, and AI usage records. Operational errors are stored sanitized. Health endpoints remain non-leaky. Admins can view job counts, analysis duration, success rate, AI cost today/month, tokens, review backlog, provider errors, expensive stages, and retry failed jobs with authorization. Routes and React never calculate scores. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Phase 14 exit criteria

Homepage, listing, search, article detail, and job-poll queries were measured before changes. Listing does not transfer `NVARCHAR(MAX)` article bodies. Indexes match those predicates. `CacheStore` caches only public, non-personalized responses and invalidates on publish/moderate/flag. Author and moderation lists are batched. Public GET pages send a short shared Cache-Control. SQL Server FTS is evaluated and remains deferred when not installed. Routes and React never calculate scores. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Phase 13 exit criteria

Security headers (CSP, nosniff, referrer, permissions, frame denial, production HSTS) are applied. Mutating requests require a matching Origin/Referer. Rate limits cover auth plus submit, search, reset, resend, and moderation, and share Redis when configured. Analysis jobs fail closed when estimated cost exceeds `MAX_AI_COST_PER_ANALYSIS`. Profile URLs are public HTTPS. Prompt payloads are fenced. File inspection rejects HTML/SVG/executables. Secrets stay out of logs and health payloads. Routes and React never calculate scores. Authorship remains risk + confidence + disclaimer. lint, typecheck, tests, and production build pass.

## Phase 12 exit criteria

Automatic flags move an article to `REQUIRES_REVIEW` without auto-rejecting. Moderators see the article, persisted snapshot scores, evidence, research sources, detector signals, and flag reasons. Decisions are APPROVE, REQUEST_REVISION, and REJECT. `ModerationReview` is bound to `ArticleVersion`. Critical actions write `AuditLog`. Authors cannot publish during review. Authorship remains risk + confidence + disclaimer. Routes and React never calculate scores. lint, typecheck, tests, and production build pass.

## Phase 11 exit criteria

Public homepage, article listing, article detail, category, author profile, and search exist. Only `PUBLISHED` articles with a `ScoreSnapshot` for the current version are discoverable. Listing supports search tokens, category/tag/author/language/score filters, sort by overall score or recency, and cursor pagination. Scores are read from the snapshot. Authorship remains risk + confidence + disclaimer. SEO includes metadata, canonical URLs, OpenGraph, JSON-LD, sitemap, and robots.txt. Unpublished slugs 404. lint, typecheck, tests, and production build pass.

## Phase 10 exit criteria

`ScoringEngine` assembles persisted metrics through `ScoringPolicy` and writes `ScoreSnapshot` bound to `ArticleVersion`. Originality is a persisted internal-uniqueness metric. Missing or duplicate required metrics fail closed. The author UI shows overall and quality scores from the snapshot. Routes and React never calculate the mix. Authorship remains risk + confidence + disclaimer, never a binary verdict. lint, typecheck, tests, and production build pass.

## Phase 9 exit criteria

Ensemble detectors produce observations. Domain `AIAuthorshipAssessmentService` aggregates risk and confidence and classifies through `ScoringPolicy`. Individual detector outputs persist as evidence. `AI_AUTHORSHIP_RISK` persists as an `AnalysisMetric`. The author UI shows risk, confidence, classification, and a disclaimer. No binary AI-written verdict. `ScoreSnapshot` and overall score are not written. lint, typecheck, tests, and production build pass.

## Phase 8 exit criteria

Claim extraction, SSRF-safe research collection, citation verification, and domain scoring produce CITATION_QUALITY, EVIDENCE, and FACTUAL_RELIABILITY metrics. Collected sources persist as `SourceReference`. Model-invented URLs are not trusted evidence. Unverified claims are not treated as false. Opinion articles are not punished for missing citations. `ScoreSnapshot` and overall score are not written. lint, typecheck, tests, and production build pass.

## Phase 7 exit criteria

Preprocessing, type-aware `ArticleEvaluationPolicy`, and domain scoring produce STRUCTURE, CONTENT_QUALITY, and TOPIC_RELEVANCE metrics from validated observations. Those metrics persist as `AnalysisMetric` / `AnalysisEvidence`. Opinion articles are not punished for missing Methods. Invalid AI JSON fails closed. `OpenAICompatibleProvider` exists and is used only when configured; default remains fake. `ScoreSnapshot` and overall score are not written. lint, typecheck, tests, and production build pass.

## Phase 6 exit criteria

Provider interfaces, `PromptRegistry`, `StructuredOutputValidator`, `UsageTracker`, and `ArticleAnalysisPipeline` exist. The worker runs the fake deterministic pipeline. Invalid AI JSON fails closed. `AnalysisRun` is persisted; `ScoreSnapshot` is not. lint, typecheck, tests, and production build pass.

## Phase 5 exit criteria

Submit persists a `QUEUED` job. The worker claims it once, runs `FakeArticleAnalyzer`, writes an `AnalysisRun`, and moves the article to `ANALYSIS_COMPLETED` (or `ANALYSIS_FAILED` after retries). Duplicate deliveries are idempotent. Scores are not calculated. lint, typecheck, tests, and production build pass.

## Phase 4 exit criteria

Authors can create drafts, edit them (new `ArticleVersion` on content change), select categories/tags, and submit. Submit queues a fake analysis job and moves the article to `QUEUED_FOR_ANALYSIS`. Author dashboard lists own articles by status. Scores are not calculated. IDOR is covered by tests. lint, typecheck, tests, and production build pass.

## Phase 3 exit criteria

Register, login, and logout work with HttpOnly session cookies. Email verification and password reset exist behind an `EmailSender` port (console in Phase 3). Profile is created at registration and can be updated by the owner. RBAC is enforced server-side. Rate limits and account lock have tests. lint, typecheck, tests, and production build pass.
