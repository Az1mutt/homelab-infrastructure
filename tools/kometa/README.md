# Kometa Phase 1 execution

The daily job runs only Movies / `basic` / `Newly Released`, with collections-only
mode. It does not execute director defaults, TV, overlays, metadata files or library
operations. The existing private `/data/docker/kometa/config.yml` is reused without
copying credentials. The Compose override pins the verified Kometa 2.4.8 digest and
sets restart to `no`; the base Compose file is unchanged.

## Deployment and operation

Deployed on 2026-10-14: `run_phase1.py`, `compose.phase1.yml`, and
`crontab.phase1` reside under `/data/docker/kometa`. The user's crontab contains
the supplied daily entry. Existing cron is enabled at boot. The host timezone is
UTC: runs are at 03:15 UTC, or 04:15 CET / 05:15 CEST. This survives reboot but
does not replay a run missed while the server was off. No reboot was performed
for acceptance and the first time-triggered invocation remains to be observed.

The runner uses a nonblocking file lock, refuses an existing named job container,
allows 30 minutes for the job, then stops and removes only its own container.
There is no always-running Kometa container and no image pull during execution.
Launch failure is reported; an interrupted launch may leave the named container,
in which case the next run refuses overlap and requires inspection.

**Modifies Plex:** manual invocation of the same scheduled entry point:

```sh
python3 /data/docker/kometa/run_phase1.py
```

Private logs are `/data/docker/kometa/logs/phase1-<UTC timestamp>.log`, the
scheduler's `phase1-scheduler.log`, and Kometa's own rotating `meta*.log`.
Do not publish raw logs: they can contain configuration or account details.
Wrapper logs are not automatically pruned. Exit zero is process success, not a
substitute for checking Kometa's summary and Plex visibility.

For rollback, remove only the `run_phase1.py` cron entry, preserving any later
unrelated entries. `crontab.before-phase1` retains the pre-install contents on the
host. Keep the deployment files and logs until retirement is explicitly decided.
Disabling scheduling does not undo the collection's Plex promotion.

## Acceptance: 2026-10-14

- The September 2 run recognized both visibility variables but skipped the
  collection because its minimum of one item was not met. No recurring job had
  reapplied visibility after membership became nonempty.
- Fresh bounded run: exit 0; Kometa logged `Collection Visibility Updated`.
- Promotion read-back: `promotedToOwnHome=1`, `promotedToRecommended=1`,
  `promotedToSharedHome=0`. Owner Home is the configured scope; shared Home is not.
- Collection retained both members and its 90-day, release-descending filter.
- All eight collection IDs survived. Seven director metadata fingerprints and
  memberships matched exactly; native Movies/TV hub settings, TV collections,
  and the private Kometa configuration hash were unchanged.
- **Visibility unsupported under current entitlement:** despite persisted promotion, `Newly Released`
  was absent from both `/hubs/promoted?contentDirectoryID=1` and
  `/hubs/sections/1`, also with explicit client headers and count 50. No TV-client
  visual verification was performed. Plex reports `subscriptionActive=0`.
  Plex documents an active Plex Pass as a prerequisite for publishing collection
  rows; this unmet requirement is consistent with the observed omission.
  No subscription change or unsupported visibility workaround was applied.
- A pre-existing unmatched local movie warning appeared during library mapping;
  it did not prevent updating the selected collection and was not changed.

Next: owner decision on the Plex Pass prerequisite. If enabled later, repeat only
single-row Home/Recommended visibility acceptance before expanding Kometa v2 rows.

## Validation

Compose `config --quiet`, installed-image CLI flag verification, actual bounded
live run, pre/post Plex snapshots, and offline lifecycle tests passed.
On Linux: `python3 -m unittest discover -s tools/kometa -p 'test_*.py'`.

References: [Kometa execution flags](https://kometa.wiki/en/latest/kometa/environmental/)
and [Plex publishing collections](https://support.plex.tv/articles/publishing-collections/).
