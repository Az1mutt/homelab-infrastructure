# Roadmap

## Now

- Complete application-level validation on the desktop.
- Finish Sonarr TRaSH/Recyclarr configuration in the media workstream using the same quality philosophy as Radarr.
- Confirm new ARR torrent imports create real hardlinks on ext4.
- Revalidate Kometa manually on the desktop.
- Keep the old source disk intact until final acceptance.

## Current checkpoint

The desktop cutover is operational:

- 18 TB ext4 data disk mounted persistently at `/data`.
- Docker Engine and Compose operational.
- Plex, Radarr, Sonarr, Prowlarr, qBittorrent and SABnzbd running.
- Migration data validated.
- Private recovery archive checksum matched source/target.
- Real Radarr post-migration download/import completed.
- 26 NTFS-era duplicate media/torrent sets converted to hardlinks.
- Approximately 711.6 GiB reclaimed.
- Recyclarr introduced for reproducible TRaSH configuration.
- Radarr consolidated onto one UHD profile with 1080p fallback.
- Automatic acquisition is Usenet-first; torrents are manual fallback.

## Next

- Receive the media-workstream completion handoff.
- Retire/unmount the old rollback source disk.
- Replace the temporary migration-version override with the permanent image pin/update policy.
- Remove the obsolete Compose `version` field.
- Extract appropriate secrets into local-only configuration and add safe public examples.
- Harden backup/restore procedures and retention.
- Refresh public documentation to reflect the desktop as the production host.

## After migration stabilization

- Add monitoring/dashboarding.
- Define controlled container-update automation.
- Improve Kometa scheduling and collection automation.
- Refine CZ/SK handling only if real usage justifies more automation.
- Diagnose qBittorrent performance only if fallback performance remains a real issue.
- Consider VPN routing for qBittorrent only if there is a clear requirement.

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
- VPN-based remote access
- infrastructure-as-code automation
- storage-focused replacement chassis
- media-focused agents after the base platform is stable

## Open decisions

- permanent container version/update policy
- backup tooling, retention and frequency
- monitoring stack
- purpose of a future second large disk
- timing of SSD and PSU replacement
- whether the current chassis can safely support future disk growth
