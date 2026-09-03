# ADR-007 AI authorship risk

## Context

Binary AI-written labels are scientifically unreliable and high-impact.

## Decision

Represent authorship as `AIAuthorshipAssessment`: risk score, confidence, classification, signals, and explanation. One detector never auto-rejects an article.

## Alternatives

A true/false AI detector that blocks publication.

## Consequences

UI copy says "AI authorship risk". Confidence can reduce the authorship weight in the final score.
