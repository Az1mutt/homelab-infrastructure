# ADR 002: Source-separated, read-only movie status

- Date: 2026-09-26
- Status: Accepted for repository implementation; live acceptance pending
- Scope: Issue #9, Infrastructure & Agent Control Plane

## Context

Movie Intelligence owns personal state; Radarr owns local acquisition/library state. Existing private prototypes do not yet provide a repository-backed combined contract. Localized titles, remakes, missing IDs and conflicts make title-based joins unsafe before any future request action.

## Decision

Implement a small Node.js module/CLI with a read-only SQLite adapter, fixed GET-only Radarr adapter and versioned `get_movie_status` contract. Keep source candidates and source health separate. Prefer TMDb, then other shared stable IDs. Every conflicting supplied/source ID vetoes confirmation; matching titles and years are only candidate signals. Unknown data remains null, source failure remains unresolved, and multiple candidates remain ambiguous.

Use built-in SQLite with a configurable identifier-only schema mapping. Do not infer the private live schema or add arbitrary SQL, migrations, shell interfaces or write methods. Do not contact the live homelab for implementation acceptance. Synthetic fixtures exercise the adapters and resolver locally.

## Consequences

Callers can distinguish a successful empty lookup from an unavailable source and personal watched state from file presence. False-negative/unresolved cases are deliberately preferable to a wrong confident identity. Future enrichment attaches provenance under the existing identity boundary; it must preserve conflicts/source evidence. Whole-library reads are bounded and sufficient for v0.1, but not intended for very large libraries. Real schema compatibility and live behavior still need separate acceptance.

Deployment and any controlled Seerr request wrapper are separate tasks. This decision does not authorize unrestricted ARR writes or change media-workstream ownership.

Implementation and runbook: [Movie Intelligence](../../tools/movie-intelligence/README.md).
