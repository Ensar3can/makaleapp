# ADR-001 Next.js App Router

## Context

The product is a web platform with public discovery pages, dashboards, and APIs.

## Decision

Use Next.js App Router with React Server Components by default. Client components only when browser interactivity is required.

## Alternatives

Pages Router; a separate React SPA plus API server.

## Consequences

Server-side rendering and metadata are first-class. Presentation stays in `apps/web`. Business logic must not live in route handlers or components.
