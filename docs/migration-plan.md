# Migration Plan

## Objective

Move the verified Docker media stack from the Lenovo laptop to the dedicated desktop without losing configuration, corrupting storage, or treating an untested target as production-ready.

## Current result

The bulk migration and desktop cutover are complete.

Verified so far:

- the 18 TB data disk is ext4 and mounted persistently at `/data`;
- the old external source disk was mounted read-only during cutover;
- Docker application state, media, torrents, Usenet directories and ARR backups were copied;
- recovery archive checksum matched between source and target;
- Docker Engine and Compose are operational on the desktop;
- Plex, Radarr, Sonarr, Prowlarr, qBittorrent and SABnzbd start successfully;
- local HTTP smoke tests pass;
- a real Radarr post-migration download/import completed;
- NTFS-era duplicate payloads were converted to ext4 hardlinks.

## Guardrails retained until closure

- Keep the old source disk intact until the media workstream finishes application validation.
- Do not remove the temporary migration-version override yet.
- Do not combine migration closure with broad application upgrades.
- Do not expose private backups, API keys, migration logs or local identifiers in the repository.
- Continue to treat the full Docker-stack archive as private recovery material.

## Completed phases

### Phase 1 — Move and identify storage
Completed.

The source disk was attached to the desktop and mounted read-only. The OS disk, target 18 TB disk and source external disk were positively identified before destructive actions.

### Phase 2 — Prepare target storage
Completed.

The 18 TB disk was initialized with GPT, formatted ext4, mounted persistently at `/data`, and verified.

### Phase 3 — Runtime foundation
Completed.

Docker Engine and Docker Compose were installed. The migrated Compose file parsed successfully before service startup.

### Phase 4 — Restore services
Completed for persistent services.

Plex, Prowlarr, qBittorrent, Radarr, SABnzbd and Sonarr are running on the desktop.

Kometa remains a manual one-shot service and still needs explicit post-cutover validation.

### Phase 5 — Acceptance tests
Partially complete.

Completed:

- service startup;
- local HTTP smoke tests;
- migrated application state visible in the UIs;
- real Radarr post-migration download/import.

Still required before final closure:

- Sonarr real acquisition/import check if not already captured by the media workstream;
- representative qBittorrent manual fallback check;
- Kometa manual run;
- fresh-import hardlink verification;
- final reboot/operational confidence check if the media workstream considers it necessary.

## Version-pinning decision during migration

The source Compose used untagged or `latest` images for several services.

A fresh pull produced newer releases than the notebook had been running. To avoid combining migration with application/database upgrades, the last known-good versions were recovered from logs and pinned in a temporary Compose override.

The permanent version/update policy is a post-migration decision.

## Hardlink repair

Because the old storage was NTFS, duplicate media/torrent payloads existed instead of usable hardlinks.

After migration to ext4, 26 exact duplicate sets were converted to hardlinks, reclaiming about 711.6 GiB while preserving both media and torrent paths.

## Media behavior after cutover

Automatic acquisition is now Usenet-first.

Torrent indexers remain available for Interactive Search/manual fallback, including exceptional CZ/SK releases.

Recyclarr now manages the main Radarr TRaSH profile. Sonarr will follow the same overall quality philosophy using Sonarr-specific definitions.

## Migration closure

The migration should be considered formally complete only after:

- Plex playback and scans are stable;
- Radarr and Sonarr acquisition/import are stable;
- qBittorrent manual fallback is stable;
- new torrent imports create expected hardlinks;
- Prowlarr synchronization is stable;
- Kometa manual execution is stable;
- rollback media is no longer required;
- the temporary migration-version override is replaced with the permanent image update policy;
- recovery and rollback documentation reflect the desktop as the production host.

## Post-migration cleanup

After closure:

- remove the obsolete Compose `version` field;
- extract appropriate secrets into local-only config/env files;
- add safe public examples;
- define container update policy;
- improve backup automation and retention;
- add monitoring/dashboarding;
- continue storage/network expansion as separate infrastructure work.
