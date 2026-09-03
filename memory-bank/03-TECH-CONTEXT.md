# Tech Context

## Stack

- TypeScript (strict)
- React + Next.js App Router
- Microsoft SQL Server + Prisma
- Zod
- Tailwind CSS
- pnpm workspaces + Turborepo
- Vitest (unit/integration)
- Playwright (e2e skeleton)
- Redis protocol via Memurai (Windows); `memory://` still valid — worker polls due `AnalysisJob` rows
- BullMQ adapter in `@aip/queue` when `REDIS_URL` is a Redis URL

## Local environment (Windows native)

Phase 0–15 stay Windows-native. Phase 16 adds optional Docker Compose (`docs/DEPLOYMENT.md`).

- Node 22.23.2 installed
- pnpm 10.15.0 via `corepack pnpm` (no global shim; use repo `.bin`)
- SQL Server instances present: `MSSQLSERVER1`, `SQLEXPRESS`
- SQLEXPRESS TCP/IP is enabled on 1433 (Prisma). SQL Browser may stay stopped.
- Auth is Windows integrated (`integratedSecurity=true`). Mixed Mode is not required.
- Memurai for Redis (default 6379); current `REDIS_URL=memory://local`
- Object storage: local disk under `.data/storage`, or S3/MinIO when `OBJECT_STORAGE_DRIVER=s3`
- Docker Compose (optional): `docker compose up --build` — web, worker, mssql, redis, minio

## Commands

```
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm build
```

`typecheck` and `test` go through `scripts/typecheck.mjs` and `scripts/prisma-generate.mjs` so a locked Windows Prisma engine does not fail the gate.

Web: `apps/web`. Worker: `apps/worker`.

## Env

Never use `process.env` in business code. Read via `@aip/config`.

See `.env.example`. Secrets never committed.

Typical connection shapes (no secrets here):

- `DATABASE_URL=sqlserver://localhost:1433;database=aip;integratedSecurity=true;trustServerCertificate=true;encrypt=true`
- `TEST_DATABASE_URL=sqlserver://localhost:1433;database=aip_test;integratedSecurity=true;trustServerCertificate=true;encrypt=true`
- `SQLSERVER_INSTANCE=.\SQLEXPRESS`
- `REDIS_URL=redis://127.0.0.1:6379`
- `OBJECT_STORAGE_ROOT=.data/storage`
- `OBJECT_STORAGE_DRIVER=local-disk` (or `s3` with endpoint/keys/bucket)
- `SESSION_COOKIE_NAME=aip_session`
- `SESSION_TTL_SECONDS=604800`

Prisma CLI (from `packages/database`): `prisma:generate`, `prisma:migrate`, `prisma:seed`. SQLEXPRESS must listen on TCP 1433 (`scripts/enable-sqlexpress-tcp.ps1`).

## Quality gate

lint → typecheck → test → production build. All must pass before phase approval.
