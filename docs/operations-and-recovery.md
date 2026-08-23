# Operations and Recovery

## Safe read-only inventory

These commands are intended for evidence collection. Review outputs for private identifiers before publishing them.

```bash
cat /etc/os-release
uname -a
lscpu
free -h
lsblk -o NAME,MODEL,SIZE,FSTYPE,FSVER,LABEL,UUID,MOUNTPOINTS
findmnt /data
df -hT /data
docker compose -f /data/docker/docker-compose.yml ps
```

Useful targeted checks:

```bash
sudo smartctl --scan
sudo smartctl -a /dev/<DEVICE>
ss -lntup
sudo ufw status verbose
find /data/arr_backup -maxdepth 2 -type f -printf '%TY-%Tm-%Td %TH:%TM %s %p\n'
```

SMART reads are non-destructive, but device paths must still be resolved deliberately. Extended tests and destructive disk preparation belong to the migration procedure.

## Confirmed recovery evidence

- Radarr, Sonarr, and Prowlarr have all been restored successfully from application backups in the past.
- Sonarr previously recovered from a `database disk image is malformed` failure through restore.
- A fresh native backup was created for Radarr, Sonarr, and Prowlarr immediately before the 2026-08-23 migration freeze.
- A full consistent snapshot of `/data/docker` was created while every persistent container was stopped:

```text
/data/arr_backup/docker-stack-pre-migration-2026-08-23.tar.gz
```

- The archive is approximately 662 MiB.
- The archive was validated with a complete `tar -tzf` read.
- After the snapshot, all persistent services were started again and verified `Up`.

The full archive contains private application configuration and credentials. It is a recovery artifact, not a repository artifact.

## Historical incident

Approximately 1 TB of movie data was physically deleted during an earlier Windows-to-Linux migration. ARR databases survived because application backups existed; the media files did not.

This incident drives three migration rules:

1. Copy before cutover; do not treat a move as the first safety mechanism.
2. Verify file counts, sizes, representative playback, and checksums where appropriate.
3. Keep the source state and independent configuration backups until acceptance is complete.

## Current backup boundary

The immediate media-application recovery position is materially improved because the complete Docker application state is now archived. The following remain outside a mature automated backup design:

- automated off-host retention of the private Docker-stack archive;
- target system-disk backup;
- personal photos/documents;
- bulk media backup or parity strategy;
- retention policy and scheduled integrity checks;
- formal restore drills on the target server.

Downloaded media may have a lower backup priority if it can be reacquired, but that policy should remain explicit.

## Migration restore order

Recommended sequence:

1. Verify storage identity and mounts.
2. Verify the private snapshot and source directories are readable.
3. Restore `/data/docker` or equivalent target appdata without changing versions where avoidable.
4. Start Plex and validate library access.
5. Start qBittorrent and SABnzbd; validate paths.
6. Start Prowlarr; validate indexers/app synchronization.
7. Start Radarr and Sonarr; validate databases, root folders, profiles, and download clients.
8. Run Kometa manually.
9. Perform a small real Usenet acceptance test.
10. Perform a representative torrent fallback test.
11. Reboot and verify mounts and service recovery.

## Recovery acceptance

A recovery design is credible only after it demonstrates:

- a configuration backup stored independently from the active application state;
- restoration of representative services on the target;
- documented secret restoration without committing secrets;
- persistent mounts and services surviving reboot;
- a defined recovery point and retention policy;
- a rollback procedure for migration.

The 2026-08-23 archive is the current rollback point for the media application layer, but it does not by itself constitute a complete disaster-recovery system.
