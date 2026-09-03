# ADR-022 Production preparation: Docker, S3 storage, CI

## Context

Phases 0–15 shipped the product on Windows-native SQL Server, optional Redis, and local-disk object storage. The masterplan’s production-preparation phase needs a repeatable image, real object storage, migration and backup procedure, HTTPS termination, and CI. Health probes that called `sqlcmd -E` cannot run in Linux containers.

## Decision

- Docker Compose boots web, worker, SQL Server, Redis, and MinIO. Caddy and Mailpit are optional profiles.
- `IObjectStorage` gains an S3-compatible adapter. Domain and use cases stay unaware of AWS SDKs. `local-disk` remains the Windows default.
- Production runtime requires a real `REDIS_URL` and a `SESSION_PEPPER`. S3 credentials are required only when that driver is selected.
- Readiness uses Prisma `SELECT 1` plus Redis and the configured storage driver. `sqlcmd` remains a Windows smoke probe.
- Web containers create the app database if missing, then run `prisma migrate deploy`. Rollback is restore-backup + previous image.
- GitHub Actions runs lint, typecheck, unit tests, and the production build. MSSQL integration tests stay on the developer machine.

## Alternatives

Kubernetes from day one; Azure Blob as the first remote driver; vendor APM; baking Windows-integrated auth into containers.

## Consequences

The same images can run on Docker Desktop or a Linux host. Native Windows development does not require Docker. Secrets stay in env, not in health payloads or logs. Authorship remains risk + confidence + disclaimer. Scores still come only from `ScoreSnapshot`.
