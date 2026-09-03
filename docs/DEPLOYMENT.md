# Deployment

Windows-native development stays the default. Docker Compose is the production-shaped stack: web, worker, SQL Server, Redis, and MinIO.

Local-only Compose passwords are placeholders. Replace every secret before a real deploy.

## Boot with Docker

```
docker compose up --build
```

Optional TLS proxy:

```
docker compose --profile proxy up --build
```

Optional Mailpit:

```
docker compose --profile mail up
```

Then:

- Web: `http://localhost:3000`
- MinIO console: `http://localhost:9001`
- SQL Server host port: `14333` (container still uses `1433`)
- Redis host port: `6380` (container still uses `6379`)
- Caddy (proxy profile): `http://localhost:8080` and `https://localhost:8443`

Override defaults with `docker compose --env-file .env.docker up --build` after copying `.env.docker.example`. Real hosts use `.env.production.example`.

Windows-native `pnpm dev` is unchanged. Keep `.env` on integrated security and `OBJECT_STORAGE_DRIVER=local-disk`.

## Environment

All runtime env is validated by `@aip/config`. Do not read `process.env` in domain or use cases.

Production boot requires:

- `SESSION_PEPPER` of at least 16 characters
- `REDIS_URL` that is a real Redis URL, not `memory://`
- S3 credentials when `OBJECT_STORAGE_DRIVER=s3`
- `APP_URL` using `https://` unless it is loopback (`localhost` / `127.0.0.1`) for local Compose

`APP_URL` must match the public origin used by browsers. Session cookies are `Secure` only when that origin is HTTPS, so `http://localhost:3000` still works in a production image. Behind Caddy, set `APP_URL` to the HTTPS origin.

## Database migration

1. Take a backup.
2. Deploy the new image or checkout.
3. Run `pnpm --filter @aip/database prisma:migrate` (`prisma migrate deploy`).
4. The web container does this on startup: wait for SQL Server, create `aip` if missing, then migrate.
5. Confirm `/api/health` and `/api/health/ready`.

Never run `prisma migrate dev` in production. That command rewrites migrations.

Roll forward only with committed migrations under `packages/database/prisma/migrations/`. If a migration is wrong, restore the previous database backup and previous image. Do not hand-edit applied migrations.

## Backup

SQL Server (Windows native):

```
powershell -File scripts/backup-database.ps1
```

SQL Server (Compose):

```
sh scripts/backup-database.sh
```

Object storage:

- Local disk: copy `OBJECT_STORAGE_ROOT`
- MinIO/S3: versioned bucket plus `mc mirror` or the provider’s snapshot

Keep database and object-storage backups from the same point in time. Article binaries are not SQL BLOBs.

## Redis

Production uses Redis (or Memurai) for the job queue, rate limits, and public cache.

Recommended server flags:

- `appendonly yes`
- `requirepass` or ACL users
- bind to a private network only
- persist the volume

Compose mounts `docker/redis.conf` (AOF + protected mode). Add `requirepass` there and `REDIS_URL=redis://:password@redis:6379` before any shared or public host.

## Object storage

`IObjectStorage` is unchanged. Drivers:

- `local-disk` — Windows-native default
- `s3` — MinIO, AWS S3, or any S3-compatible endpoint

Compose uses MinIO with path-style URLs. Production AWS can omit `OBJECT_STORAGE_ENDPOINT` and set `OBJECT_STORAGE_FORCE_PATH_STYLE=false`.

## HTTPS and reverse proxy

Terminate TLS in front of Next.js. Compose ships a Caddy profile that proxies to `web:3000`.

Checklist:

- Public `APP_URL` is `https://...`
- Forward `Host`, `X-Forwarded-Proto`, and `X-Forwarded-For`
- Security headers and HSTS stay on the Next.js app
- Mutating requests still need a matching Origin/Referer
- `/api/health` and `/api/health/ready` stay non-leaky

## Deploy

1. Backup SQL Server and object storage.
2. Build images from the git SHA you intend to run.
3. `docker compose up --build -d` or roll the same images in your orchestrator.
4. Web runs migrations, then `next start`.
5. Worker waits until the database accepts connections, then polls jobs.
6. Check `/api/health/ready`, admin observability, and one analysis job.

CI on every push and pull request: lint, typecheck, unit tests, production build. Full `pnpm test` still needs the local SQL Server instance.

## Rollback

1. Stop web and worker so no new writes land on a schema you are about to replace.
2. Restore the SQL Server backup taken before the failed deploy.
3. Restore object storage from the matching snapshot.
4. Start the previous image tag or git SHA.
5. Do not run newer migrations against the restored database.
6. Confirm `/api/health/ready` and that scores still come from `ScoreSnapshot`.

If only the app is broken and the current schema is compatible with the previous image, rolling back the image without a database restore is enough. If a migration already applied, restore the backup.
