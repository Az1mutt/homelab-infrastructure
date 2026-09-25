# Current State

## Media checkpoint — 2026-09-25

This checkpoint supersedes older media migration-gate and Bazarr status below. It does not re-verify unrelated infrastructure. Migration remains formally closed; a fresh torrent hardlink check is non-blocking.

### Seerr acceptance — 2026-09-25

- **Verified:** Seerr 3.4.1 is healthy in its own Compose project, attached to the existing `docker_default` media network. Port 5055 binds only the host LAN address; no public proxy or router rule was added. Plex owner authentication initialized successfully.
- **Verified:** Plex Movies and TV Shows libraries are enabled and scanned. Seerr distinguishes The Sinner season 2 as available and season 1 as missing. Radarr and Sonarr connection tests returned the intended existing profiles and roots.
- **Verified:** Request #1 for The Sinner (2017), season 1 only (TMDb 39852 / TVDB 326866), was approved in Seerr and reached existing Sonarr series #25. Profile 7 `WEB-2160p (Alternative)`, root `/tv`, path `/tv/The Sinner`. Season 1 became monitored; season 2 stayed monitored and seasons 3–4 stayed unmonitored.
- **Verified:** The pilot initially disabled immediate search. The user then explicitly requested searching; Sonarr SeasonSearch #92180 completed with 8 reports sent to SABnzbd through NZBgeek. This verifies request handoff and acquisition start, not completed download/import or playback.
- **Verified:** Radarr profile 9 `UHD Bluray + WEB` and root `/movies` configured; no unnecessary movie request created. Before/after API comparisons show identical ARR quality profiles, indexers, download clients and remote path mappings. Usenet automatic/RSS and torrent interactive-only policy remain unchanged.
- **Configuration:** Future approved requests use automatic search through ARR; no separate duplicate 4K services or conflicting quality rules. New Plex account auto-enrollment is disabled; the existing owner can sign in. Default request permissions remain approval-based.
- **Verified follow-up:** The user confirmed the real Seerr flow completed successfully on the client through Plex, closing the previously open owner-login and The Sinner download/import follow-up.
- **Still outside this acceptance:** Router reachability from outside the LAN was not independently probed; no public exposure was added or required. Movie request creation remains component-tested rather than exercised with a second real download.
- **Stop point:** Seerr is accepted end-to-end for the intended human request flow. Bazarr English-default/match-reliability and fresh torrent hardlink checks remain non-blocking follow-up. The next media work is the watched/history architecture and persistent Plex-visible My Cinema shelf.

Deployment, backups and rollback: [Seerr](seerr.md).

### Bazarr pilot evidence (prior verified checkpoint; unchanged during Seerr setup)

- **Verified:** Bazarr 1.6.1 is running and healthy. OpenSubtitles.com is configured and reports Good; login/search/download succeeded after the user confirmed the account email. No credentials are stored in Git.
- **Verified:** Only one movie at a time received the EN/CZ/SK pilot profile. Embedded English counted as present. Dune (2021) returned CZ/SK candidates at 73% without source/release-group matches; none was downloaded.
- **Verified:** Exactly one Czech subtitle was downloaded for The Game (1997): `The Game (1997) Bluray-1080p.cs.srt`, provider subtitle ID `374530`. Bazarr history records 90.56% (163/180; search UI rounded to 90%). Local video: `The.Game.1997.1080p.BluRay.DTS.x264.1-CtrlHD-Obfuscated`, 24000/1001 FPS, 7728.320 seconds. Subtitle release: `The Game 1997 1080p BluRay VC-1 DTS-HD MA 5.1-BX`.
- **Match limitation:** Title/year, nominal edition, source and resolution matched; release group, hash and audio/video codecs did not. The initial subtitle did not synchronize correctly, confirmed by the user. A high score did not prove an exact cut/runtime match.
- **Verified correction:** Against the embedded English SRT, three separated sections yielded offsets +14.68, +14.72 and +14.72 seconds, all at scale 1.000. Applied a uniform +14.72-second shift only to the newly downloaded Czech file, retaining all 1,196 cues and identical subtitle text. Original subtitle retained privately under `/data/docker/bazarr/config/pilot-validation/`. User confirmed the corrected external Czech track now synchronizes. The user also reported that another subtitle found directly through Plex had synchronized without correction.
- **Verified Plex visibility:** Refreshed only The Game. Plex lists the external Czech SRT alongside the unchanged embedded English SRT. The user confirmed external-track playback.
- **Verified account configuration:** Automatic track selection is enabled, preferred subtitle language is English, and subtitle mode is Always enabled. **Still pending:** explicit client confirmation of automatic English selection on an item without a remembered manual override. The Game currently retains the manually selected Czech track; that does not establish a default-selection defect.
- **Policy boundary:** Czech was selected ahead of the lower-scoring Slovak candidates. No equally good CZ/SK tie-break was tested, and no Slovak subtitle was downloaded. Unattended exact-match/timing reliability is not accepted based on this manually corrected sample.
- **Safe final state:** 34 movie files and 44 series synchronized; zero assigned language profiles; library default assignment and subtitle upgrades remain disabled. Exactly one movie subtitle-download record and zero episode-download records. Minimum scores remain 90% for movies and TV. Bazarr was not redeployed.

### ARR / next gate

Sonarr still reports root `/tv` and mapping `/download/` → `/data/torrents/`; Radarr reports root `/movies` and mapping `/downloads/` → `/data/torrents/`. These were inspected without changes. No old video/torrent was moved, reimported or modified to force a hardlink test. Previously inspected Tokyo Vice S02E10 source/library files had different inodes and links=1; a fresh post-fix workflow remains unverified.

**Acceptance:** Remaining Bazarr English-default and unattended-match checks are explicitly non-blocking by user decision. Broad automation stays paused. Seerr acceptance is recorded above.


## Historical migration snapshot (superseded by checkpoint above)

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
