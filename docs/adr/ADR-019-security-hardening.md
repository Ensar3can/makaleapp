# ADR-019 Security hardening

## Context

Phase 12 shipped moderation. Before production, the platform needed a dedicated pass over OWASP issues: authorization, IDOR, rate limits, file validation, SSRF, prompt injection, XSS, CSP, secrets, logging, database privileges, and AI endpoint abuse. Auth already had per-process limits and SameSite cookies. Research already had SSRF guards. Analysis already treated article text as untrusted data.

## Decision

- Security headers (CSP, nosniff, referrer, permissions, frame denial, production HSTS) are applied from domain policy through Next middleware and `next.config.ts`.
- Mutating requests must present an Origin or Referer that matches `APP_URL`. Safe methods stay unrestricted.
- `RateLimiter` stays an application port. `memory://` keeps `InMemoryRateLimiter`. A Redis URL uses `RedisRateLimiter` so multi-instance deployments share counters.
- Operation limits cover password reset, verification resend, article submit, public search, and moderator decide/flag. Submit limits are the AI-abuse throttle.
- `ProcessAnalysisJobUseCase` fails closed when `estimatedCost` exceeds `MAX_AI_COST_PER_ANALYSIS`.
- Profile avatar/website URLs must be public HTTPS. JSON-LD is escaped. Article bodies stay React text nodes.
- Uploaded-file inspection (extension, MIME, magic bytes, size, server-generated storage name) lives in domain even though no upload route ships yet. HTML/SVG/executables are rejected.
- AI user payloads are sanitized and fenced. `SESSION_PEPPER` is required in production. Health ready responses no longer expose Redis driver details.
- Edge middleware may read `APP_URL` / `NODE_ENV` directly because `@aip/config` is Node-only.

## Alternatives

CSRF tokens on every form; nonce-based CSP that Next.js 15 does not yet apply cleanly; per-process limits only; auto-reject high-cost jobs in the provider instead of the job use case.

## Consequences

Same-origin browser clients continue to work. Cross-site POSTs fail closed. Rate limits survive more than one web process when Redis is configured. Production must set `SESSION_PEPPER`. The SQL login should remain least-privilege (`db_datareader` / `db_datawriter`, no `sysadmin`); the local Windows-integrated account is a Phase 0/2 development exception, not a production pattern.
