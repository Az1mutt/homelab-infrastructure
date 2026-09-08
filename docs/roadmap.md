# Roadmap

## Now

- Let the currently grabbed torrent finish.
- Verify successful ARR import and real ext4 hardlink behavior while qBittorrent retains the torrent for seeding.
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
- One live torrent acceptance download is in progress.

## Current gate

Finish the real torrent import/hardlink check, then close the media acceptance phase.

## Next: infrastructure closure

- Decide the final disposition of the old rollback disk.
- Replace/remove the temporary migration-version override.
- Finalize permanent container image pin/update policy.
- Remove the obsolete Compose `version` field if still present.
- Harden backup/restore and retention.
- Refresh public-safe documentation/config examples as needed.

## Post-closure performance optimization

A real Netdata investigation confirmed SAB/Plex contention on the 18 TB media disk.

Preferred direction:

- move SAB incomplete/complete repair/unpack scratch workload to separate storage;
- SSD is currently the likely target;
- exact device, capacity and filesystem are still open;
- repeat Plex + SAB load testing after the change.

This optimization should not hold migration closure hostage.

## Later media work

- Iterate Kometa Home/Recommended based on the real TV experience.
- Add Trending/Popular, Director Spotlight or seasonal rows only where they improve the UI.
- Add Bazarr with duplicate-subtitle avoidance.
- Add Trakt/PlexTraktSync.
- Add Seerr.
- Revisit nzb360 premium if the mobile cockpit proves valuable.
- Add controlled remote access and media agents only after the base platform remains stable.

## Open decisions

- final disposition of the rollback disk;
- permanent container update/pin policy;
- future SAB scratch storage device/layout;
- backup tooling, retention and restore-test cadence;
- whether/when nzb360 is worth paying for.
