# Seerr deployment and acceptance

Verified on 2026-09-25. Seerr is the human discovery/request layer; ARR remains authoritative for quality and acquisition. Agent-facing API wrappers belong to the Infrastructure & Agent Control Plane workstream and were not implemented.

## Runtime

Official Seerr 3.4.1, pinned digest below. Separate Compose project at `/data/docker/seerr`, persistent config at `/data/docker/seerr/config` (UID/GID 1000). Existing media network is reused. Plex runs on the host and is reached through `host.docker.internal:32400`; ARR uses Docker service names.

Sanitized representation of the deployed Compose file. Set `SEERR_BIND_IP` privately to the host LAN address; do not use a public or wildcard address. Initial owner setup was performed on loopback before enabling the LAN binding.

```yaml
services:
  seerr:
    image: ghcr.io/seerr-team/seerr@sha256:f4768de5f616248d723e05891f3345a1402123775d03bf0890dbfedc0831bda1
    container_name: seerr
    init: true
    user: "1000:1000"
    environment:
      LOG_LEVEL: info
      TZ: Europe/Bratislava
      PORT: "5055"
    ports:
      - "${SEERR_BIND_IP:?Set the host LAN address}:5055:5055"
    volumes:
      - /data/docker/seerr/config:/app/config
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - media
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:5055/api/v1/settings/public"]
      start_period: 30s
      timeout: 5s
      interval: 15s
      retries: 5
    restart: unless-stopped
networks:
  media:
    external: true
    name: docker_default
```

No public ingress/proxy/router changes were made. Docker binding was inspected; external router reachability was not independently tested. Owner Plex authentication passed. New Plex user auto-enrollment is disabled; onboarding additional users is a separate deliberate action.

## Service policy

| Service | Endpoint | Existing profile | Root |
|---|---|---|---|
| Radarr | radarr:7878 | 9 — UHD Bluray + WEB | /movies |
| Sonarr | sonarr:8989 | 7 — WEB-2160p (Alternative) | /tv |

Both are default non-duplicate services (`is4k=false`); this does not cap the selected ARR profile at HD. Library sync is enabled. Radarr minimum availability is released. Sonarr uses standard series, season folders and no automatic monitoring of unrequested new seasons. No anime-specific acceptance was performed.

Automatic search was disabled for the initial pilot, then enabled for future approved requests after the pilot. This setting change does not retroactively search existing requests. Default permissions require approval; the owner can approve/request directly. Usenet indexers retain RSS/automatic search; torrent indexers retain interactive-only access.

## Acceptance evidence

Seerr-native discovery found The Sinner (2017), TMDb 39852 / TVDB 326866. Plex scan showed season 2 available and season 1 missing. Request 1 selected season 1 only and reached existing Sonarr series 25 at `/tv/The Sinner`, profile 7. Seasons 2, 3 and 4 retained their previous monitoring state.

The user then explicitly asked to search. Sonarr SeasonSearch 92180 completed with eight reports sent via NZBgeek to SABnzbd. Download/import and playback were not asserted complete. No movie was requested merely for testing: Radarr connection/profile/root selection is component-tested.

Full before/after API comparisons passed for both ARR services' quality profiles, download clients, indexers and remote path mappings. Existing stack containers were not recreated; only Seerr was created/recreated. Compose validation and Docker health passed. Plex Movies and TV Shows scans completed. Browser/client login remains a user follow-up; request-layer acceptance is complete.

## Backups and rollback

Private backup directory: `/data/docker/arr_backup/pre-seerr-20260925T184117Z`. It contains the original stack Compose files, ARR baseline, Seerr settings checkpoints and a SQLite-consistent database backup before the request. Treat the entire backup as secret-bearing; do not publish it.

Rollback is an operational change: stop only the Seerr Compose project and retain its config directory. Restore Seerr settings/database together from the matching private checkpoint while stopped if needed. The original media stack Compose was untouched. Removing Seerr does not undo requests already sent to ARR; review The Sinner season 1 deliberately rather than deleting media or reverting unrelated series settings. Restore was not exercised.

Bazarr was left unchanged. ARR root/mapping drift and the future fresh-torrent hardlink test remain open; no old media was mutated for a test.

See [current state](current-state.md) and [roadmap](roadmap.md). Upstream references: [Docker deployment](https://docs.seerr.dev/getting-started/docker/) and [service configuration](https://docs.seerr.dev/using-seerr/settings/services/).
