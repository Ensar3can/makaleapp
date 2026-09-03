# ADR-003 Background worker

## Context

Article analysis is too slow and too expensive to run inside an HTTP request.

## Decision

Ship a separate `apps/worker`. Queue access goes through `IJobQueue`. Phase 0 uses `InMemoryJobQueue`. Phase 5 adds a BullMQ adapter.

## Alternatives

Next.js route-time analysis; a serverless queue only.

## Consequences

The web app stays responsive. Domain code never imports BullMQ. Jobs must be idempotent.
