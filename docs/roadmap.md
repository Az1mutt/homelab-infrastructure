# Roadmap

## Infrastructure control plane — 2026-09-26

- **Component-tested:** repository-backed [read-only Movie Intelligence v0.1](../tools/movie-intelligence/README.md), including SQLite/Radarr adapters, stable identity handling and offline fixtures.
- **Next:** separately authorize deployment, verify the actual SQLite schema mapping and exercise Heretik/Scarface against live sources; record sanitized read-only acceptance evidence.
- **After live read acceptance:** a separate controlled Seerr request wrapper, with narrow policy and audit boundaries. No unrestricted ARR mutation, deployment or live changes are part of Issue #9 implementation.

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
- **Stop point:** Seerr is accepted end-to-end for the intended human request flow. Bazarr English-default/match-reliability and fresh torrent hardlink checks remain non-blocking follow-up. Next media focus: persistent watched/history architecture and My Cinema.

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

**Acceptance / sequencing update (2026-09-25):** Subtitle acquisition, Plex visibility and corrected Czech timing are verified on one film. Broader Bazarr automation remains intentionally paused because unattended exact-match reliability and the clean English-default client check are still open. The user explicitly chose to keep those as non-blocking follow-up and proceed to Seerr now. Do not enable library-wide Bazarr profiles, bulk subtitle downloads or upgrades while this remains open.


## Historical migration roadmap (superseded by checkpoint above)

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

### 2. Seerr

- **Verified:** deployed and accepted on 2026-09-25; see the current checkpoint above;
- use it as the human-friendly discovery/request layer over Radarr/Sonarr;
- preserve existing Radarr/Sonarr quality profiles and Usenet-first/manual-torrent acquisition policy rather than duplicating them in Seerr;
- keep the deployment/policy media-owned while the sibling Agent Control Plane may later consume the Seerr API as a controlled write gateway.

### 3. Persistent watched-library / personal cinema shelf — next active design

Design a Plex-visible permanent collection of titles already watched, even when the media file is no longer stored locally.

The goal is not only watch history: it should work as a visual personal film/TV bookshelf where browsing old posters can trigger memories and rediscovery.

Design principles:

- watched history survives deletion of local media;
- local availability and watched-history are separate states;
- the watched shelf should remain visually browsable inside Plex;
- test the cleanest native Plex/List approach first;
- if the TV-client experience is insufficient, evaluate a dedicated archive/placeholder-library approach;
- later connect this layer to the planned media database / ČSFD enrichment and recommendation agents.

### 4. Trakt / PlexTraktSync

- synchronize watched state and ratings outside Plex;
- provide a durable history source independent of individual media files;
- evaluate whether Trakt should become one of the canonical inputs for the future Media Brain.

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
