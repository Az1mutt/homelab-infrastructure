# Roadmap

## Now

- Move the existing external HDD from the frozen laptop source to the desktop.
- Identify all disks read-only and confirm the old source disk, system disk, and 18 TB Toshiba disk.
- Complete the 18 TB SMART acceptance step before destructive storage preparation.
- Decide final filesystem and mount layout.
- Configure persistent UUID-based mounts.
- Verify permissions and access to the existing `/data` tree.
- Install or validate Docker Engine and Docker Compose on the desktop.
- Restore the known-good media stack incrementally.

## Migration checkpoint

The source media stack is ready for migration:

- Radarr Usenet workflow verified end to end.
- Sonarr Usenet workflow verified end to end.
- NZBGeek active through Prowlarr.
- SABnzbd + Eweka verified with real downloads.
- Plex Movies and TV libraries verified.
- Plex automatic library scanning verified.
- Kometa manual run verified with `use_separator: false`.
- Fresh Radarr, Sonarr, and Prowlarr backups created.
- Full private Docker-stack archive created and read-verified.
- Laptop configuration is frozen as the rollback source.

## Next

- Restore Plex and validate existing media/playback.
- Restore qBittorrent and SABnzbd and validate paths.
- Restore Prowlarr and ARR integrations.
- Restore Radarr and Sonarr and verify root folders, profiles, and download clients.
- Run a small real Usenet test on the desktop.
- Run a representative torrent fallback test.
- Run Kometa manually and verify collections.
- Reboot the desktop and verify mounts, SSH, and service recovery.
- Observe the reproduced stack before adding new features.

## Blocked / waiting

| Item | Blocker |
|---|---|
| Destructive 18 TB preparation | SMART acceptance must finish and exact target must be confirmed |
| Media-stack cutover | Final desktop mounts, permissions, and Docker runtime are not ready yet |
| Post-migration enhancements | Desktop stack must first pass migration acceptance |

## After migration stabilization

- Remove the obsolete Compose `version` field.
- Refactor appropriate secrets into a local `.env`.
- Add `.env.example` with placeholders and keep `.env` ignored.
- Publish a sanitized Compose example.
- Update containers under a defined update policy.
- Verify persistent Kometa scheduling.
- Add rotating `Director Spotlight` or related Kometa automation.
- Improve CZ/SK and dual-audio quality/custom-format rules.
- Diagnose qBittorrent performance if fallback performance remains poor.
- Add monitoring and a dashboard.
- Consider controlled update automation.
- Consider VPN routing for qBittorrent if there is a clear requirement.
- Develop media-focused agents only after the base platform is stable.

## Later infrastructure work

- Move system/appdata to an SSD if appropriate.
- Replace the budget-class PSU before major disk expansion.
- Improve chassis airflow.
- Add another large disk and choose backup, mirror, parity, or capacity role deliberately.
- Replace Wi-Fi with Ethernet.
- Consider Immich, Paperless-ngx, Ollama, and Open WebUI after the base platform is stable.

## Optional backlog

- UPS
- 2.5 GbE
- HBA or SATA expansion controller
- mergerfs or another pooling layer
- SnapRAID or alternative parity design
- VPN-based remote access
- infrastructure-as-code automation
- storage-focused replacement chassis

## Open decisions

- ext4, XFS, or btrfs for the bulk-data disk
- final appdata and bulk-data mount paths
- UID/GID and permissions model
- Docker network strategy
- update policy
- backup tooling, retention, and frequency
- monitoring stack
- purpose of a future second large disk
- timing of SSD and PSU replacement
- whether the current chassis can safely support future disk growth
