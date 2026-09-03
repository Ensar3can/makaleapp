# Development

## First boot

1. Install Node.js 22 LTS.
2. In a new terminal: `corepack pnpm -v` (expect 10.x).
3. Copy `.env.example` to `.env`.
4. Confirm SQL Server is running (`SQLEXPRESS` or `MSSQLSERVER1`).
5. Confirm `sqlcmd` is on PATH, or set `SQLCMD_PATH`.
6. Run `corepack pnpm install`.
7. Run `corepack pnpm test` and `corepack pnpm build`.

`corepack enable` may fail on Windows if it cannot write shims into `C:\Program Files\nodejs`. Use `corepack pnpm` and prepend the repo `.bin` directory to PATH so Turborepo can invoke `pnpm`.

## SQL Server notes (Windows)

SQLEXPRESS TCP/IP is enabled on 1433 for Prisma. `sqlcmd` still uses the named instance with Windows integrated auth. Mixed Mode is not required.

If Prisma cannot connect, run `scripts/enable-sqlexpress-tcp.ps1` as Administrator.

## Seed accounts (local only)

After `pnpm --filter @aip/database prisma:seed`:

- `admin@local.test` / `AdminPass1234` (ADMIN)
- `moderator@local.test` / `ModeratorPass1234` (MODERATOR)
- `author@local.test` / `AuthorPass1234` (USER)

The seed includes a `REQUIRES_REVIEW` article (`Authorship Risk Review Sample`) for the moderation queue. Verification and password-reset links are printed to the web server console.

## Redis / Memurai

The Memurai Developer installer returned exit code 1603 on this machine (typically an elevation / existing-install conflict). Phase 0 uses `REDIS_URL=memory://local`.

When Memurai or another Redis-compatible server listens on `6379`:

```
REDIS_URL=redis://127.0.0.1:6379
```

BullMQ arrives in Phase 5 behind `IJobQueue`.

## Object storage

Windows-native files go to `OBJECT_STORAGE_ROOT` (default `.data/storage`) through `LocalDiskObjectStorage`.

Set `OBJECT_STORAGE_DRIVER=s3` plus endpoint, keys, and bucket for MinIO or AWS S3. Domain code still talks only to `IObjectStorage`.

## Docker Compose

`docker compose up --build` starts web, worker, SQL Server, Redis, and MinIO. Host ports avoid the native SQLEXPRESS/Memurai listeners (`14333`, `6380`). See `docs/DEPLOYMENT.md`.
