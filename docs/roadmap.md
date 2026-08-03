# Roadmap

## Now

- Resolve safe mounting for the existing HDD and the 18 TB disk.
- Obtain PCIe Wi-Fi or arrange temporary Ethernet.
- Prepare Ubuntu Server 24.04 LTS installation media.
- Boot the desktop and collect exact hardware inventory.
- Audit the approximately 1 TB system disk and explain the previously visible 100 GB.
- Capture local SMART baselines.
- Run the 18 TB disk acceptance sequence.

## Next

- Select the data filesystem and final mount paths.
- Configure persistent UUID-based mounts.
- Configure SSH and a stable LAN identity.
- Install Docker Engine and Docker Compose.
- Establish permissions, `.env`, and secret-handling rules.
- Deploy a low-risk pilot service.
- Capture and sanitize the current laptop's live Compose definition.
- Define an independent configuration-backup workflow.
- Migrate services incrementally.

## Media-stack checkpoint

- Resolve NZBGeek access or choose another NZB indexer.
- Test one complete ARR → SABnzbd → Eweka → import → Plex workflow.
- Add `use_separator: false` to the Kometa director defaults and remove the existing separator.
- Verify persistent Kometa scheduling.
- Design a rotating `Director Spotlight` only after the current behavior is stable.

## Blocked

| Item | Blocker |
|---|---|
| End-to-end Usenet | No working NZB indexer |
| Target network | Wi-Fi card not installed and permanent Ethernet unavailable |
| Permanent disk operation | Secure mounting unresolved |
| Final storage layout | System-disk audit and filesystem decision pending |
| Migration execution | Target OS, network, disks, and runtime not ready |

## Later

- Move the operating system and appdata to an SSD.
- Replace the budget-class PSU before major disk expansion.
- Improve chassis airflow.
- Add another large disk and implement backup or parity according to the selected goal.
- Add monitoring and a dashboard.
- Replace Wi-Fi with Ethernet.
- Consider Immich, Paperless-ngx, Ollama, and Open WebUI after the base platform is stable.
- Develop custom media automation or agents.

## Optional backlog

- UPS
- 2.5 GbE
- HBA or SATA expansion controller
- mergerfs or another pooling layer
- SnapRAID or alternative parity design
- VPN-based remote access
- infrastructure-as-code automation
- controlled update automation
- a storage-focused replacement chassis

## Open decisions

- ext4, XFS, or btrfs for the bulk-data disk
- final appdata and bulk-data mount paths
- UID/GID and permissions model
- Docker network strategy
- update policy
- backup tooling, retention, and frequency
- monitoring stack
- purpose of the second large disk: backup, mirror, parity, or capacity
- timing of SSD and PSU replacement
- whether the current chassis can safely support future disk growth

