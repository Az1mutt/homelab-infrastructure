# Roadmap

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


## Now

- Finish one fresh real ARR torrent import after the shared `/data` hardlink fix.
- Verify successful import and matching inode/link count while qBittorrent keeps seeding.
- If that passes, issue the media-workstream completion handoff to infrastructure.
- Keep the old rollback disk read-only until infrastructure performs formal migration closure.

## Current checkpoint

The desktop media stack is effectively at final acceptance:

- Plex works on the reclaimed desktop server and TV clients.
- Radarr and Sonarr use TRaSH/Recyclarr-managed profiles.
- Usenet-first automation and failed-release fallback are verified.
- Kometa 2.4.8 is revalidated.
- `Newly Released` is visibly working on Plex Home/Recommended.
- Tautulli is healthy after re-authorization.
- Netdata monitoring is deployed.
- SAB API/NZB credentials were rotated.
- nzb360 local integrations are configured; paid unlocks are deferred.
- The old rollback disk remains attached read-only.
- The ARR hardlink topology has been corrected with a shared `/data` mount and qBittorrent Remote Path Mapping; an in-container hardlink test passed, but one fresh real ARR import still remains for end-to-end acceptance.

## Current gate

Finish the real torrent import/hardlink check, then close the media acceptance phase.

## Next: infrastructure closure

- Decide the final disposition of the old rollback disk.
- Replace/remove the temporary migration-version override.
- Finalize permanent container image pin/update policy.
- Remove the obsolete Compose `version` field if still present.
- Harden backup/restore and retention.
- Refresh public-safe documentation/config examples as needed.

## Near-term media work after closure

### 1. Bazarr / subtitle automation

This is the next application priority after migration closure.

Subtitle policy:

- English subtitles remain the primary/default preference.
- In many releases English subtitles will already be embedded or present; Bazarr should avoid creating unnecessary duplicates.
- Bazarr should additionally search for high-quality Czech and Slovak subtitles when available.
- Czech should be preferred over Slovak when both are viable, mainly because a good release/version match is expected to be available more often.
- CZ/SK subtitles should match the exact release/version as closely as possible so timing and cuts line up without manual repair.
- CZ/SK subtitles are optional alternate tracks, not replacements for English; the user can switch to Czech or Slovak manually in Plex when wanted.
- Reduce the current need to manually find and pair CZ/SK subtitles, while retaining manual override for difficult releases.
- Define sensible movie/TV language and scoring rules, with provider priorities tuned for CZ/SK subtitle quality and release matching.

### 2. Persistent watched-library / personal cinema shelf

Design a Plex-visible permanent collection of titles already watched, even when the media file is no longer stored locally.

The goal is not only watch history: it should work as a visual personal film/TV bookshelf where browsing old posters can trigger memories and rediscovery.

Design principles:

- watched history survives deletion of local media;
- local availability and watched-history are separate states;
- the watched shelf should remain visually browsable inside Plex;
- test the cleanest native Plex/List approach first;
- if the TV-client experience is insufficient, evaluate a dedicated archive/placeholder-library approach;
- later connect this layer to the planned media database / ČSFD enrichment and recommendation agents.

### 3. Trakt / PlexTraktSync

- synchronize watched state and ratings outside Plex;
- provide a durable history source independent of individual media files;
- evaluate whether Trakt should become one of the canonical inputs for the future Media Brain.

### 4. Seerr

- add a clean request/discovery interface for movies and TV;
- integrate requests with Radarr/Sonarr while preserving current quality and acquisition policy.

### 5. Kometa v2 iteration

- tune Home/Recommended based on real TV usage;
- add Trending/Popular, Director Spotlight and seasonal rows only where they improve the UI;
- avoid turning Plex Home into a wall of automated collections.

### 6. Mobile / remote access

- revisit nzb360 premium only if the mobile cockpit proves useful;
- later add controlled remote administration via VPN/Tailscale/WireGuard rather than exposing admin ports.

### 7. Media agents

Only after the base media platform is stable:

- Observer: watches library/acquisition/quality/subtitle state and surfaces issues;
- Curator: maintains collections, watched shelf, metadata/enrichment and recommendations;
- Media Operator: performs approved downloads, upgrades, cleanups and routine actions;
- destructive actions remain confirmation-gated until the policy is mature.

## Post-closure performance optimization

A real Netdata investigation confirmed SAB/Plex contention on the 18 TB media disk.

Preferred direction:

- move SAB incomplete/complete repair/unpack scratch workload to separate storage;
- SSD is currently the likely target;
- exact device, capacity and filesystem are still open;
- repeat Plex + SAB load testing after the change.

This optimization should not hold migration closure hostage.

## Open decisions

- final disposition of the rollback disk;
- permanent container update/pin policy;
- future SAB scratch storage device/layout;
- backup tooling, retention and restore-test cadence;
- exact Plex implementation for the persistent watched-library shelf;
- role split between Plex watched state, Trakt and the future media/ČSFD database;
- whether/when nzb360 is worth paying for.
