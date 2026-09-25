# Current State

## Media checkpoint — 2026-09-25

This checkpoint supersedes older media migration-gate and Bazarr status below; it does not re-verify unrelated infrastructure. Migration is formally closed according to the owned workstream. A fresh torrent hardlink check remains non-blocking.

- **Verified:** Bazarr 1.6.1 (LinuxServer v1.6.1-ls365) deployed as a separate Compose project, UID/GID 1000, Europe/Bratislava, image pinned by digest. Container health passed; authenticated UI bound only to the host LAN address, port 6767.
- **Verified:** Sonarr 4.0.17.2952 and Radarr 6.1.1.10360 connections; 44 series and 34 movie files synchronized at checkpoint.
- **Component-tested:** EN + CZ + SK pilot profile, embedded subtitles accepted, 90% minimum scores for TV and movies, original release names and hashing enabled. Dune (2021) recognized two embedded English tracks and requested only CZ/SK. Four available The Boys episodes recognized embedded EN/CZ and requested only SK.
- **Safe pause:** Zero assigned movie/series profiles, default auto-assignment disabled, subtitle upgrades disabled, zero download-history records. Provider was not yet configured at the final read. User created an OpenSubtitles.com account; credentials must be entered privately in Bazarr. Titulky.com is deferred.
- **Unknown:** Provider login/search/download success, release/timing quality, Czech preference behavior, Plex track visibility and English default playback. No full subtitle acceptance claimed. Seerr not started.
- **Live drift:** Sonarr still reports root `/tv` and mapping `/download/` → `/data/torrents/`; Radarr reports `/movies` and `/downloads/` → `/data/torrents/`. Shared mounts alone do not prove actual imports hardlink. Latest Sonarr torrent import (2026-09-13, Tokyo Vice S02E10) has different source/library inodes, each links=1; relation to the prior fix timing is unverified. No old files were reimported or altered.
- **Next:** Finish OpenSubtitles configuration, temporarily assign only the pilot sample, inspect release/FPS/cut matches, test one suitable CZ/SK subtitle, verify in Plex, then remove pilot assignments if acceptance remains incomplete. Do not enable bulk downloads. Seerr follows Bazarr acceptance.

Live files: `/data/docker/bazarr/docker-compose.yml`, `/data/docker/bazarr/config/`; existing media Compose files were not edited. Pre-deployment backups and a consistent checkpoint database/config backup are under `/data/docker/arr_backup/`. Credentials remain outside Git.


**Snapshot date:** 2026-09-08  
**Project phase:** migration acceptance / closure preparation

This document is the concise source of truth for what exists, what has been verified, and what remains planned.

## Desktop platform

| Item | Status | Current knowledge |
|---|---|---|
| Host | Verified | Dedicated Ubuntu Server desktop |
| Data disk | Verified | Toshiba MG09 18 TB, ext4, mounted at `/data` |
| Media stack | Verified running | Plex, Radarr, Sonarr, Prowlarr, qBittorrent, SABnzbd |
| Kometa | Verified | 2.4.8; Home/Recommended `Newly Released` is visibly working |
| Recyclarr | Verified | Separate Compose project managing Radarr and Sonarr TRaSH configuration |
| Tautulli | Verified | Re-authorized and healthy |
| Netdata | Verified | Local diagnostics dashboard deployed |
| nzb360 | Configured / deferred | Local service connections configured; paid unlock/subscription deferred |

## Migration acceptance

Verified:

- desktop cutover and data migration;
- recovery archive checksum match;
- all persistent services running;
- real Radarr post-migration download/import;
- Sonarr end-to-end Usenet acquisition/import;
- real Usenet failure blocklisting and automatic fallback behavior;
- Plex reclaim after credential invalidation;
- TV clients working again after Plex reclaim;
- Kometa Plex/TMDb connectivity;
- Kometa `Newly Released` visible on Home/Recommended;
- Tautulli re-authorization;
- SAB API/NZB credential rotation after accidental disclosure;
- historical ext4 hardlink recovery for migrated torrent/media duplicates.

One final live acceptance check remains:

- a real torrent has been grabbed and is still downloading;
- after completion, verify import and real hardlink behavior while qBittorrent retains the file for seeding.

## Current gate

Complete the in-progress torrent acceptance check. If import and hardlink behavior pass, the media workstream is ready to hand back to infrastructure for formal migration closure.

## Storage / performance finding

Netdata confirmed that heavy SAB download/repair/unpack activity can saturate the 18 TB media disk and drive very high CPU iowait, degrading both Plex playback and SAB throughput.

This is a real issue, but it is no longer treated as a migration blocker. The preferred direction is a future dedicated SAB scratch area, likely on SSD. Exact device, size and filesystem remain undecided.

## Recovery state

The old external source/rollback disk is confirmed still attached read-only.

Its final disposition is intentionally deferred to formal migration closure, where it can be deliberately unmounted, archived, repurposed or wiped.

## Acquisition policy

- Usenet is automatic/default.
- Torrents remain manual/Interactive Search fallback.
- CZ/SK torrent sources remain manual.
- Failed Usenet releases are blocklisted and another candidate can be attempted automatically.

## TRaSH / Recyclarr

Radarr:
```text
UHD Bluray + WEB
```

Sonarr:
```text
WEB-2160p (Alternative)
```

The shared philosophy remains sensible 2160p, 1080p fallback, no mass upgrades, and manual exceptions for very large remuxes or special cases.

## Kometa direction

Kometa v2 will be iterative rather than fixed in advance. `Newly Released` is already visible; future Home/Recommended additions such as Trending/Popular, Director Spotlight or seasonal rows will be judged by how the actual TV experience looks.

## Remaining open issues

- Finish the current torrent download and verify import + hardlink behavior.
- Hand media acceptance back to infrastructure.
- Decide what to do with the old rollback disk.
- Replace/remove the temporary migration-version override during infrastructure closure.
- Harden backup/restore procedures and retention.
- Later: dedicated SAB scratch storage, likely SSD, followed by repeat Netdata/Tautulli load testing.
- Revisit nzb360 paid unlocks only if worth it in practice.
- Later media backlog: Kometa iteration, Bazarr, Trakt/PlexTraktSync, Seerr, controlled remote access, media agents.

## Evidence boundary

The remaining torrent hardlink check is **not yet verified** because the live download is still incomplete. Future SAB scratch-storage design is also undecided and should not be represented as implemented.
