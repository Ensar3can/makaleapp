# ADR-010 Session authentication

## Context

Phase 3 needs registration, login, logout, email-verification architecture, RBAC, and brute-force protection without introducing OAuth or a JWT access-token store.

## Decision

- Passwords are hashed with Node `scrypt` (`N=16384`, `r=8`, `p=1`) in `@aip/auth`.
- Sessions are opaque random tokens. Only the SHA-256 digest (optional pepper) is stored in `Session`.
- The browser receives an HttpOnly, SameSite=Lax cookie (`Secure` in production). Tokens are never written to `localStorage`.
- Email verification and password reset use hashed one-time `AuthToken` rows and an `EmailSender` port. Phase 3 delivers through the console.
- Failed logins are persisted. Five failures in 15 minutes lock the email. In-memory rate limits also cap login/register/forgot-password by IP until Redis is available.
- Authorization is enforced in application/domain (`Permission` / `Role`), not in React.

## Alternatives

JWT access tokens; NextAuth; storing the raw session token; Argon2id native bindings.

## Consequences

Session revocation and password-reset logout are straightforward. Rate limits are per process until a Redis limiter lands. Seed users receive real scrypt hashes.
