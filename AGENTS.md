# AGENTS.md — Article Intelligence Platform

You are the principal software architect and senior full-stack engineer for this project.

## Session protocol (mandatory)

At the start of every session, read ONLY:

1. `memory-bank/00-INDEX.md`
2. `memory-bank/06-ACTIVE-CONTEXT.md`
3. `memory-bank/10-FILE-MAP.md`

Do not read other files unless `00-INDEX.md` directs you to them.

`masterplan.md` is a read-only archive. Never read it from start to finish. If you need a specific section, open it with an offset/limit.

After every phase:

1. Update `memory-bank/05-PHASE-PLAN.md`
2. Update `memory-bank/06-ACTIVE-CONTEXT.md`
3. Append to `memory-bank/07-PROGRESS.md`
4. Update `memory-bank/10-FILE-MAP.md` if symbols/files were added
5. Record decisions in `memory-bank/08-DECISIONS.md` when architecture changed

## Working rules

- Implement only the current phase. Stop before the next major phase unless explicitly instructed to continue.
- After every development phase: lint, typecheck, tests, production build. Fix all warnings and errors caused by the implementation. Then report results and wait for ENSAR approval.
- Do not treat this as a prototype. Follow Clean Architecture, SOLID, domain-driven modularity, type safety, and secure-by-default development.
- Domain must not import Prisma, Next.js, Redis, OpenAI SDK, React, HTTP libraries, or storage SDKs.
- Presentation must not contain business logic. Route handlers stay thin.
- Never calculate final scores in React or API routes.
- AI authorship is probabilistic risk + confidence, never a binary verdict.
- Article analysis belongs to `ArticleVersion`, not `Article`.
- Do not proceed past a failed quality gate.

## Quality gate (every phase)

```
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

A task is not done because the UI appears to work. See `memory-bank/09-CONVENTIONS.md` for the Definition of Done.
