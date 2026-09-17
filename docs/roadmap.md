# Roadmap

## Operating model

The Homelab / Media project now runs as two coordinated workstreams. They should not duplicate ownership.

### Infrastructure & Agent Control Plane — this workstream

Owns:

- host, storage, Docker and post-migration infrastructure;
- Movie Intelligence SQLite data layer;
- ČSFD ingestion and future SerialZone ingestion;
- safe read/write tool contracts for AI agents;
- Radarr/Sonarr/Seerr API integration for agent actions;
- security boundaries, secrets, logging and auditability;
- future Observer / Media Operator platform plumbing;
- remote connector / controlled remote-access plumbing when activated;
- monitoring, backups and infrastructure hardening.

### Plex, Kometa & Media Automation — sibling workstream

Owns:

- Plex behavior and media UX;
- Kometa collections and curation behavior;
- Bazarr and subtitle policy;
- Sonarr/Radarr media-policy details such as TRaSH/Recyclarr and acquisition behavior;
- hardlink acceptance checks from the media-workflow side;
- My Cinema / watched-library presentation in Plex;
- Trakt / PlexTraktSync behavior;
- Seerr deployment, request UX and media-policy configuration.

Cross-workstream rule: the sibling workstream owns media-domain behavior; this workstream owns the common data/control-plane plumbing and agent-facing interfaces. If Seerr becomes the preferred agent write gateway, its deployment/policy remains media-owned while the agent API wrapper remains control-plane-owned.

## Current checkpoint

The notebook-to-desktop migration is formally closed as of 2026-09-09. The remaining ARR hardlink acceptance check is a useful post-migration media sanity check, not a migration blocker.

Verified project milestones include:

- 18 TB ext4 data disk mounted at `/data`;
- Docker media stack reproduced on the desktop;
- migration data and recovery archive validated;
- real Radarr post-migration download/import completed;
- 26 NTFS-era duplicate media/torrent sets converted to hardlinks;
- approximately 711.6 GiB reclaimed;
- Usenet-first acquisition with torrents as manual fallback;
- Movie Intelligence SQLite foundation created;
- ČSFD ratings ingestion and one-time private watchlist bootstrap completed;
- database verified at 682 unique movies: 556 watched, 126 watchlist, 0 overlap;
- systemd ČSFD sync service verified and twice-monthly timer enabled;
- `lookup_movie.mjs` verified against Movie Intelligence;
- credential-safe read-only Radarr API access verified;
- `get_radarr_movie_status.mjs` verified for both present and absent movies.

## Master execution order

### Phase 1 — Close the small open checks

Infrastructure / Agent Control Plane:

- verify the first unattended ČSFD timer-triggered run and journal output;
- finish `get_movie_status.mjs`, combining Movie Intelligence and Radarr read state;
- add stable external-ID identity resolution, preferably TMDb, before any write action.

Plex / Media Automation:

- complete the one-film ARR hardlink acceptance check when a suitable torrent is available.

These are short closure items and should not hold up the rest of the roadmap.

### Phase 2 — Subtitle automation

Media workstream:

- deploy and configure Bazarr;
- automate CZ/EN subtitle acquisition while avoiding unnecessary duplicate subtitle files;
- verify the workflow on real library items.

### Phase 3 — Request gateway

Media workstream:

- deploy and configure Seerr as the human-friendly discovery/request layer over Radarr/Sonarr.

Control-plane workstream:

- evaluate Seerr as the preferred narrow write boundary for future AI movie/series requests before implementing direct Radarr/Sonarr mutation;
- only use direct ARR write APIs where Seerr cannot express the required operation cleanly.

This decision should happen before the first production agent command such as "download this movie".

### Phase 4 — Personal watched/history layer

Treat the local Movie Intelligence DB as the durable internal personal-state layer unless a later ADR deliberately changes that decision.

Media workstream:

- design Trakt / PlexTraktSync synchronization without creating competing sources of truth;
- prototype My Cinema / Watched in Plex;
- determine the best representation for watched titles whose media files are no longer local;
- prefer a clean Plex-native approach first, then consider archive/placeholder techniques only if needed for TV clients.

Control-plane workstream:

- enrich Movie Intelligence with stable IDs such as TMDb/IMDb;
- reconcile watched/watchlist/library/download state across Movie Intelligence, Plex and request/download systems where useful.

### Phase 5 — Actionable media agents

The agent roadmap is already active; it is not a single final phase that begins only after all Plex work is finished.

Progression:

```text
Observe -> Act -> Automate -> Delegate -> Autonomy
```

Observer foundations are already underway through Movie Intelligence and read-only Radarr tools.

Next safe actions:

- `get_movie_status`;
- add/remove local watchlist state;
- request a movie through the chosen request gateway;
- get request/download status;
- cancel or retry only through explicit allowlisted operations;
- later add series / episode operations after SerialZone + Sonarr design is ready.

No unrestricted root shell, generic SSH execution or unrestricted SQL should be exposed as the normal agent interface.

Potential agent roles:

- **Observer** — system/media state and diagnostics;
- **Media Operator** — explicit request/download/control actions;
- **Curator** — recommendations, watched history, collections and future Kometa integration.

### Phase 6 — Curation and Plex automation v2

Media workstream:

- Kometa v2;
- richer personal collections and curation;
- integrate Curator outputs only after the data contracts are stable;
- improve CZ/SK handling only when real usage justifies further automation.

### Phase 7 — Remote use and homelab operations

Control-plane / infrastructure workstream:

- controlled remote connector for ChatGPT/homelab administration if desired;
- later user-facing VPN/Tailscale/WireGuard remote access if desired;
- monitoring/dashboarding;
- permanent container image pin/update policy;
- backup/restore retention and restore drills;
- secrets hardening;
- retire/unmount the old rollback source disk;
- Ethernet / 2.5 GbE / storage expansion / PSU / SSD improvements as actual need appears.

No public router port-forwarding is required for the current plan.

## Near-term NOW

Keep only a small number of active fronts:

1. Infrastructure/Agent chat: verify unattended ČSFD timer run and finish unified `get_movie_status` read layer.
2. Plex/Media chat: complete hardlink sanity check, then move directly to Bazarr.
3. After Bazarr: bring Seerr forward because it can serve both human requests and the future safe agent write boundary.

Do not start Trakt, My Cinema, Kometa v2 and write-capable agents all at once.

## Important architecture decisions still open

- whether Seerr should be the default agent request/write gateway versus direct Radarr/Sonarr mutation;
- exact Movie Intelligence ↔ Trakt/Plex synchronization responsibilities;
- representation of watched-but-no-longer-local titles in Plex;
- future SerialZone / Sonarr series model;
- permanent container version/update policy;
- backup tooling, retention and frequency;
- monitoring stack;
- timing of remote-access plumbing and later storage/network upgrades.
