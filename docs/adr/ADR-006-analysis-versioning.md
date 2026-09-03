# ADR-006 Analysis versioning

## Context

Authors will edit articles after analysis. Reusing an old score would be incorrect and unfair.

## Decision

Every analysis is bound to an `ArticleVersion` (content hash + version number). A significant edit requires re-analysis before publication.

## Alternatives

Store a single score on `Article` and overwrite it.

## Consequences

Historical runs remain auditable. Publication must verify the analyzed version is current.
