# Media Stack

## Service inventory

| Service | Status | Purpose | Exposure |
|---|---|---|---|
| Plex | Verified | Media server and playback | Host network, port 32400 |
| Radarr | Verified | Movie management and import | 7878 |
| Sonarr | Verified | TV management and import | 8989 |
| Prowlarr | Verified | Indexer management and ARR synchronization | 9696 |
| qBittorrent | Verified | Torrent downloader and fallback | 8080; peer 6881 TCP/UDP |
| Kometa | Verified manually | Plex metadata and collection automation | No Web UI |
| SABnzbd | Verified | Usenet downloader | Host 8081 to container 8080 |
| Eweka | Verified | Usenet provider | External SSL service |
| NZBGeek | Verified | NZB indexer synchronized through Prowlarr | External service |

The laptop deployment is now treated as a **known-good pre-migration source**. Application and container upgrades are intentionally deferred until after desktop migration.

## Logical directory layout

```text
/data
├── docker
│   ├── plex
│   ├── radarr
│   ├── sonarr
│   ├── prowlarr
│   ├── qbittorrent
│   ├── kometa
│   └── sabnzbd
├── media
│   ├── movies
│   └── tv
├── torrents
│   ├── movies
│   ├── tv
│   └── incomplete
├── usenet
│   ├── incomplete
│   └── complete
│       ├── movies
│       └── tv
└── arr_backup
```

## Important volume mappings

| Service | Host path | Container path |
|---|---|---|
| Plex | `/data/media/movies` | `/movies` |
| Plex | `/data/media/tv` | `/tv` |
| Radarr | `/data/media/movies` | `/movies` |
| Radarr | `/data/torrents` | `/downloads` |
| Radarr | `/data/usenet` | `/data/usenet` |
| Sonarr | `/data/media/tv` | `/tv` |
| Sonarr | `/data/torrents` | `/downloads` |
| Sonarr | `/data/usenet` | `/data/usenet` |
| qBittorrent | `/data/torrents` | `/downloads` |
| SABnzbd | `/data/usenet` | `/data/usenet` |

Each application also maps `/data/docker/<service>` to `/config`.

## Acquisition paths

### Torrent fallback

```text
Radarr / Sonarr
→ Prowlarr and torrent indexers
→ qBittorrent
→ /data/torrents
→ ARR import
→ /data/media
→ Plex
```

Torrents remain the intended fallback, especially for Czech and Slovak releases.

### Usenet — end-to-end verified

The complete Usenet workflow is now verified for both movies and TV:

```text
Radarr / Sonarr
→ Prowlarr / NZBGeek
→ SABnzbd
→ Eweka
→ /data/usenet/complete/<category>
→ ARR import
→ /data/media
→ Plex
```

Verified details:

- Eweka connection succeeds over SSL on port 563.
- SABnzbd uses `/data/usenet/incomplete` and `/data/usenet/complete`.
- Categories `movies` and `tv` map to their respective completed subdirectories.
- Radarr and Sonarr reach SABnzbd at `sabnzbd:8080`.
- Adding the Docker hostname `sabnzbd` to SABnzbd's host whitelist resolved an earlier internal `403 Forbidden` response.
- NZBGeek is active in Prowlarr and synchronized to both Radarr and Sonarr.
- A real movie completed the full Radarr → Usenet → import → Plex path.
- A real TV episode completed the full Sonarr → Usenet → import → Plex path.

One operational lesson was captured during the movie test: avoid manually triggering `Refresh & Scan` while a large ARR import is still copying. Doing so created a duplicate database record for one physical movie file. The false record was removed while Radarr was stopped, the valid imported record was preserved, and a fresh Radarr backup was created afterward.

## Plex

Libraries are configured as:

```text
Movies   -> /movies
TV Shows -> /tv
```

Verified library settings:

- `Scan my library automatically` enabled.
- `Run a partial scan when changes are detected` enabled.
- `Empty trash automatically after every scan` disabled before migration to reduce risk if storage is temporarily unavailable.

A Sonarr-imported episode appeared in Plex successfully after the TV library was added.

For some 4K WEB-DL playback on a Samsung S90F client, forcing Direct Play previously removed visible stuttering. The root cause was not fully diagnosed.

## Kometa

Kometa is currently run manually as a one-off Compose job:

```bash
cd /data/docker
docker compose run --rm kometa --run
```

Verified behavior:

- Connects to TMDb.
- Connects to Plex using a LAN endpoint represented publicly as `<HOST_LAN_IP>`.
- Creates `Newly Released`.
- Creates five dynamic director collections.
- Director collection configuration uses `depth: 10` and `limit: 5`.
- `use_separator: false` was applied and verified; the unwanted `Director Collections` separator is no longer present.

Persistent Kometa scheduling remains unverified. A rotating `Director Spotlight` remains planned and is intentionally deferred until after migration.

## Pre-migration backup and freeze

Fresh application-native backups exist for:

- Radarr
- Sonarr
- Prowlarr

A consistent private archive of the entire `/data/docker` tree was created while all services were stopped:

```text
/data/arr_backup/docker-stack-pre-migration-2026-08-23.tar.gz
```

The archive is approximately 662 MiB and was verified with a full `tar -tzf` read. It contains private application state and credentials and must never be committed to this repository.

After the snapshot, all persistent services were restarted and verified `Up` with `docker compose ps`.

The laptop should now be treated as frozen: normal use is allowed, but configuration changes, upgrades, new services, and feature work should wait until the desktop copy is stable.

## Deferred cleanup

The current Compose file still contains an obsolete top-level `version` attribute. Docker Compose ignores it and emits a warning. Removing it is intentionally deferred until after migration.

There is currently no `.env` file. Secret extraction into `.env`, a public-safe `.env.example`, and further Compose hardening are also deferred until the migrated stack is stable.
