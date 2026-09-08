# Current State

**Snapshot date:** 2026-09-08  
**Project phase:** post-migration media stabilization; storage-I/O tuning before formal closure

This document is the concise source of truth for what exists, what has been verified, and what remains planned.

## Status vocabulary

| Status | Meaning |
|---|---|
| Verified | Supported by user confirmation or captured evidence |
| Component-tested | A direct integration test passed; the full workflow did not |
| Planned | Chosen or intended, but not deployed |
| Blocked | A required prerequisite is unavailable |
| Unknown | Evidence is insufficient |
| Historical | Past event, not necessarily current configuration |

## Desktop platform

| Item | Status | Current knowledge |
|---|---|---|
| Host | Verified | Dedicated Ubuntu Server desktop |
| Operating system | Verified | Clean Ubuntu Server installation |
| SSH | Verified | Remote administration works |
| Network | Verified | Wi-Fi stable; Ethernet remains preferred long-term |
| System disk | Verified / capacity pending | Existing ~1 TB WDC disk hosts the OS; fresh LVM free-space inspection is pending |
| Data disk | Verified | Toshiba MG09 18 TB disk |
| Data filesystem | Verified | ext4 |
| Persistent mount | Verified | `/data` |
| Docker Engine | Verified | 29.7.2 |
| Docker Compose | Verified | v5.5.0 |
| Media stack | Verified running | Plex, Radarr, Sonarr, Prowlarr, qBittorrent, SABnzbd |
| Kometa | Verified | 2.4.8 manual one-shot workflow revalidated after Plex reclaim/token rotation |
| Recyclarr | Verified | Separate Compose project managing Radarr and Sonarr TRaSH configuration |
| Tautulli | Verified | Deployed and re-authorized against the reclaimed Plex server |
| Netdata | Verified | Local-only diagnostics dashboard deployed for CPU/iowait, disk, network, RAM and load |
| nzb360 | Configured / deferred | Local service connections configured; paid unlock/subscription deferred |

## Storage state

The 18 TB data disk is mounted persistently at:

```text
/data
```

Post-migration usage after hardlink cleanup was approximately:

```text
1.1T used
16T available
7% used
```

The old source external disk was retained read-only for rollback at the 2026-09-01 checkpoint. Its current attachment state has not been freshly re-verified in this workstream.

A new storage optimization is under evaluation: use free capacity on the separate ~1 TB system disk as a dedicated SABnzbd scratch volume for incomplete/complete download, repair and unpack activity, while final media remains on the 18 TB disk.

Fresh `lsblk` / `vgs` / `lvs` evidence is still required before changing LVM or filesystems.

## Migration validation

Verified:

- source disk mounted read-only before copying;
- private pre-migration Docker-stack archive readable;
- source and target recovery archive SHA-256 matched;
- media copy completed with exit code 0;
- media dry-run found no remaining changes;
- torrent copy completed with exit code 0;
- torrent dry-run found no remaining changes;
- Compose parsed successfully before first boot;
- all six persistent media services started successfully;
- all local HTTP smoke tests responded as expected;
- a real Radarr post-migration download/import completed successfully;
- Sonarr end-to-end Usenet acquisition/import works on the desktop;
- Kometa revalidation passed after Plex reclaim and credential rotation;
- Tautulli was re-authorized and is healthy.

Formal closure is still pending.

## Application-version safety

A temporary migration override pins the last known-good application versions used during cutover.

This remains intentional: host migration and application upgrades are still being kept separate until formal closure.

## Hardlink state

The previous NTFS layout contained duplicate media and torrent payloads rather than effective hardlinks.

After migration to ext4:

```text
26 duplicate sets
26 converted to hardlinks
0 skipped
0 failed
~711.6 GiB reclaimed
```

A representative pair was verified to share the same inode with link count 2.

A fresh post-migration torrent-import hardlink test has not been repeated. The earlier infrastructure gate expected one; the media workstream later deferred it as unnecessary for the current workflow. That closure criterion must be resolved explicitly.

## Acquisition policy

