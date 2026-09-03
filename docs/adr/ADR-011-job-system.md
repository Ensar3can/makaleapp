# ADR-011 Job system

## Context

Article analysis must not run inside the submit HTTP request. Phase 4 persisted a `QUEUED` `AnalysisJob`. Phase 5 needs a worker, retries, and idempotency before a real AI pipeline exists.

## Decision

- Queue access stays behind `IJobQueue` / `IJobWorker`. BullMQ is the Redis adapter. `InMemoryJobQueue` remains for tests and `memory://`.
- `AnalysisJob` in SQL Server is the source of truth. Submit enqueues `analyze-article` with `jobId = AnalysisJob.id` when Redis is available. The worker always polls due `QUEUED` jobs so Windows can run without Memurai.
- `ProcessAnalysisJobUseCase` claims `QUEUED → RUNNING` with `saveIfStatus`, runs `FakeArticleAnalyzer`, and persists an `AnalysisRun`. It does not write `ScoreSnapshot`.
- Retry is owned by the domain job (fail → queue, max 3). Concurrent workers cannot both claim the same job.

## Alternatives

Run analysis in the Next.js route; rely only on BullMQ without a durable job row; compute scores in the fake analyzer.

## Consequences

Async architecture can be verified with a deterministic fake. Phase 6 can replace `FakeArticleAnalyzer` without changing claim/retry/idempotency. Scores remain a later phase.
