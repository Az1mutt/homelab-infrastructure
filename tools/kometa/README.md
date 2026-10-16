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
ones. Trending Now alone uses `minimum_items: 3` and
`delete_below_minimum: true`: below three local matches it is deleted or remains
absent, then can be recreated when at least three matches return. All other
definitions retain `delete_below_minimum: false`; global retention is unchanged.

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
Missed runs while powered off are not replayed. Automatic runs on October 15 and
16, 2026 succeeded at the scheduled time; an actual reboot remains unobserved.

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

## Runtime acceptance and Trending correction — 2026-10-16

- Cron invoked both October 15 and 16 jobs at 03:15:01 UTC. Both exited zero,
  without lock conflict or timeout; private wrapper logs and Kometa log rotation
  were verified.
- Daily picks October 14–16: Inglourious Basterds → Margin Call → The Wailing.
  Deterministic selection and same-day retention passed. Thursday's genre changed
  Thriller (12) → Drama (20). Scorsese remains the only eligible director (4).
- Counts on October 16: 2/3/1/4/20; ordering, seven standalone directors, TV,
  overlay labels and native settings passed regression checks.
- October 15 exposed a retention defect: sync removed two Trending members, then
  `Minimum 3 Not Met` left one member because deletion was disabled. The generated
  Trending-only flag is now corrected and deployed; no manual Kometa run was made.
- Sixteen tests passed in the pinned 2.4.8 image with networking disabled. Five
  compatibility tests execute the actual installed Kometa AST branches with an
  in-memory Plex boundary: valid sizes, 0–2 matches, recovery, old-defect
  reproduction, and collection-specific scope. This is **Component-tested**;
  natural below-minimum live deletion has not yet been observed after the fix.

Run compatibility coverage inside the pinned image, mounting this directory at
`/tests:ro`, setting `KOMETA_SOURCE=/kometa.py`, `PYTHONDONTWRITEBYTECODE=1`, working
directory `/tests`, and using `--network none`. Run `python -m unittest discover
-s /tests -p 'test_*.py'`. Without `KOMETA_SOURCE`, the five compatibility tests
are explicitly skipped; ordinary rotation and runner tests still run on Linux.

## Rollback and next boundary

Private `config.yml.pre-discovery` and `run_phase1.py.pre-discovery` remain on the
host beside the originals. Check for newer edits before restoring; these private
files must never enter Git. Disable only the matching cron entry if needed.
Retain generated files/logs until retirement is explicitly decided. Restoring the
runner does not delete the four new collections; removal needs a separate decision.

Phase 1 established execution/promotion settings and found inactive Plex Pass.
Phase 2A accepts ordinary collections independently of that optional feature.
Runtime scheduling and rotation are accepted; the Trending correction is
component-tested. Optionally confirm deletion on the next naturally below-minimum
day and recovery afterward; do not manufacture a shortage. Gather feedback
before separately scoping more Movies collections. Mood, Critically Acclaimed,
Hidden Gems, Rediscover, Because You Watched, My Cinema and TV v2 remain deferred.

References: [execution flags](https://kometa.wiki/en/latest/kometa/environmental/),
[ordering](https://kometa.wiki/en/latest/kometa/guides/order/), and
[Plex publishing](https://support.plex.tv/articles/publishing-collections/).
