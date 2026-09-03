# ADR-004 Object storage

## Context

Uploaded documents must not live as BLOBs in SQL Server.

## Decision

Introduce `IObjectStorage`. Phase 0 implements `LocalDiskObjectStorage`. Later adapters: MinIO, S3, Azure Blob.

## Alternatives

Store files in MSSQL; call a cloud SDK directly from application code.

## Consequences

Providers can change without rewriting use cases. Keys are sanitized to prevent path traversal.
