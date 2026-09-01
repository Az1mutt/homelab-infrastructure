# Desktop Migration Milestone — 2026-09-01

## Overview

The homelab media stack has been migrated from the notebook-based proof of concept to the dedicated Ubuntu Server desktop.

The migration deliberately prioritized reproduction and rollback safety over redesign. The existing logical `/data` layout was preserved, the old external source disk was mounted read-only, application state was copied with resumable tooling, and the first desktop boot used pinned application versions to avoid combining infrastructure migration with application upgrades.

## What changed

- The 18 TB Toshiba data disk is now formatted as ext4 and mounted persistently at `/data`.
- Docker Engine and Docker Compose are installed and operational on the desktop host.
- The existing Docker application state, media, torrents, Usenet directories, and ARR backups were migrated to the desktop.
- Plex, Radarr, Sonarr, Prowlarr, qBittorrent, and SABnzbd run successfully on the desktop.
- Local HTTP smoke tests passed for every persistent media service.
- A real Radarr download/import completed successfully after cutover.
- NTFS-era duplicate media/torrent payloads were converted to real ext4 hardlinks, reclaiming roughly 711.6 GiB.
- Recyclarr was introduced as a separate Compose project for reproducible TRaSH-based quality configuration.
- Radarr was consolidated onto one TRaSH-backed UHD profile with 1080p fallback.
- Automatic acquisition now prefers Usenet; torrents remain an Interactive Search/manual fallback.

## Storage migration

The target 18 TB disk was initialized with GPT, formatted as ext4, and mounted at:

```text
/data
```

The logical layout remains:

```text
/data
├── arr_backup
├── docker
├── media
├── torrents
└── usenet
```

The previous external NTFS disk was attached to the desktop read-only and kept as the rollback source during cutover.

## Data transfer and validation

The migration used resumable `rsync` transfers for:

- Docker application state
- ARR backups
- Usenet directories
- media
- torrent payloads

Validation included:

- command exit codes
- `rsync --dry-run --itemize-changes`
- source/target size comparison
- checksum comparison of the private recovery archive

The recovery archive copied to the target matched the source archive by SHA-256.

## USB bottleneck found during migration

The first large transfer ran unexpectedly slowly.

USB topology inspection showed the source disk connected at USB 2.0 speed. Moving it to a SuperSpeed controller changed the negotiated link to 5 Gbit/s and raised large-file transfer speed from roughly 10 MB/s to around 90–100 MB/s.

## Separating migration from upgrades

The existing Compose file used untagged or `latest` images for several services.

A fresh pull resolved to newer application versions than those running on the notebook. To avoid combining host migration with database/application upgrades, the last known-good versions were recovered from application logs and pinned in a temporary migration override.

This temporary override remains in place until the migration is formally closed.

## Hardlink recovery

The old NTFS-based layout contained duplicate media and torrent payloads rather than working hardlinks.

After migration to ext4:

```text
duplicate sets found: 26
linked:               26
skipped:               0
failed:                0
reclaimed:        ~711.6 GiB
```

A representative media/torrent pair was verified to share the same inode with a hardlink count of 2.

## Application validation

The persistent services started successfully on the desktop:

- Plex
- Radarr
- Sonarr
- Prowlarr
- qBittorrent
- SABnzbd

Local HTTP checks returned expected 200/302 responses.

A real post-migration Radarr quality-upgrade workflow completed successfully, providing an application-level acceptance check beyond simple container health.

## Media acquisition policy

The intended post-migration behavior is:

- **Usenet** — automatic/default acquisition
- **torrents** — Interactive Search/manual fallback
- **CZ/SK torrent sources** — manual exception when specifically needed

## TRaSH / Recyclarr direction

Recyclarr now manages the Radarr TRaSH profile.

The current Radarr quality philosophy is:

- good 2160p Blu-ray / WEB as the normal target
- good 1080p as fallback when 4K does not exist
- no automatic mass replacement of the existing library
- no requirement for very large remuxes as the default
- exceptional releases can still be selected manually

Sonarr will follow the same philosophy using Sonarr-specific TRaSH definitions.

## Current status

The desktop host is operational and the bulk migration is complete.

The old source disk is intentionally retained until media-application validation is finished. Final infrastructure closure will cover:

- source-disk retirement
- permanent image pin/update policy
- removal or replacement of the temporary migration override
- backup/restore hardening
- public-safe Compose/config cleanup
- monitoring and future storage expansion
