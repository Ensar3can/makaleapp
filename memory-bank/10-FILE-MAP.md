# File Map

Update this when public symbols or important files are added.

| Symbol / area | Path |
| --- | --- |
| Session protocol | `AGENTS.md` |
| Memory bank index | `memory-bank/00-INDEX.md` |
| Architecture narrative | `docs/ARCHITECTURE.md` |
| ADRs | `docs/adr/` (through ADR-023) |
| Design mapping | `docs/DESIGN-MAPPING.md` |
| `ComingSoonPanel` / `ReservedPage` | `apps/web/components/coming-soon-panel.tsx`, `reserved-page.tsx` |
| UI primitives (`Button`, `Card`, `TextField`, `Alert`, `EmptyState`, `DataTable`, `Pagination`, `Dialog`, `AppHeader`, `HeaderNav`, `CatalogLayout`, `StatusPage`, `SideNav`) | `apps/web/components/ui/` |
| `cx` | `apps/web/lib/cx.ts` |
| `SocialAuthUnavailable` | `apps/web/components/social-auth-unavailable.tsx` |
| Author analysis page | `apps/web/app/dashboard/articles/[id]/analysis/page.tsx` |
| Admin categories / users (reserved) | `apps/web/app/dashboard/admin/categories/page.tsx`, `users/page.tsx` |
| Settings account / notifications / privacy | `apps/web/app/settings/account/page.tsx`, `notifications/page.tsx`, `privacy/page.tsx` |
| Notification inbox (empty) | `apps/web/app/dashboard/notifications/page.tsx` |
| Stitch `/admin/*` aliases | `apps/web/next.config.ts` `redirects` |
| UI tokens / chrome | `apps/web/app/globals.css`, `apps/web/components/brand-mark.tsx`, `site-footer.tsx`, `score-gauge.tsx` |
| `PageShell` / `PageHeading` / `AuthorAvatar` | `apps/web/components/page-shell.tsx`, `page-heading.tsx`, `author-avatar.tsx` |
| Article card tile / rail / list | `apps/web/components/article-card.tsx` |
| Deploy / backup / rollback | `docs/DEPLOYMENT.md` |
| Docker Compose / images | `docker-compose.yml`, `docker/Dockerfile` |
| CI | `.github/workflows/ci.yml` |
| Typecheck / Prisma generate wrappers | `scripts/typecheck.mjs`, `scripts/prisma-generate.mjs` |
| Production Redis config | `docker/redis.conf` |
| Production env template | `.env.production.example` |
| `createObjectStorage` / `S3CompatibleObjectStorage` | `packages/storage/src/create-object-storage.ts`, `s3-compatible-object-storage.ts` |
| `probeDatabase` / `ensureDatabaseExists` | `packages/database/src/database-probe.ts`, `ensure-database.ts` |
| `AiUsageRecord` / `OperationalEvent` | `packages/domain/src/ai-usage-record.ts`, `operational-event.ts` |
| `assembleObservabilityDashboard` | `packages/domain/src/observability.ts` |
| Observability use cases | `packages/application/src/use-cases/get-observability-dashboard.ts`, `list-monitored-analysis-jobs.ts`, `retry-failed-analysis-job.ts` |
| `InMemoryMetricsRecorder` / `resolveRequestId` | `packages/logging/src/metrics.ts`, `request-id.ts` |
| Prisma observability repos | `packages/database/src/repositories/prisma-observability-repository.ts`, `prisma-ai-usage-record-repository.ts`, `prisma-operational-event-repository.ts` |
| Admin observability UI | `apps/web/app/dashboard/admin/` |
| Admin observability API | `apps/web/app/api/admin/observability/`, `apps/web/app/api/admin/analysis-jobs/` |
| `CacheStore` / `createCacheStore` | `packages/application/src/ports.ts`, `packages/cache/src/` |
| `cacheControlForRequest` / public HTTP cache | `packages/domain/src/http-cache.ts` |
| `PUBLIC_CACHE_KEYS` / `invalidatePublicDiscoveryCache` | `packages/application/src/public-cache.ts` |
| `probeFullTextSearch` | `packages/database/src/full-text-search-probe.ts` |
| Stitch AI UI screen prompts (design reference only) | `docs/STITCH-UI-PROMPTS.md` |
| Parked Stitch design pack (frozen; D-025) | `docs/stitch-exports/stitch_scholarflow_design_system.zip` |
| Typed env / `loadConfig` / `getConfig` / `TEST_DATABASE_URL` | `packages/config/src/env.ts` |
| `assertNever` | `packages/domain/src/assert-never.ts` |
| `Score` | `packages/domain/src/score.ts` |
| `ArticleType` / `ArticleEvaluationPolicy` | `packages/domain/src/enums.ts`, `article-evaluation-policy.ts` |
| `preprocessArticle` | `packages/domain/src/article-preprocessor.ts` |
| `scoreContentAnalysis` | `packages/domain/src/content-analysis-scoring.ts` |
| `AnalysisMetric` / `AnalysisEvidence` | `packages/domain/src/analysis-metric.ts`, `analysis-evidence.ts` |
| `ScoringPolicy` / `ComputedArticleScore` | `packages/domain/src/scoring-policy.ts` |
| `ScoringEngine` | `packages/domain/src/scoring-engine.ts` |
| `scoreOriginality` | `packages/domain/src/originality-analysis-scoring.ts` |
| `AIAuthorshipAssessment` | `packages/domain/src/ai-authorship-assessment.ts` |
| `AIAuthorshipAssessmentService` / `assessAuthorship` | `packages/domain/src/authorship-analysis-scoring.ts` |
| Authorship analysis types / disclaimer | `packages/domain/src/authorship-analysis.ts` |
| `Article` / `ArticleVersion` | `packages/domain/src/article.ts`, `article-version.ts` |
| Article status machine | `packages/domain/src/article-status-machine.ts` |
| `AnalysisJob` / `AnalysisRun` | `packages/domain/src/analysis-job.ts`, `analysis-run.ts` |
| `ScoreSnapshot` | `packages/domain/src/score-snapshot.ts` |
| `User` / `Profile` | `packages/domain/src/user.ts`, `profile.ts` |
| `Category` / `Tag` | `packages/domain/src/category.ts`, `tag.ts` |
| Domain errors | `packages/domain/src/errors.ts` |
| Repository interfaces | `packages/domain/src/repositories.ts` |
| Domain events | `packages/domain/src/domain-events.ts` |
| `UseCase` | `packages/application/src/index.ts` |
| `probeSqlServer` | `packages/database/src/sql-server-probe.ts` |
| `probeRedis` | `packages/database/src/redis-probe.ts` |
| Prisma schema / init migration | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260829180000_init/` |
| `createPrismaClient` / `getPrismaClient` | `packages/database/src/prisma-client.ts` |
| Persistence mappers | `packages/database/src/mappers.ts` |
| `PrismaUserRepository` | `packages/database/src/repositories/prisma-user-repository.ts` |
| `PrismaProfileRepository` | `packages/database/src/repositories/prisma-profile-repository.ts` |
| `PrismaArticleRepository` | `packages/database/src/repositories/prisma-article-repository.ts` |
| `PrismaArticleVersionRepository` | `packages/database/src/repositories/prisma-article-version-repository.ts` |
| `PrismaCategoryRepository` | `packages/database/src/repositories/prisma-category-repository.ts` |
| `PrismaTagRepository` | `packages/database/src/repositories/prisma-tag-repository.ts` |
| `PrismaAnalysisJobRepository` | `packages/database/src/repositories/prisma-analysis-job-repository.ts` |
| `PrismaAnalysisRunRepository` | `packages/database/src/repositories/prisma-analysis-run-repository.ts` |
| `PrismaAnalysisMetricRepository` | `packages/database/src/repositories/prisma-analysis-metric-repository.ts` |
| `PrismaAnalysisEvidenceRepository` | `packages/database/src/repositories/prisma-analysis-evidence-repository.ts` |
| `PrismaScoreSnapshotRepository` | `packages/database/src/repositories/prisma-score-snapshot-repository.ts` |
| `PrismaScoringPolicyRepository` | `packages/database/src/repositories/prisma-scoring-policy-repository.ts` |
| `resetDatabase` | `packages/database/src/reset-database.ts` |
| Dev seed | `packages/database/src/seed.ts` |
| Enable SQLEXPRESS TCP | `scripts/enable-sqlexpress-tcp.ps1` |
| `AIProvider` / `AIAuthorshipDetector` / `ArticleAnalysisPipeline` | `packages/ai/src/index.ts`, `article-analysis-pipeline.ts` |
| `OpenAICompatibleProvider` | `packages/ai/src/openai-compatible-provider.ts` |
| `createContentAnalysisPipeline` / `createWorkerPipeline` | `packages/ai/src/create-content-analysis-pipeline.ts`, `apps/worker/src/create-worker-pipeline.ts` |
| `scoreResearchAnalysis` / `selectClaimsForVerification` | `packages/domain/src/research-analysis-scoring.ts`, `research-analysis.ts` |
| `inspectHttpUrl` / `SourceReference` | `packages/domain/src/http-url-safety.ts`, `source-reference.ts` |
| `SsrfUrlGuard` / `SafeHttpFetcher` / `SsrfGuardedResearchProvider` | `packages/research/src/ssrf-url-guard.ts`, `safe-http-fetcher.ts`, `ssrf-guarded-research-provider.ts` |
| `PrismaSourceReferenceRepository` | `packages/database/src/repositories/prisma-source-reference-repository.ts` |
| `PromptRegistry` / `InMemoryPromptRegistry` | `packages/ai/src/prompt-registry.ts` |
| Claim / fact prompts | `packages/ai/src/prompts/claim-extraction.ts`, `fact-evaluation.ts` |
| `collectClaimSources` / `verifyExtractedCitations` | `packages/ai/src/collect-research.ts` |
| `StructuredOutputValidator` | `packages/ai/src/structured-output-validator.ts` |
| `UsageTracker` / `InMemoryUsageTracker` | `packages/ai/src/usage-tracker.ts` |
| Foundation prompts | `packages/ai/src/prompts/` |
| `FakeAIProvider` / `FakeAIAuthorshipDetector` | `packages/ai/src/fake-ai-provider.ts`, `fake-ai-authorship-detector.ts` |
| `StylometricAuthorshipDetector` / `interpretModelAuthorshipSignals` | `packages/ai/src/stylometric-authorship-detector.ts`, `model-authorship-detector.ts` |
| Author authorship view | `packages/application/src/article-views.ts` |
| Author complete score view | `packages/application/src/article-views.ts` (`toAuthorScoreView`) |
| `createFakeAnalysisPipeline` / `toAnalyzerOutcome` | `packages/ai/src/create-fake-analysis-pipeline.ts` |
| `ResearchProvider` / `FakeResearchProvider` | `packages/research/src/index.ts`, `fake-research-provider.ts` |
| `IObjectStorage` | `packages/storage/src/i-object-storage.ts` |
| `LocalDiskObjectStorage` | `packages/storage/src/local-disk-object-storage.ts` |
| `IJobQueue` / `IJobWorker` / `InMemoryJobQueue` | `packages/queue/src/types.ts`, `in-memory-job-queue.ts` |
| `BullMQJobQueue` / `BullMQJobWorker` / `createJobTransport` | `packages/queue/src/bullmq-job-queue.ts`, `create-job-transport.ts` |
| Zod helpers | `packages/validation/src/index.ts` |
| `createLogger` | `packages/logging/src/index.ts` |
| `Session` / `AuthToken` / `LoginAttempt` | `packages/domain/src/session.ts`, `auth-token.ts`, `login-attempt.ts` |
| `Permission` / `hasPermission` | `packages/domain/src/enums.ts`, `permissions.ts` |
| Auth use cases | `packages/application/src/use-cases/` |
| `ScryptPasswordHasher` / session cookie options | `packages/auth/src/` |
| `createRateLimiter` / `RedisRateLimiter` | `packages/auth/src/create-rate-limiter.ts`, `redis-rate-limiter.ts` |
| `AUTH_RATE_LIMITS` / `OPERATION_RATE_LIMITS` | `packages/domain/src/rate-limits.ts` |
| `buildSecurityHeaders` / `checkMutatingRequestOrigin` | `packages/domain/src/security-headers.ts`, `request-origin.ts` |
| `parseClientIp` / `assertPublicHttpsUrl` | `packages/domain/src/client-ip.ts`, `public-https-url.ts` |
| `inspectUploadedFile` / `fenceUntrustedPayload` | `packages/domain/src/uploaded-file.ts`, `untrusted-text.ts` |
| `isAnalysisCostWithinBudget` | `packages/domain/src/analysis-cost.ts` |
| Security middleware / headers | `apps/web/middleware.ts`, `apps/web/next.config.ts` |
| Prisma `Session` / `AuthToken` / `LoginAttempt` | `packages/database/prisma/schema.prisma`, `migrations/20260829210000_auth_sessions/` |
| Auth API routes | `apps/web/app/api/auth/**` |
| Article API routes | `apps/web/app/api/articles/**`, `apps/web/app/api/categories/` |
| `PublishArticleUseCase` | `packages/application/src/use-cases/publish-article.ts` |
| `evaluateModerationFlags` / `ModerationFlag` | `packages/domain/src/moderation-flag.ts` |
| `ModerationReview` | `packages/domain/src/moderation-review.ts` |
| `AuditLog` | `packages/domain/src/audit-log.ts` |
| `ListModerationQueueUseCase` / `GetModerationArticleUseCase` | `packages/application/src/use-cases/list-moderation-queue.ts`, `get-moderation-article.ts` |
| `ModerateArticleUseCase` / `FlagArticleUseCase` | `packages/application/src/use-cases/moderate-article.ts`, `flag-article.ts` |
| `PrismaModerationReviewRepository` / `PrismaAuditLogRepository` | `packages/database/src/repositories/prisma-moderation-review-repository.ts`, `prisma-audit-log-repository.ts` |
| Moderator queue UI | `apps/web/app/dashboard/moderation/` |
| Moderation API | `apps/web/app/api/admin/moderation/queue/`, `apps/web/app/api/admin/articles/[id]/moderate/`, `flag/` |
| `SearchArticlesUseCase` / public discovery views | `packages/application/src/use-cases/search-articles.ts`, `public-article-views.ts` |
| `GetPublicArticleUseCase` / category / author / homepage | `packages/application/src/use-cases/get-public-article.ts`, `get-public-category.ts`, `get-public-author-profile.ts`, `get-homepage-discovery.ts` |
| `PublicArticleDiscoveryRepository` | `packages/domain/src/repositories.ts`, `packages/domain/src/public-discovery.ts` |
| `PrismaPublicArticleDiscoveryRepository` | `packages/database/src/repositories/prisma-public-article-discovery-repository.ts` |
| Public pages | `apps/web/app/(public)/` |
| Categories index | `apps/web/app/(public)/categories/page.tsx` |
| `Toaster` / toast store | `apps/web/components/toaster.tsx`, `apps/web/lib/toast-store.ts` |
| `safeInternalPath` / `loginHref` / `registerHref` | `apps/web/lib/auth/safe-next-path.ts` |
| `authPageMetadata` | `apps/web/lib/auth/page-metadata.ts` |
| App icon | `apps/web/app/icon.svg` |
| `SkipLink` / `MainContent` | `apps/web/components/skip-link.tsx`, `main-content.tsx` |
| `HeaderSearch` | `apps/web/components/header-search.tsx` |
| `FlagArticleForm` (lazy) | `apps/web/components/flag-article-form-lazy.tsx` |
| `debounce` / live search URL / focus cycle | `apps/web/lib/debounce.ts`, `live-search.ts`, `focus.ts` |
| `metricLabel` / `authorshipClassificationLabel` | `apps/web/lib/analysis-labels.ts` |
| `PageSkeleton` / `RouteError` / `SegmentError` | `apps/web/components/page-skeleton.tsx`, `route-error.tsx`, `segment-error.tsx` |
| `ResendVerificationButton` | `apps/web/components/resend-verification-button.tsx` |
| `FlagArticleForm` | `apps/web/components/flag-article-form.tsx` |
| App loading / error / 500 | `apps/web/app/loading.tsx`, `error.tsx`, `global-error.tsx` |
| SEO sitemap / robots | `apps/web/app/sitemap.ts`, `apps/web/app/robots.ts` |
| Login/register/dashboard/profile UI | `apps/web/app/(auth)/`, `apps/web/app/dashboard/`, `apps/web/app/settings/profile/` |
| Author article UI | `apps/web/app/dashboard/articles/` |
| `FakeAnalysisService` | `packages/application/src/fake-analysis-service.ts` |
| `FakeArticleAnalyzer` / `FAKE_ANALYZER_IDENTITY` | `packages/application/src/fake-article-analyzer.ts` |
| `PipelineArticleAnalyzer` / `AnalysisPipeline` | `packages/application/src/pipeline-article-analyzer.ts`, `ports.ts` |
| `ProcessAnalysisJobUseCase` | `packages/application/src/use-cases/process-analysis-job.ts` |
| `ANALYSIS_JOB_POLICY` / `ANALYZE_ARTICLE_JOB` | `packages/application/src/analysis-job-policy.ts` |
| `JobDispatcher` / `ArticleAnalyzer` / `NoOpJobDispatcher` | `packages/application/src/ports.ts`, `noop-job-dispatcher.ts` |
| Article use cases | `packages/application/src/use-cases/create-article-draft.ts`, `update-article-draft.ts`, `submit-article.ts`, `list-author-articles.ts`, `get-author-article.ts`, `list-active-categories.ts` |
| `ArticleClassificationService` | `packages/application/src/article-classification.ts` |
| `PrismaArticleTaxonomyRepository` | `packages/database/src/repositories/prisma-article-taxonomy-repository.ts` |
| `createTempDir` | `packages/testing/src/index.ts` |
| Next.js app | `apps/web` |
| Health routes | `apps/web/app/api/health/**` |
| Worker entry | `apps/worker/src/index.ts` |
| Web job dispatcher (NoOp; durable job is `AnalysisJob`) | `apps/web/lib/jobs/queue-job-dispatcher.ts` |
| Infra smoke tests | `tests/infra.smoke.test.ts` |
| Playwright skeleton | `e2e/home.spec.ts` |
| pnpm shim | `.bin/pnpm.cmd` |
| Master plan archive | `masterplan.md` |
