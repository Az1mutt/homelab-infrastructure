# Roadmap

## Now

- Operate the desktop homelab as the post-migration production platform.
- Verify the first unattended ČSFD ratings-sync timer run after 2026-09-15.
- Define the first narrow agent-facing Movie Intelligence tool contract.
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
- Systemd ČSFD sync service verified end-to-end on 2026-09-13.
- Persistent twice-monthly timer enabled for the 1st and 15th day at 04:15 in the host's systemd timezone.

## Next

- Check the first unattended timer-triggered ČSFD sync and journal output.
- Implement a narrow read/query interface for Movie Intelligence:
  - resolve a movie;
  - check watched status;
  - check watchlist status;
  - expose structured results for an AI tool layer.
- Define later explicit write actions such as add-to-watchlist and Radarr add/search without exposing unrestricted SQL or shell execution.
- Retire/unmount the old rollback source disk when convenient.
- Replace the temporary migration-version override with the permanent image pin/update policy if still present.
- Extract appropriate secrets into local-only configuration and keep only safe public examples.
- Harden backup/restore procedures and retention.

## Post-migration media work

- Finish Sonarr TRaSH/Recyclarr configuration using the same quality philosophy as Radarr.
- Revalidate Kometa on the desktop.
- Confirm new ARR torrent imports create real hardlinks on ext4 when a suitable test case occurs.
- Refine CZ/SK handling only if real usage justifies more automation.
- Diagnose qBittorrent performance only if fallback performance remains a real issue.

## Movie Intelligence / agent control plane

The intended progression is:

```text
Observe -> Act -> Automate -> Delegate -> Autonomy
```

Near-term:

- expose safe read/query capabilities over Movie Intelligence;
- keep the local DB as the durable watchlist source of truth;
- add SerialZone as a separate future TV/series importer;
- design explicit tool contracts rather than unrestricted agent DB access.

Later write actions:

- add to watchlist;
- mark watched;
- add a movie to Radarr;
- start a Radarr search;
- reconcile downloaded/library/watchlist state;
- expose download status.

The Homelab Observer concept should evolve into an actionable control plane only through narrow allowlisted operations with validation and logging.

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

- first Movie Intelligence agent-tool interface shape
- permanent container version/update policy
- backup tooling, retention and frequency
- monitoring stack
- purpose of a future second large disk
- timing of SSD and PSU replacement
- whether the current chassis can safely support future disk growth
