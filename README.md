# Article Intelligence Platform

Production-oriented web platform where users publish articles after explainable, AI-assisted evaluation.

This repository is a pnpm + Turborepo monorepo. Work incrementally by phase. Do not start the next phase without approval.

## Requirements

- Node.js 22+
- pnpm 10 (`corepack pnpm`)
- Local Microsoft SQL Server (SQLEXPRESS or MSSQLSERVER1)
- Redis protocol server later (Memurai). Until then `REDIS_URL=memory://local`

Docker is not required in Phase 0.

## Commands

On Windows, `corepack enable` may be blocked from writing shims into Program Files. Use `corepack pnpm` and add the repo `.bin` folder to PATH so Turborepo can find `pnpm`:

```powershell
$env:Path = "$PWD\.bin;$env:Path"
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm dev
```

Copy `.env.example` to `.env` before running the apps.

## Apps

- `apps/web` — Next.js App Router
- `apps/worker` — background worker (in-memory queue in Phase 0)

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [ADRs](docs/adr/)
- Agent protocol: `AGENTS.md`
- Session memory: `memory-bank/`

## Repository

Source of truth: [github.com/Ensar3can/makaleapp](https://github.com/Ensar3can/makaleapp). Default branch is `main`. Vercel hosts the Next.js app from `apps/web`; it is not a full production stack (SQL Server, Redis, and the worker stay off Vercel).

```powershell
git push origin main
```

GitHub Actions runs lint, typecheck, unit tests, and the production build on every push. Do not commit `.env`, `.env.docker`, or `packages/database/.env`.

## Quality gate

Every phase must pass lint, typecheck, tests, and production build before review.
