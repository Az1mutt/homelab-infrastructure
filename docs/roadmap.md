# Roadmap

## Now

- Operate the desktop homelab as the post-migration production platform.
- Choose the low-frequency ČSFD ratings-sync cadence.
- Create and verify a systemd service/timer for `scripts/sync_csfd.mjs`.
- Keep Movie Intelligence writes controlled, idempotent and auditable.
- Continue media-specific validation and cleanup without treating it as a migration blocker.

## Current checkpoint

The notebook-to-desktop migration is formally closed as of 2026-09-09.

Verified project milestones:

- 18 TB ext4 data disk mounted at `/data`.
- Docker Engine and Compose operational during cutover.
- Plex, Radarr, Sonarr, Prowlarr, qBittorrent and SABnzbd reproduced on the desktop.
- Migration data and recovery archive validated.
- Real Radarr post-migration download/import completed.
- 26 NTFS-era duplicate media/torrent sets converted to hardlinks.
- Approximately 711.6 GiB reclaimed.
- Radarr consolidated onto one UHD profile with 1080p fallback.
- Automatic acquisition is Usenet-first; torrents are manual fallback.
- Local Movie Intelligence SQLite foundation created.
- ČSFD ratings ingestion verified.
- One-time private ČSFD watchlist bootstrap completed.
- Movie database verified at 682 unique movies: 556 watched, 126 watchlist, 0 overlap.

## Next

- Deploy low-frequency scheduled ČSFD ratings sync with logging.
- Retire/unmount the old rollback source disk when convenient.
- Replace the temporary migration-version override with the permanent image pin/update policy if still present.
- Remove the obsolete Compose `version` field if still present.
- Extract appropriate secrets into local-only configuration and keep only safe public examples.
- Harden backup/restore procedures and retention.
- Refresh public documentation when live runtime details materially change.

## Post-migration media work

- Finish Sonarr TRaSH/Recyclarr configuration using the same quality philosophy as Radarr.
- Revalidate Kometa on the desktop.
- Confirm new ARR torrent imports create real hardlinks on ext4 when a suitable test case occurs.
- Refine CZ/SK handling only if real usage justifies more automation.
- Diagnose qBittorrent performance only if fallback performance remains a real issue.

## Movie Intelligence / agents

- Add a safe scheduled ČSFD ratings sync.
- Keep ČSFD private watchlist as a one-time bootstrap source; the local DB becomes the durable watchlist source of truth.
- Add SerialZone as a separate future TV/series importer.
- Add controlled operations for:
  - add to watchlist;
  - mark watched;
  - add to Radarr;
  - reconcile watched/watchlist state.
- Enrich later with TMDb, IMDb, Plex and Radarr identifiers/metadata.
- Prefer narrow scripts/API tools over unrestricted agent DB writes.

## Later infrastructure work

- Add monitoring/dashboarding.
- Define controlled container-update automation.
- Improve backup/restore drills.
- Move system/appdata to SSD if appropriate.
- Replace the budget-class PSU before major disk expansion.
- Improve chassis airflow.
- Add another large disk and choose backup, mirror, parity or capacity role deliberately.
- Replace Wi-Fi with Ethernet.
- Consider 2.5 GbE after the broader network upgrade.
- Consider HBA/SATA expansion when storage growth requires it.

## Optional backlog

- UPS
- HBA or SATA expansion controller
- mergerfs or another pooling layer
- SnapRAID or alternative parity design
- VPN-based remote access
- infrastructure-as-code automation
- storage-focused replacement chassis

## Open decisions

- ČSFD sync cadence
- permanent container version/update policy
- backup tooling, retention and frequency
- monitoring stack
- purpose of a future second large disk
- timing of SSD and PSU replacement
- whether the current chassis can safely support future disk growth
