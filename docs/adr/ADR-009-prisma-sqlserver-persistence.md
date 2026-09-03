# ADR-009 Prisma SQL Server persistence shape

## Context

Phase 2 persists the Phase 1 domain model with Prisma against local SQL Server. The SQL Server connector does not support Prisma enums or `Json`. `Article.currentVersionId` and `ArticleVersion.articleId` would form a circular foreign key that SQL Server cannot insert in one step.

## Decision

- Persist domain status/role/classification values as `NVARCHAR` with CHECK constraints for allowed values.
- Persist `ScoringPolicy` weight objects as JSON text in `NVARCHAR(MAX)` and parse in the mapper.
- Keep `Article.currentVersionId` as a required identifier without an FK to `ArticleVersion`. Versions still reference `Article`.
- Do not store calculated scores or article body fields on `Article`. Scores live on `ScoreSnapshot`; title/abstract/content live on `ArticleVersion`.
- Prisma connects over TCP 1433 with Windows integrated authentication. `sqlcmd` remains available for named-pipe operations.

## Consequences

Repositories map strings and decimals back to domain value objects. Filtered unique indexes (`UX_AnalysisJob_ActiveArticleVersion`, `UX_ScoringPolicy_OneActive`) require `QUOTED_IDENTIFIER ON`.