Current behavior:

- Usenet is the automatic/default path.
- Torrent indexers are manual/Interactive Search fallback.
- CZ/SK torrent sources are manual unless a future real use case justifies automation.
- Failed Usenet releases are blocklisted and Sonarr can automatically try another candidate.
- Real tests have shown both failed/missing-article releases and successful fallback to another release.

## TRaSH / Recyclarr

Radarr uses one main TRaSH-backed profile:

```text
UHD Bluray + WEB
```

The intended hierarchy remains:

```text
Bluray-2160p
WEB 2160p
Bluray-1080p
WEB 1080p
```

Existing movies were bulk-assigned without running mass searches/upgrades.

Sonarr now also uses a TRaSH/Recyclarr-managed profile:

```text
WEB-2160p (Alternative)
```

Its quality strategy prefers sensible 2160p, then 1080p, with 720p retained as a last-resort fallback. Automatic mass upgrade behavior remains intentionally avoided.

## Plex / Kometa / Tautulli

Plex was reclaimed after account-token invalidation and the affected integrations were re-authorized.

Verified:

- Kometa can connect to Plex and TMDb again;
- Tautulli can communicate with Plex again;
- Kometa director collections remain configured without the separator;
- Kometa phase-1 Home configuration for `Newly Released` has been applied.

Still pending:

- TV-side visual confirmation that `Newly Released` appears as intended on Plex Home and Movies > Recommended;
- later Kometa v2 rows such as Trending/Popular, Director Spotlight and seasonal spotlight.

## Performance diagnosis

A local Netdata dashboard was added during media stabilization.

Under heavy SABnzbd activity, captured evidence showed approximately:

- data-disk utilization: ~98%;
- CPU iowait: ~69%;
- SAB download throughput: ~30 MB/s despite the server otherwise being healthy.

Earlier captures also showed prolonged periods near full disk utilization and very high iowait during Plex stutter.

This strongly indicates that SAB download/repair/unpack activity sharing the 18 TB media disk with Plex is the current performance bottleneck.

The next storage test is to inspect the separate ~1 TB system disk and determine whether a dedicated SAB scratch LV/filesystem can be created safely.

## Recovery state

A private consistent application-state archive remains available under `/data/arr_backup`.

The private migration session log is not repository material.

The old source disk must not be retired until formal migration acceptance is closed.

## Security / credential recovery

During post-migration cleanup, Plex and TMDb credentials used by Kometa were rotated after accidental disclosure in chat. Plex was reclaimed, Kometa was updated with fresh credentials, and Tautulli was re-authorized.

The previously planned SAB API/NZB-key rotation is still unverified and remains an open loop.

## Remaining open issues

- Freshly inspect the ~1 TB system disk and LVM free space.
- If safe, create a dedicated SAB scratch volume on that separate physical disk.
- Move SAB incomplete and complete/repair/unpack work off the 18 TB media disk.
- Re-test Plex playback and SAB throughput under load using Netdata/Tautulli.
- Visually validate `Newly Released` on Plex Home/Recommended.
- Resolve whether a fresh torrent hardlink import test remains a formal closure requirement.
- Retire/unmount the old rollback source disk only after final acceptance.
- Choose permanent container image pin/update policy.
- Remove or replace the temporary migration override.
- Remove the obsolete Compose `version` attribute after closure.
- Extract appropriate secrets into local-only configuration and publish safe examples only.
- Implement mature automated backup/retention and restore drills.
- Continue later media-app work only after the current storage gate: Kometa v2, Bazarr, Trakt/PlexTraktSync, Seerr, controlled remote access, and media agents.
- Keep nzb360 paid unlock/subscription deferred unless it proves worth the cost.

## Evidence boundary

This snapshot includes verified media-side milestones through 2026-09-06 and Project OS synchronization on 2026-09-08.

It does **not** claim that the current free LVM capacity of the system disk, the present attachment state of the rollback disk, TV-client reauthentication, Kometa TV-side Home appearance, final migration closure, or the fresh torrent-hardlink closure test are verified.
