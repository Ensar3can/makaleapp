# Active Context

## Current phase

Post-v1.0 — GitHub + Vercel preview host

**Status:** Production frontend v1.0 is closed. Source is on GitHub `main`. A Vercel Next.js preview exists so the UI can be opened in a browser. That host is not Wave A go-live: there is no public SQL Server, Redis, worker, or SMTP.

## Backend check

Numbered backend phases 0–16 remain complete. Intentionally remaining (not v1.0 defects):

- Console `EmailSender` (Phase 3) — public go-live blocker
- SQL Server FTS deferred (Phase 14)
- Playwright e2e later
- Admin category/user CRUD has no use cases (screens are reserved empty)
- Docker CLI was not installed on the Windows workstation

## GitHub and Vercel

- Remote: `https://github.com/Ensar3can/makaleapp` (public)
- Default branch: `main` (local `master` tracks `origin/main`)
- Tracking issue: https://github.com/Ensar3can/makaleapp/issues/1
- CI: `.github/workflows/ci.yml` on push/PR
- Vercel project: `ensar-ueccan/makaleapp`, Git connected to `Ensar3can/makaleapp`, root `apps/web`
- Preview URL: `https://makaleapp.vercel.app` (confirm after first production deploy)
- Do not commit `.env` files

## Goal

Keep GitHub `main` as the source of truth. Do not start Wave A–D without ENSAR approval.

## Checklist

- [x] Backend completeness review (from design mapping)
- [x] Production frontend v1.0 Tasks 1–10
- [x] Task 10 final report (86/100)
- [x] Post-v1.0 backlog written in `05-PHASE-PLAN.md`
- [ ] Wave A public go-live (SMTP, Compose, production env, optional real AI)
- [ ] Wave B Playwright + browser QA
- [ ] Wave C reserved product backends
- [ ] Wave D optional FTS / infinite scroll / APM

## Sign-off (v1.0, unchanged)

1. Protected routes keep a validated internal `next` path through login
2. Login/register redirect signed-in users; auth pages are noindex
3. `requirePageSession` only maps `UnauthenticatedError` to login
4. Open redirects fall back to `/dashboard`
5. Admin category/user, settings account/notifications/privacy, and the notification inbox stay reserved empty until Wave C
6. No scores calculated in React; authorship remains risk + confidence + disclaimer

## Next step

Wait for ENSAR to approve Wave A (SMTP first) or another wave. After each approved phase, commit and `git push origin main`.
