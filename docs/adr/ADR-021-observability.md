# ADR-021 Observability: structured logs, persisted usage, admin monitoring

## Context

Phase 14 added measured performance work. The masterplan requires structured logs, metrics, error tracking, job monitoring, AI usage, health endpoints, and an admin monitoring surface. Health routes already existed and must stay non-leaky. `UsageTracker` was process-local. `AnalysisRun` already stored totals. Admin cost and stage breakdowns need durable per-stage records. Failed jobs already had `retry()` in domain.

## Decision

- Structured JSON logs stay in `@aip/logging` with redaction. HTTP and worker logs include `requestId` / `jobId`, `articleId` when known, `durationMs`, and `status`. Middleware assigns `x-request-id`.
- Process metrics use an in-memory `MetricsRecorder`. Durable dashboard numbers are assembled in domain from persisted jobs, runs, usage, and operational events. React and routes never calculate article scores.
- `AiUsageRecord` is bound to `AnalysisRun` and persisted when analysis completes. `OperationalEvent` stores sanitized API/worker/AI/database failures. `SystemHeartbeat` records worker liveness for the admin dashboard only.
- `Permission.SYSTEM_OBSERVE` is admin-only. Moderators keep analysis inspect for review, not cost or retry.
- `GetObservabilityDashboardUseCase`, `ListMonitoredAnalysisJobsUseCase`, and `RetryFailedAnalysisJobUseCase` own admin reads and authorized requeue. Retry requires `ANALYSIS_FAILED` + `FAILED` job, writes `AuditLog`, and re-dispatches `analyze-article`.
- Public `/api/health*` stay boolean readiness checks. Admin health is a separate probe on the observability page.

## Alternatives

Shipping Sentry/Prometheus as hard dependencies; calculating dashboard rates in React; granting cost visibility to moderators; logging request bodies; exposing worker internals on public ready.

## Consequences

Every completed analysis can be inspected for tokens, cost, duration, and stage spend. Failed jobs can be requeued with an audit trail. Secrets stay out of logs and operational messages. Authorship remains risk + confidence + disclaimer. Scores still come only from `ScoreSnapshot`.
