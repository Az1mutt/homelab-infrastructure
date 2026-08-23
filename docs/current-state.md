# Current State

**Snapshot date:** 2026-08-23  
**Project phase:** source-stack freeze and desktop migration preparation

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

## Current laptop platform

| Item | Status | Current knowledge |
|---|---|---|
| Host | Verified | Lenovo Legion Y720-15IKB notebook |
| Operating system | Verified / incomplete detail | Ubuntu; exact release not yet captured |
| Deployment | Verified | Docker Compose at `/data/docker/docker-compose.yml` |
| Plex | Verified | Running; Movies and TV libraries work |
| Radarr | Verified | Running; real Usenet movie import completed successfully |
| Sonarr | Verified | Running; real Usenet TV import completed successfully |
| Prowlarr | Verified | Running; NZBGeek and ARR synchronization work |
| qBittorrent | Verified | Running; torrent fallback remains available |
| Kometa | Verified manually | Manual run creates current collections and no director separator |
| Kometa scheduling | Unknown | Persistent scheduled execution has not been demonstrated |
| SABnzbd | Verified | Running; real movie and TV downloads completed through Eweka |
| End-to-end Usenet | Verified | Radarr and Sonarr workflows both completed through Plex |
| Pre-migration backup | Verified | Fresh ARR backups plus full private Docker-stack archive |

The laptop stack is now treated as a **known-good pre-migration source**. Feature changes and application upgrades should be avoided until the desktop migration is stable.

## Target desktop platform

| Item | Status | Current knowledge |
|---|---|---|
| Host | Verified | Dedicated desktop with hostname `homelab` |
| Operating system | Verified | Clean Ubuntu Server installation is running |
| SSH | Verified | Remote administration works |
| Network | Verified | Wi-Fi works and survives reboot; Ethernet remains preferred long-term |
| System disk | Verified at high level | Existing approximately 1 TB WDC disk hosts the OS |
| Data disk | Verified attached | Toshiba MG09 18 TB disk is installed |
| 18 TB acceptance | In progress | Long SMART self-test was started; storage preparation waits for completion |
| Docker/media stack | Planned on target | Not yet restored to the desktop |
| Final mounts/filesystem | Planned | To be decided and verified during migration |

## Confirmed media behavior

- Torrent acquisition remains operational as fallback.
- NZBGeek is active through Prowlarr.
- Eweka and SABnzbd are fully integrated with both Radarr and Sonarr.
- A real movie completed Radarr → NZBGeek/Prowlarr → SABnzbd → Eweka → import → Plex.
- A real TV episode completed Sonarr → NZBGeek/Prowlarr → SABnzbd → Eweka → import → Plex.
- Plex automatically detects new library changes when storage is available.
- Plex `Empty trash automatically after every scan` is disabled for migration safety.
- Kometa creates `Newly Released` plus five dynamic director collections and no longer creates the unwanted director separator.

## Recovery state

Fresh native backups were created for Radarr, Sonarr, and Prowlarr.

A consistent full application-state archive was created while the stack was stopped:

```text
/data/arr_backup/docker-stack-pre-migration-2026-08-23.tar.gz
```

The archive was read-verified and contains the complete private `/data/docker` tree. It must not be published because it includes service configuration and credentials.

## Known open issues

- The target desktop still needs final storage layout, filesystem, persistent mounts, and permissions.
- The 18 TB disk acceptance test must complete before destructive storage preparation.
- Docker and the media stack have not yet been restored on the desktop.
- Kometa persistent scheduling remains unverified.
- A rotating `Director Spotlight` remains planned but not implemented.
- The current Compose file still contains an obsolete `version` attribute; cleanup is deferred until after migration.
- The live stack does not yet use `.env`; secret extraction and public-safe Compose cleanup are deferred until post-migration stabilization.
- Automated off-host backup and full disaster recovery remain future work.

## Evidence boundary

This snapshot reflects the verified state immediately before physical migration of the existing external HDD to the desktop. Older notes describing NZBGeek or end-to-end Usenet as blocked are obsolete.
