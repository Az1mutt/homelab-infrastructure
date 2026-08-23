# Migration Plan

## Objective

Move the verified Docker media stack from the Lenovo laptop to the dedicated desktop without losing configuration, corrupting storage, or treating an untested target as production-ready.

The source laptop is now a **known-good frozen baseline** with verified backups and successful real-world acquisition tests.

## Guardrails

- Keep the laptop state intact until the target passes acceptance criteria.
- Begin storage work with read-only discovery.
- Do not format a disk until its identity and intended role are confirmed.
- Never depend on `/dev/sdX` names for persistent mounts.
- Preserve the existing `/data/...` logical path convention where practical to reduce application changes.
- Restore first, improve later: do not combine migration with upgrades or config refactors.
- Treat the full Docker-stack archive as private because it contains credentials.

## Source freeze completed

Before migration, the following were verified:

- Radarr real Usenet movie workflow through Plex.
- Sonarr real Usenet TV workflow through Plex.
- NZBGeek synchronization through Prowlarr.
- SABnzbd and Eweka download path.
- Plex Movies and TV libraries plus automatic partial scanning.
- Kometa manual execution with current director collections and `use_separator: false`.
- Fresh native backups for Radarr, Sonarr, and Prowlarr.
- Full stopped-stack archive at `/data/arr_backup/docker-stack-pre-migration-2026-08-23.tar.gz`.
- Archive integrity checked with `tar -tzf`.
- All persistent services restarted successfully after backup.

## Phase 1 — Move and identify storage

1. Stop the laptop Compose stack.
2. Power the laptop off cleanly.
3. Move the existing external HDD to the desktop.
4. On the desktop, begin with read-only inventory such as `lsblk` and `findmnt`.
5. Positively identify:
   - the system disk,
   - the Toshiba 18 TB disk,
   - the migrated external HDD.
6. Do not format, repartition, or recursively change permissions until identity is certain.

## Phase 2 — Finish target storage preparation

1. Confirm the 18 TB SMART self-test result.
2. Decide the final filesystem and role of the 18 TB disk.
3. Create persistent UUID-based mounts only after explicit confirmation.
4. Verify mounts across reboot.
5. Establish the permissions/UID/GID policy.
6. Verify the old external source disk is readable and contains:

```text
/data/docker
/data/media
/data/torrents
/data/usenet
/data/arr_backup
```

Confirm the private recovery archive exists before service restoration.

## Phase 3 — Runtime foundation

1. Install or verify Docker Engine and the Docker Compose plugin.
2. Restore/copy the known-good `/data/docker` state without changing application versions if avoidable.
3. Validate Compose before startup:

```bash
docker compose config -q
```

4. Do not refactor secrets into `.env` during the migration itself.
5. Do not remove the obsolete Compose `version` attribute during the migration itself.

Those are post-migration cleanup tasks.

## Phase 4 — Restore services in layers

Recommended order:

1. **Storage visibility** — verify expected files and directories.
2. **Plex** — verify Movies, TV, and representative playback.
3. **qBittorrent and SABnzbd** — verify paths and connectivity.
4. **Prowlarr** — verify indexers and ARR application connections.
5. **Radarr and Sonarr** — verify databases, root folders, download clients, profiles, and existing media.
6. **Kometa** — run manually and verify collections.

Avoid starting every service at once if a staged restore makes path or permission problems easier to isolate.

## Phase 5 — Acceptance tests

### Plex

- Movies visible.
- TV Shows visible.
- Representative playback succeeds.
- New imports appear automatically.

### Usenet

Run one small real test and verify:

```text
ARR
→ Prowlarr / NZBGeek
→ SABnzbd
→ Eweka
→ import
→ Plex
```

### Torrent fallback

Run one small representative torrent test if appropriate and verify import.

### Kometa

Run:

```bash
cd /data/docker
docker compose run --rm kometa --run
```

Verify `Newly Released` and the dynamic director collections appear without the removed separator.

### Reboot

Reboot the desktop and verify:

- storage mounts persist,
- SSH returns,
- required containers recover,
- applications still see their data.

## Phase 6 — Stabilization

Keep the reproduced configuration stable for a short observation period before introducing enhancements.

During stabilization, do not:

- upgrade Radarr, Sonarr, or Prowlarr;
- redesign quality profiles;
- add new indexers without troubleshooting need;
- add monitoring, agents, Watchtower, or VPN routing;
- redesign Kometa;
- refactor Compose/secrets.

## Post-migration cleanup

Only after the desktop is stable:

- remove the obsolete Compose `version` field;
- extract appropriate secrets into local `.env`;
- add a safe `.env.example` with placeholders;
- verify `.env` is ignored by Git;
- sanitize and document Compose publicly;
- decide update policy;
- verify or implement Kometa scheduling;
- add Director Spotlight and other collection automation;
- add monitoring/dashboarding and future agents.

## Completion criteria

Migration is complete only when:

- the desktop boots without local intervention;
- SSH is available;
- persistent mounts survive reboot;
- the known media files are visible;
- Docker Compose starts required services;
- Radarr and Sonarr retain their configuration;
- both Usenet and torrent acquisition/import paths work;
- Plex serves Movies and TV and representative playback succeeds;
- Kometa manual execution is repeatable;
- the private recovery point is preserved;
- rollback is documented and the laptop is no longer needed for normal operation.
