# Roadmap

## Now

- Inspect the separate ~1 TB system disk with `lsblk`, `vgs` and `lvs` before making storage changes.
- If sufficient free LVM capacity exists, create a dedicated SABnzbd scratch volume on that physical disk.
- Move SAB incomplete and complete/repair/unpack work off the 18 TB media disk.
- Re-run a heavy SAB + Plex playback test and compare Netdata/Tautulli evidence.
- Visually confirm the phase-1 Kometa `Newly Released` row on Plex Home and Movies > Recommended.
- Resolve the remaining closure-policy conflict around whether a fresh torrent hardlink import test is still required.
- Keep the old source disk intact until formal acceptance.

## Current checkpoint

The desktop cutover is operational and the media workstream has advanced beyond basic acceptance:

- 18 TB ext4 data disk mounted persistently at `/data`.
- Docker Engine and Compose operational.
- Plex, Radarr, Sonarr, Prowlarr, qBittorrent and SABnzbd running.
- Migration data validated.
- Private recovery archive checksum matched source/target.
- 26 NTFS-era duplicate media/torrent sets converted to hardlinks.
- Approximately 711.6 GiB reclaimed.
- Recyclarr manages both Radarr and Sonarr TRaSH profiles.
- Radarr keeps one UHD profile with 1080p fallback.
- Sonarr uses `WEB-2160p (Alternative)` with 1080p and 720p fallback.
- Automatic acquisition is Usenet-first; torrents are manual fallback.
- Real failed-download handling has demonstrated release blocklisting and fallback to another candidate.
- Plex was reclaimed after token invalidation.
- Kometa 2.4.8 was revalidated with fresh Plex/TMDb credentials.
- Tautulli was re-authorized and is healthy.
- Netdata local monitoring is deployed.
- A real SAB/Plex contention event showed about 98% data-disk utilization and ~69% CPU iowait while download throughput was only around 30 MB/s.
- nzb360 local service connections were configured; paid unlock/subscription was deferred.

## Current gate

Reduce the verified SAB-vs-Plex storage contention enough to make the desktop media stack stable under realistic load, then hand the project back to infrastructure for formal migration closure.

## Next

- Hand storage-volume creation and filesystem/LVM changes to the infrastructure workstream once the 1 TB disk layout is freshly verified.
- After the scratch-storage change, repeat load testing and confirm Plex playback remains healthy.
- Complete media-side acceptance handoff.
- Retire/unmount the old rollback source disk.
- Replace the temporary migration-version override with the permanent image pin/update policy.
- Remove the obsolete Compose `version` field.
- Extract appropriate secrets into local-only configuration and add safe public examples.
- Harden backup/restore procedures and retention.
- Resolve the unverified SAB API/NZB-key rotation item.

## After migration stabilization

- Continue Kometa v2:
  - Trending/Popular Home row
  - Director Spotlight
  - seasonal spotlight
  - tune Home/Recommended row order on the actual TV client
- Add Bazarr with duplicate-subtitle avoidance rules.
- Add Trakt/PlexTraktSync.
- Add Seerr.
- Define safe remote administration via VPN/Tailscale/WireGuard rather than exposing admin ports.
- Add media-focused agents only after the base platform and destructive-action policy are stable.

## Later infrastructure work

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
- controlled container-update automation
- infrastructure-as-code automation
- storage-focused replacement chassis

## Open decisions

- exact SAB scratch-volume size and filesystem after fresh LVM inspection
- whether a fresh ARR torrent hardlink import test remains a formal migration-closure requirement
- permanent container version/update policy
- backup tooling, retention and frequency
- purpose of a future second large disk
- timing of SSD and PSU replacement
- whether the current chassis can safely support future disk growth
