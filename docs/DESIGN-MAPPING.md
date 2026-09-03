# Design mapping

ENSAR approved this phase after backend phases 0–16. Stitch HTML is still not product code (D-019). The parked pack was opened only to extract tokens.

## Source

- Prompt set: `docs/STITCH-UI-PROMPTS.md`
- Pack tokens: `docs/stitch-exports/stitch_scholarflow_design_system.zip` → `academic_research_peer_review_system/DESIGN.md`
- Unpacked HTML stays gitignored under `docs/stitch-exports/unpacked/`

## Task 3 (pixel-close)

Existing screens now follow Stitch layout more closely: 1140px + 48px desktop margins, hero mesh, catalog sidebar, sticky article sidebar, auth split panel, circular gauges on cards. Tokens stay in Tailwind. Stitch HTML is still not product code.

## What was mapped

| Stitch token | Product |
| --- | --- |
| Paper / ink / navy / emerald / amber / brick | Tailwind theme + `btn-*` / `card-surface` / `field-input` |
| EB Garamond + Hanken Grotesk | `next/font` (self-hosted, CSP-safe) |
| Score 0–100 bands | `ScoreBadge` / `ScoreGauge` (display only) |
| 5-level authorship labels | `AuthorshipRiskBadge` (no binary verdict) |
| Status capsules | `StatusBadge` |
| Fixed header + 1140px page | Public, auth, dashboard, settings shells |
| 404 empty state | `app/not-found.tsx` |

## Task 8 (code quality)

Reserved coming-soon routes compose `ReservedPage`. Metric and 5-level authorship labels are shared. Leftover `text-slate-*` chrome on editor/moderation/admin/auth uses `ink`/`muted`/`line`. Dialog and ScoreBadge stay in the kit. Stitch HTML is still not product code.

## Task 7 (a11y/UX)

Skip link, one main landmark, HeaderNav focus trap, debounce on existing GET search URLs, skeleton variants, lazy avatars, and code-split editor/flag form. Cursor pagination stays. Stitch HTML is still not product code.

## Task 6 (responsive)

Chrome, catalog, tables, and type scale hold at 320 / 375 / 768 / 1024 / 1440 / 1920. `HeaderNav` is the mobile menu below Tailwind `lg` (1024px). 1440 and 1920 stay centered on `max-w-page`. Stitch HTML is still not product code.

## Task 5 (shared primitives)

Pages compose `apps/web/components/ui` (Button, Card, fields, Alert, EmptyState, DataTable, Pagination, AppHeader, CatalogLayout, StatusPage). CSS classes in `globals.css` stay the visual tokens. Stitch HTML is still not product code.

## Task 4 (missing screens)

Stitch screens without a product route now exist as honest empty / reserved pages. No mock data.

- Author analysis: `/dashboard/articles/[id]/analysis` reads `GetAuthorArticleUseCase` (persisted metrics + snapshot). Empty while queued or failed.
- Admin category CRUD and user management: `/dashboard/admin/categories`, `/dashboard/admin/users` — reserved, no use cases.
- Settings tabs without APIs: `/settings/account`, `/settings/notifications`, `/settings/privacy`.
- Notification inbox: `/dashboard/notifications` — empty, no feed.
- Stitch `/admin/*` aliases redirect to the existing dashboard admin/moderation routes.
- Homepage “For you”, dashboard activity/trend, and social sign-in stay empty or disabled.

## Not built (no backend yet)

Admin category CRUD and admin user management still have no use cases. The screens are reserved empty states, not functional tools.

## Rules that stay

Routes and React never calculate scores. Authorship remains risk + confidence + disclaimer.
