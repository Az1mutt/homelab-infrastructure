# Current State

**Snapshot date:** 2026-09-13  
**Project phase:** migration closed; post-migration operations and Movie Intelligence active

This document is the concise source of truth for what exists, what has been verified, and what remains planned.

## Status vocabulary

| Status | Meaning |
|---|---|
| Verified | Supported by user confirmation or captured evidence |
| Component-tested | A direct integration test passed; the full workflow did not |
| Planned | Chosen or intended, but not deployed |
| Blocked | A required prerequisite is unavailable |
| Unknown | Evidence is insufficient |
| Historical | Past event, not necessarily current configuration |

## Migration status

The notebook-to-desktop migration is formally closed as of 2026-09-09 by owner acceptance in the infrastructure workstream.

Remaining media checks and infrastructure hardening are post-migration follow-ups rather than migration-closure blockers.

## Movie Intelligence

A local Movie Intelligence foundation is operational on the desktop.

Current SQLite state:

```text
682 unique movies
556 watched/rated
126 watchlist
0 in both states
```

Implementation details:

- SQLite database: source-agnostic `media.db`;
- WAL mode enabled;
- `node-csfd-api` used for ČSFD ratings ingestion;
- `better-sqlite3` used for application-side DB access;
- one-time private ČSFD watchlist bootstrap completed;
- 142 source watchlist items parsed across three pages;
- 132 movie-like items considered for import;
- 10 series/season items excluded for a future SerialZone importer;
- six watchlist items were already watched and therefore remained watched-only;
- repeat ČSFD ratings sync processed 556 existing rows with 0 new additions.

The private ČSFD HTML export is not repository material.

## Scheduled ČSFD ratings sync

The ratings sync is now automated with systemd.

Verified on 2026-09-13:

- `movie-intelligence-csfd-sync.service` runs `scripts/sync_csfd.mjs` as a oneshot service;
- a manual systemd invocation completed successfully;
- result: 556 seen, 0 added, 556 existing rows processed;
- `movie-intelligence-csfd-sync.timer` is enabled and active (waiting);
- schedule: 1st and 15th day of each month at 04:15 in the host's systemd timezone;
- `Persistent=true` is enabled so missed runs can be caught after the host returns;
- systemd showed the next trigger as 2026-09-15 04:15:00 UTC.

The first unattended timer-triggered run should still be checked in the journal after it occurs.

## Agent / control-plane direction

The next architectural step is to expose Movie Intelligence and selected Homelab capabilities through narrow, structured tools rather than unrestricted shell, SSH or raw SQL access.

Near-term read/query capabilities should include resolving a movie and checking watched/watchlist/library state. Later write actions may include explicit, validated operations such as adding a movie to Radarr or starting a search.

The intended progression is:

```text
Observe -> Act -> Automate -> Delegate -> Autonomy
```

## Acquisition policy

Current intended behavior:

- Usenet is the automatic/default path.
- Torrent indexers are manual/Interactive Search fallback.
- CZ/SK torrent sources are also manual unless a future real use case justifies automation.

## Post-migration follow-ups

- verify the first unattended ČSFD timer run and journal output;
- revalidate Kometa and ARR torrent hardlink behavior when convenient;
- finish Sonarr TRaSH/Recyclarr configuration in the media workstream;
- retire/unmount the old rollback source disk;
- choose a permanent container image pin/update policy;
- extract appropriate secrets into local-only configuration;
- mature backup/restore retention and restore drills;
- add monitoring/dashboarding;
- implement controlled agent tools for Movie Intelligence and later Radarr actions.

## Evidence boundary

Migration closure is verified by explicit owner acceptance on 2026-09-09. The scheduled ČSFD sync service and timer were directly verified on 2026-09-13. Some lower-level host/runtime details from the 2026-09-01 migration snapshot have not been freshly rechecked and should be refreshed before treating them as current.
