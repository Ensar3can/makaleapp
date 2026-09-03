# ADR-023 Design mapping from Stitch tokens

## Context

Backend phases 0–16 are implemented. ENSAR asked to bind the existing Next.js UI to the parked ScholarFlow design pack. D-019 forbids pasting Stitch HTML into `apps/web`. D-025 froze the zip until this approval.

## Decision

Extract tokens from the pack’s `DESIGN.md` into Tailwind and shared React chrome. Rebuild screens that already exist. Do not commit unpacked Stitch HTML. Do not add admin category/user screens without use cases. Scores stay display-only from `ScoreSnapshot`.

## Alternatives

Drop generated HTML into App Router pages; wait for a full Figma rebuild; ignore the pack and invent a third visual language.

## Consequences

The product keeps Clean Architecture and the authorship disclaimer. Visual language matches the approved pack without taking a dependency on generated markup. Further screen polish can reuse `btn-primary`, `card-surface`, and the header/footer shells.
