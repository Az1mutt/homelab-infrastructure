# Current State

**Snapshot date:** 2026-09-09  
**Project phase:** migration closed; post-migration operations and Movie Intelligence foundation active

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

The notebook-to-desktop migration is **formally closed as of 2026-09-09** by owner acceptance in the infrastructure workstream.

This changes the project boundary:

- migration acceptance is no longer an active gate;
- the desktop remains the production homelab target;
- remaining media checks and infrastructure hardening are post-migration follow-ups, not closure blockers;
- the old rollback source disk can now be retired/unmounted when convenient after any final user-desired spot checks.

## Desktop platform

The last detailed host/runtime snapshot was captured on 2026-09-01. The following remain the latest known verified values, but time-sensitive runtime details should be refreshed before making claims that require current live state.

| Item | Status | Current knowledge |
|---|---|---|
| Host | Verified | Dedicated Ubuntu Server desktop |
| Operating system | Verified | Clean Ubuntu Server installation |
| SSH | Verified | Remote administration works |
| Network | Verified historically | Wi-Fi stable; Ethernet remains preferred long-term |
| System disk | Verified | Existing ~1 TB WDC disk hosts the OS |
| Data disk | Verified | Toshiba MG09 18 TB disk |
| Data filesystem | Verified | ext4 |
| Persistent mount | Verified | `/data` |
| Docker Engine | Verified historically | 29.7.2 |
| Docker Compose | Verified historically | v5.5.0 |
| Media stack | Verified historically | Plex, Radarr, Sonarr, Prowlarr, qBittorrent, SABnzbd |
| Kometa | Post-migration follow-up | Revalidation remains useful but is not a migration-closure blocker |
| Recyclarr | Verified historically | Separate Compose project managing Radarr TRaSH configuration |

## Storage and migration outcome

Verified migration results include:

- source disk mounted read-only before copying;
- private pre-migration Docker-stack archive readable;
- source and target recovery archive SHA-256 matched;
- media and torrent copy verification completed successfully;
- Compose parsed successfully before first boot;
- persistent media services started successfully;
- local HTTP smoke tests responded as expected;
- a real Radarr post-migration download/import completed successfully;
- 26 NTFS-era duplicate media/torrent sets were converted to ext4 hardlinks;
- approximately 711.6 GiB was reclaimed;
- a representative hardlink pair shared the same inode with link count 2.

## Movie Intelligence

A new local Movie Intelligence foundation is verified on the desktop.

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

## Acquisition policy

Current intended behavior:

- Usenet is the automatic/default path.
- Torrent indexers are manual/Interactive Search fallback.
- CZ/SK torrent sources are also manual unless a future real use case justifies automation.

## Post-migration follow-ups

These remain useful, but they no longer block migration closure:

- choose a low-frequency ČSFD ratings sync cadence and deploy a systemd timer;
- revalidate Kometa and ARR torrent hardlink behavior when convenient;
- finish Sonarr TRaSH/Recyclarr configuration in the media workstream;
- retire/unmount the old rollback source disk;
- choose a permanent container image pin/update policy;
- remove or replace the temporary migration override if still present;
- remove the obsolete Compose `version` attribute if still present;
- extract appropriate secrets into local-only configuration;
- mature backup/restore retention and restore drills;
- add monitoring/dashboarding;
- later design controlled agent operations for watchlist, watched state and Radarr actions.

## Evidence boundary

Migration closure is verified by explicit owner acceptance on 2026-09-09. Some lower-level runtime details have not been freshly rechecked since the 2026-09-01 migration snapshot; refresh them before treating those time-sensitive values as current.
