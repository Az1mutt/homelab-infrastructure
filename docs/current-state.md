# Current State

**Snapshot date:** 2026-08-03  
**Project phase:** hardware preparation and migration planning

This document is the concise source of truth for what exists, what has only been tested in isolation, and what remains planned.

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
| Plex | Verified | Running; Samsung TV playback works |
| Radarr | Verified | Running; configuration restored from backup |
| Sonarr | Verified | Running; recovered from a malformed database using backup |
| Prowlarr | Verified | Running; current torrent indexer synchronization works |
| qBittorrent | Verified | Running; active acquisition path |
| Kometa | Verified manually | Manual runs connected to Plex and TMDb and created collections |
| Kometa scheduling | Unknown | Persistent scheduled execution has not been demonstrated |
| SABnzbd | Component-tested | Running; Eweka, Radarr, and Sonarr connection tests passed |
| End-to-end Usenet | Blocked | No working NZB indexer is connected |

## Target desktop platform

| Item | Status | Current knowledge |
|---|---|---|
| Chassis | Needs verification | Older desktop tower; exact model and secure 3.5-inch capacity unknown |
| Motherboard | Partially verified | ASUS, Intel LGA1155 platform; exact model unknown |
| CPU | Partially verified | Intel Core i5; exact model unknown |
| RAM / GPU | Unknown | Requires inventory after boot |
| PSU | Verified visually | EVOLVE 500ATX, labelled 500 W; long-term suitability uncertain |
| System disk | Needs verification | Approximately 1 TB HDD; only about 100 GB was previously visible |
| Data disk | Acquired | Toshiba MG09ACA18TE 18 TB; local acceptance testing pending |
| Operating system | Planned | Ubuntu Server 24.04 LTS, headless |
| Network | Blocked / planned | PCIe Wi-Fi initially; Ethernet preferred later |
| Docker and services | Planned | Nothing is verified as deployed on the desktop |

## Confirmed media behavior

- The torrent workflow is operational through Prowlarr, qBittorrent, Radarr/Sonarr, the media directories, and Plex.
- Usenet components are configured through Eweka and SABnzbd, but a real search-to-import workflow has not been completed.
- qBittorrent remains the intended fallback, especially for Czech and Slovak releases.
- Plex Direct Play resolved observed stuttering for some 4K WEB-DL playback on a Samsung S90F client; the original root cause was not diagnosed.
- Kometa created `Newly Released` and five dynamic director collections during verified manual runs.

## Known open issues

- NZBGeek access returned `Trial Account Only`; account access or an alternative NZB indexer is required.
- Kometa still creates an unwanted director separator; `use_separator: false` is planned but not verified as applied.
- A rotating `Director Spotlight` is planned but not implemented.
- Kometa's persistent schedule is unverified.
- The existing system HDD capacity, partitions, filesystem, and health are unknown.
- The 18 TB disk has seller-supplied SMART evidence but no local acceptance result.
- Both disks still require verified secure mounting.
- Wi-Fi hardware, exact SATA inventory, and chassis disk capacity remain unresolved.
- Automated off-host backup and full disaster recovery are not implemented.

## Evidence boundary

This snapshot consolidates three technical handoffs and subsequent user confirmations. Where those sources conflicted, the later confirmed state was used. Unknowns remain explicit rather than being filled from assumptions.

