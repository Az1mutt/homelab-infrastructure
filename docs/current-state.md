# Current State

**Snapshot date:** 2026-09-01  
**Project phase:** desktop cutover complete; application validation and migration closure in progress

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
| System disk | Verified | Existing ~1 TB WDC disk hosts the OS |
| Data disk | Verified | Toshiba MG09 18 TB disk |
| Data filesystem | Verified | ext4 |
| Persistent mount | Verified | `/data` |
| Docker Engine | Verified | 29.7.2 |
| Docker Compose | Verified | v5.5.0 |
| Media stack | Verified running | Plex, Radarr, Sonarr, Prowlarr, qBittorrent, SABnzbd |
| Kometa | Verified historically / pending post-cutover recheck | Manual one-shot workflow remains the intended execution model |
| Recyclarr | Verified | Separate Compose project managing Radarr TRaSH configuration |

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

The source external disk remains attached read-only during the rollback window.

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
- a real Radarr post-migration download/import completed successfully.

## Application-version safety

A temporary migration override pins the last known-good application versions used during cutover.

This is intentional: a normal pull showed newer releases than the notebook had been running, so migration and application upgrades were kept separate.

The temporary override remains until migration closure.

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

## Acquisition policy

Current intended behavior:

- Usenet is the automatic/default path.
- Torrent indexers are manual/Interactive Search fallback.
- CZ/SK torrent sources are also manual unless a future real use case justifies automation.

## TRaSH / Recyclarr

Radarr now uses one main TRaSH-backed profile:

```text
UHD Bluray + WEB
```

The intended hierarchy is:

```text
Bluray-2160p
WEB 2160p
Bluray-1080p
WEB 1080p
```

Existing movies were bulk-assigned to this profile without running mass searches/upgrades.

Sonarr is intended to follow the same philosophy using Sonarr-specific TRaSH definitions.

## Recovery state

The old source disk remains the physical rollback source.

A private consistent application-state archive remains available under `/data/arr_backup`.

The private migration session log is not repository material.

## Remaining open issues

- Complete application-level validation in the media workstream.
- Confirm new ARR torrent imports create hardlinks automatically on ext4.
- Revalidate Kometa on the desktop.
- Decide when the old source disk can be retired.
- Choose permanent container image pin/update policy.
- Remove or replace the temporary migration override.
- Remove the obsolete Compose `version` attribute after closure.
- Extract appropriate secrets into local environment/config files without exposing them publicly.
- Implement mature automated backup/retention and restore drills.
- Add monitoring/dashboarding only after migration closure.

## Evidence boundary

This snapshot reflects the verified state after desktop cutover and initial application validation. It does not claim that final migration closure, automated off-host backup, monitoring, remote access, or future storage expansion are complete.
