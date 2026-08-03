# Migration Plan

## Objective

Move the working Docker media stack from the Lenovo laptop to the target desktop without destroying the source, losing configuration, or presenting an untested target as production-ready.

## Guardrails

- Keep the laptop operational until the target passes all acceptance criteria.
- Begin with read-only hardware and disk discovery.
- Do not format a disk until its identity and intended role are confirmed.
- Never use `/dev/sdX` names as persistent mount identifiers.
- Back up configuration before changing the source or target.
- Migrate incrementally and retain a rollback point after every stage.

## Phase 1 — Physical preparation

1. Identify the correct drive rails, brackets, and native 3.5-inch positions.
2. Securely mount or safely stage the system and data disks.
3. Confirm airflow around the 18 TB enterprise disk.
4. Inspect SATA data cables and power connectors.
5. Obtain and install a compatible PCIe Wi-Fi adapter, or use temporary Ethernet.
6. Record motherboard, RAM, CPU, SATA-port, and expansion details.

## Phase 2 — Base platform

1. Inspect BIOS/UEFI and boot configuration.
2. Install Ubuntu Server 24.04 LTS on the intended system disk.
3. Configure LAN access and verify SSH.
4. Collect hardware and storage inventory.
5. Investigate the 1 TB versus 100 GB capacity discrepancy.
6. Capture local SMART baselines for both disks.

No service migration begins if disk identity, capacity, or health remains ambiguous.

## Phase 3 — Data-disk acceptance

1. Run the 18 TB extended SMART self-test.
2. Run a full-surface read test.
3. Monitor temperature and UDMA CRC count.
4. Decide whether an empty-disk destructive burn-in is justified.
5. Select the filesystem.
6. Create and label the filesystem only after explicit confirmation.
7. Configure persistent UUID-based mounting.
8. Reboot and verify the mount.

## Phase 4 — Runtime foundation

1. Install Docker Engine and the Docker Compose plugin.
2. Define appdata and bulk-data paths.
3. Establish UID/GID and permissions policy.
4. Establish `.env` and secret-management rules.
5. Deploy one low-risk pilot service.
6. Reboot and verify automatic recovery.

## Phase 5 — Media-stack migration

1. Capture the live Compose configuration and exact image versions from the laptop.
2. Sanitize a repository version and keep secrets outside Git.
3. Back up all application configuration.
4. Migrate one service at a time.
5. Verify mounts, ownership, ports, service health, and logs after each service.
6. Copy media and downloads; do not delete the source copy.
7. Validate torrent download and ARR import.
8. Add a working NZB indexer and validate Usenet end to end.
9. Validate Plex library access and Direct Play from the Samsung TV.
10. Verify Kometa manual and scheduled behavior.

## Phase 6 — Cutover and stabilization

1. Reboot the target and confirm all required mounts and services.
2. Validate SSH access and LAN endpoints.
3. Run representative download, import, playback, and collection tests.
4. Create an independent configuration backup.
5. Document rollback and restore.
6. Keep the laptop unchanged for an agreed stabilization period.
7. Retire it from normal service only after the target remains stable.

## Completion criteria

Migration is complete only when:

- the desktop boots without local intervention;
- SSH remains available;
- disks are securely mounted and their health is understood;
- persistent mounts survive reboot;
- Docker Compose starts all required services;
- service configuration is preserved;
- torrent and Usenet download/import paths work;
- Plex serves expected libraries and representative playback succeeds;
- Kometa behavior is understood and repeatable;
- configuration is backed up outside the target;
- rollback and recovery procedures are documented;
- the laptop is no longer required for normal operation.

