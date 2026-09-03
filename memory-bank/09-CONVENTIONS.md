# Conventions

## Naming

Prefer explicit business names: `ArticleScoringService`, `SubmitArticleUseCase`, `ScoringPolicy`. Avoid Manager, Helper, Utils, Processor, Data, Stuff.

## Errors

Typed domain/application errors (`ArticleNotFoundError`, `InvalidArticleStateError`). Map to safe HTTP `{ data, error: { code, message }, meta }`. Never leak stack traces.

## Placement

- Domain rules → `packages/domain`
- Use cases → `packages/application`
- Prisma/Redis/AI SDKs → infrastructure packages
- `@aip/database` may import `@aip/domain` (repositories reconstitute entities)
- Routes stay thin
- No `process.env` outside `@aip/config`
- No hardcoded score weights
- Stitch mockups (`docs/STITCH-UI-PROMPTS.md`) are visual reference only; do not paste generated HTML into `apps/web`
- Stitch pack tokens are mapped in Tailwind (`docs/DESIGN-MAPPING.md`). Do not paste generated HTML into `apps/web` (D-019 / ADR-023).

## Testing

- Unit: domain entities, scoring, state transitions, policies, validators
- Application tests with fakes
- Repository integration against real test MSSQL (from Phase 2)
- AI tests use FakeAIProvider / FakeResearchProvider
- Playwright e2e for critical flows (later)
- Security tests: IDOR, XSS, invalid AI JSON, duplicate jobs

## Definition of Done

Feature works. Types pass. Lint passes. Tests pass. Production build passes. Errors handled. Authorization verified server-side. Loading/empty/failure states exist when UI is involved. Security considered. Architecture respected. Docs updated when necessary. No dead code. No unexplained TODOs.

## Avoid

God classes, business logic in routes/components, direct Prisma from UI, magic numbers, duplicated schemas, silent catch, excessive `any`, premature microservices.
