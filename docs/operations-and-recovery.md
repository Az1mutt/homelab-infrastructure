# Operations and Recovery

## Safe read-only inventory

These commands are intended for future evidence collection. Review outputs for private identifiers before publishing them.

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

SMART commands are read-only, but device paths must still be resolved deliberately. Extended tests and surface tests belong to the migration procedure, not casual discovery.

## Confirmed recovery evidence

- Radarr, Sonarr, and Prowlarr were restored successfully from backups.
- The backup location is `/data/arr_backup`.
- Sonarr recovered from a `database disk image is malformed` failure through restore.
- Radarr state recovered, although records for deleted media required cleanup.
- Prowlarr settings and synchronization recovered.

## Historical incident

Approximately 1 TB of movie data was physically deleted during an earlier Windows-to-Linux migration. ARR databases survived because application backups existed; the media files did not.

This incident drives three migration rules:

1. Copy before cutover; do not treat a move as the first safety mechanism.
2. Verify file counts, sizes, representative playback, and checksums where appropriate.
3. Keep the source host and independent configuration backups until acceptance is complete.

## Current backup gap

Confirmed recovery exists for ARR application state, but the following are not yet documented as automatically and independently backed up:

- Compose definitions and environment files;
- Plex configuration and metadata;
- qBittorrent, Kometa, and SABnzbd configuration;
- all application databases and logs;
- the target system disk;
- personal photos and documents;
- media data;
- off-host or off-site copies;
- retention, integrity checks, and restore drills.

## Backup priority

Highest priority:

- Compose and sanitized templates;
- application configuration and databases;
- credentials in a separate secure system;
- personal photos and documents;
- project repositories.

Downloaded media may have a lower backup priority if it can be reacquired, but that choice must be explicit.

## Recovery acceptance

A recovery design is credible only after it demonstrates:

- a configuration backup stored outside the server;
- restoration of at least one representative service;
- documented secret restoration without committing secrets;
- persistent mounts and services surviving reboot;
- a defined recovery point and retention policy;
- a rollback procedure for migration.

