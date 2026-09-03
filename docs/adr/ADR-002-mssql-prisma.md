# ADR-002 Microsoft SQL Server and Prisma

## Context

The platform needs a durable relational store, strong constraints, and typed access.

## Decision

Use Microsoft SQL Server with Prisma ORM. Phase 0 uses the existing local instance and a `sqlcmd` connectivity probe. Phase 2 added the Prisma schema, initial migration, and repository implementations. Prisma uses TCP 1433; `sqlcmd` can still use the named instance.

## Alternatives

PostgreSQL; a hosted Azure SQL instance from day one.

## Consequences

Windows-native development works without Docker. Prisma will need TCP/IP (or a verified named-pipe strategy) before Phase 2 migrations run.
