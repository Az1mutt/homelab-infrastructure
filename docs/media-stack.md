# Media Stack

## Service inventory

| Service | Status | Purpose | Exposure |
|---|---|---|---|
| Plex | Verified | Media server and playback | Host network, port 32400 |
| Radarr | Verified | Movie management and import | 7878 |
| Sonarr | Verified | TV management and import | 8989 |
| Prowlarr | Verified for current indexers | Indexer management and ARR synchronization | 9696 |
| qBittorrent | Verified | Active torrent downloader and fallback | 8080; peer 6881 TCP/UDP |
| Kometa | Manual runs verified | Plex metadata and collection automation | No Web UI |
| SABnzbd | Component-tested | Usenet downloader | Host 8081 to container 8080 |
| Eweka | Component-tested | Usenet provider | External SSL service |
| NZBGeek | Blocked | Candidate NZB indexer | Account or membership issue |

Exact image versions should be captured from the live host before a versioned deployment document is added. Kometa logs showed version 2.4.5 during a verified run; the Compose image tags may still be floating.

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

The physical disk and filesystem behind `/data` require fresh verification before migration.

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

Each application also maps its directory under `/data/docker/<service>` to `/config`.

## Torrent path

The operational path is:

```text
Radarr / Sonarr
→ Prowlarr and torrent indexers
→ qBittorrent
→ /data/torrents
→ ARR import
→ /data/media
→ Plex
```

Torrents remain the intended fallback for Czech and Slovak releases. Exact qBittorrent categories, hardlink behavior, seeding policy, and ARR scoring rules have not been captured.

## Usenet path

Current component-level state:

- Eweka subscription is active.
- SABnzbd connected successfully to `news.eweka.nl` over SSL on port 563.
- SABnzbd uses `/data/usenet/incomplete` and `/data/usenet/complete`.
- Categories `movies` and `tv` map to their respective completed subdirectories.
- Radarr and Sonarr can reach SABnzbd at `sabnzbd:8080` and both connection tests passed.
- Adding `sabnzbd` to SABnzbd's host whitelist resolved an internal `403 Forbidden` response.

The complete path remains unverified:

```text
ARR search
→ Prowlarr NZB indexer
→ SABnzbd queue
→ Eweka download
→ category path
→ ARR import
→ Plex scan
```

NZBGeek returned `Trial Account Only`; account recovery, membership activation, or another indexer is required.

## Plex and Kometa

Verified Kometa behavior:

- Connected to TMDb.
- Connected to Plex after replacing container-local `127.0.0.1` with `<HOST_LAN_IP>`.
- Created `Newly Released`.
- Created five director collections during a manual run.
- Created an unwanted director separator.

The verified configuration intent includes director `depth: 10` and `limit: 5`. The next change is to add `use_separator: false`, run Kometa, and remove the existing separator if needed.

Persistent scheduling is not verified. All proven executions used a one-off command:

```bash
cd /data/docker
docker compose run --rm kometa --run
```

A rotating `Director Spotlight` is planned but not implemented.

## Playback observation

For some 4K WEB-DL media on a Samsung S90F Plex client, forcing Direct Play removed visible stuttering. The root cause remains unknown because video, audio, subtitles, network behavior, and Plex Dashboard decisions were not captured during the event.

