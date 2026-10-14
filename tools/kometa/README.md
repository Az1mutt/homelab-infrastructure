# Kometa Movies discovery

Phase 2A is live-accepted on 2026-10-14 using pinned Kometa 2.4.8. Ordinary
collections work without Plex Pass. Home/Recommended promotion is outside this
milestone and was not retested. No TV definitions or overlays run.

## Collection policy

| Sort title | Collection | Rule | Accepted members |
| --- | --- | --- | ---: |
| `!010_Newly Released` | Newly Released | Existing smart collection, release within 90 days, release descending | 2 |
| `!020_Trending Now` | Trending Now | TMDb weekly top 100 intersected with local Movies, maximum 12, minimum 3 | 3 |
| `!030_Movie of the Day` | Movie of the Day | One released, playable library movie, fixed for the calendar day | 1 |
| `!040_Director Spotlight` | Director Spotlight | One curated director, minimum 3 movies, Monday rotation | 4 |
| `!050_Genre Spotlight` | Genre Spotlight | One curated genre, minimum 5 movies, Thursday rotation | 12 |

This extends the existing sort namespace with increments of ten. Titles stay
clean; current spotlight details appear in summaries. Existing browsing directors
retain their `!150_` titles, membership and metadata. No separators are added.

## Rotation rules

Calendar boundaries use Europe/Bratislava; changes apply at the next daily run.
There is no account-specific watched filtering.

- **Movie:** choose the lowest SHA-256 of `YYYY-MM-DD|stable identity`. Identity
  prefers IMDb, then Plex GUID, then rating key. Persist the winner for the day so
  library additions and reruns cannot change it. If removed/ineligible, choose a
  deterministic replacement. Daily picks can occasionally repeat across dates.
- **Director pool, in order:** Martin Scorsese, Denis Villeneuve, David Fincher,
  Christopher Nolan, Quentin Tarantino, Danny Boyle, Steven Spielberg, Bong Joon-ho.
  Week zero starts Monday 2026-01-05. Start at `week modulo pool length`, scan
  forward past candidates below three movies, and retain the eligible winner
  throughout that week.
- **Genre pool, in order:** Crime, Horror, Science Fiction, Thriller, Drama, Comedy.
  Same rule with a three-day offset: week zero starts Thursday 2026-01-08.
  Require five movies and retain that week's eligible choice.

Only Scorsese currently qualifies in the 49-film library. He remains the spotlight
until another curated director has three eligible movies; the threshold is not
weakened for rotation. All six genres qualify. If no director/genre qualifies,
preparation fails safely before Kometa runs, preserving prior definitions and
collections rather than silently reducing minimums.

Trending uses supported `tmdb_trending_weekly: 100`, `limit: 12`, source ordering
and `sync_mode: sync`. Missing movies are never acquired or replaced with unrelated
ones. Below three local matches, Kometa skips the update; an existing collection
is retained and its minimum-not-met result must be reviewed before describing it
as current trending. No automatic collection deletion is configured.

## Runtime and private configuration

The accepted `run_phase1.py` filename, lock, cron entry and container identity are
retained. The runner now launches `discovery.py` inside the same digest-pinned
image. It reads existing private config credentials and only Plex Movies metadata,
then atomically generates `movies-v2.generated.yml` (JSON-compatible YAML) and
`movies-v2.rotation.json`. Neither contains credentials; both are mode 0600 and
owned by the existing config owner.

Kometa executes only Movies / `movies-v2.generated` / the five named collections,
with `--collections-only`. Existing basic/director entries remain untouched but
are excluded from this bounded run. Newly Released is updated in place by name.
The only private config change is the new file reference:

```yaml
libraries:
  Movies:
    collection_files:
      - file: /config/movies-v2.generated.yml
      # Existing basic/director entries remain below, unchanged.
```

The generator refuses global or Movies-level Radarr/Sonarr integration rather
than inheriting acquisition defaults. In 2.4.8, even `radarr_add_missing: false`
requires configured Radarr; that attribute is intentionally absent. This was
caught and corrected before acceptance. The helper converts Kometa `[ERROR]`
log entries into failure even when Kometa itself exits zero.

The existing daily cron remains 03:15 UTC (04:15 CET / 05:15 CEST), backed by the
boot-enabled host cron service. A nonblocking lock prevents overlap; an existing
named container is refused. Jobs have a 30-minute timeout and cleanup removes
only the job container. No image pull or always-running container is required.
Missed runs while powered off are not replayed. First timed firing and actual
reboot remain unobserved; the scheduled entry point passed manual live runs.

**Modifies the five collections:**

```sh
python3 /data/docker/kometa/run_phase1.py
```

Private user-readable logs remain `logs/phase1-<UTC timestamp>.log` and
`logs/phase1-scheduler.log`. Kometa `meta*.log` may require container access.
Never publish raw logs; they can contain credentials/account details. Wrapper
logs are not automatically pruned.

## Live acceptance — 2026-10-14

- Newly Released: Insidious: Out of the Further; Ice Cream Man. Smart identity,
  90-day filter and both members preserved.
- Trending Now: Insidious: Out of the Further; Scream 7; Sinners. Three distinct
  external-list matches; no padding.
- Movie of the Day: Inglourious Basterds (2009), exactly one member.
- Director Spotlight: Martin Scorsese — GoodFellas, The Departed, The Irishman,
  Killers of the Flower Moon.
- Genre Spotlight: Thriller, 12 movies; examples: Collateral, The Game, Margin
  Call and The Killer.
- Exactly one of each spotlight and all five expected sort titles verified.
  All eight pre-existing IDs survived; total 12 collections. No collection omitted.
- Seven director metadata fingerprints/memberships, native Movies/TV hub settings,
  TV collections and movie overlay labels matched the pre-run snapshot exactly.
- Corrected live run exited zero with five successful summaries; container removed.
- Eleven offline tests cover determinism, same-day retention after library changes,
  missing selections, weekly boundaries/offsets, minimums, eligibility and runner
  lifecycle. Installed 2.4.8 builder source, secret scan and whitespace checked.

Linux tests: `python3 -m unittest discover -s tools/kometa -p 'test_*.py'`.

## Rollback and next boundary

Private `config.yml.pre-discovery` and `run_phase1.py.pre-discovery` remain on the
host beside the originals. Check for newer edits before restoring; these private
files must never enter Git. Disable only the matching cron entry if needed.
Retain generated files/logs until retirement is explicitly decided. Restoring the
runner does not delete the four new collections; removal needs a separate decision.

Phase 1 established execution/promotion settings and found inactive Plex Pass.
Phase 2A accepts ordinary collections independently of that optional feature.
Next: observe the next daily pick and Thursday genre rotation, then gather feedback
before separately scoping more Movies collections. Mood, Critically Acclaimed,
Hidden Gems, Rediscover, Because You Watched, My Cinema and TV v2 remain deferred.

References: [execution flags](https://kometa.wiki/en/latest/kometa/environmental/),
[ordering](https://kometa.wiki/en/latest/kometa/guides/order/), and
[Plex publishing](https://support.plex.tv/articles/publishing-collections/).
