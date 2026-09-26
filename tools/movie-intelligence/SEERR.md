# Controlled Seerr movie requests v0.1

**Component-tested; live write not yet accepted.** Issue #14 adds a separate Act boundary to the live-accepted Observe module. No real Seerr request was sent during implementation. Node 24.14+ is required, with no new dependencies. Run the complete offline suite with `node --test test/*.test.mjs` from this directory.

## Interface and configuration

`createMovieRequestController({ seerr, movieIntelligence, radarr })` returns only:

- `plan_movie_request({ tmdb_id })` or `plan_movie_request({ title, year })`: read-only plan.
- `request_movie(input, { execute: false })`: the default read-only behavior.
- `request_movie(input, { execute: true })`: fresh preflight followed by at most one exact movie POST. This call requires separate operational authorization before using live credentials.

`movieIntelligence` and `radarr` are the existing trusted read-adapter functions returning normalized snapshots. Their watched/watchlist/rating evidence is informational, never write permission. Returned evidence includes source health/counts and identity state, not private personal ratings, media paths or raw upstream responses.

The separate `request-cli.mjs` uses private environment configuration:

| Variable | Purpose |
|---|---|
| `SEERR_BASE_URL` | Seerr origin and optional URL base; no query/fragment/embedded credentials |
| `SEERR_API_KEY` | Credential in environment only; no key CLI flag |
| `MOVIE_DB_PATH` | Existing Movie Intelligence SQLite database |
| `MOVIE_DB_SCHEMA_MODE` | Defaults to `normalized` in this request CLI; the original read CLI retains its own default |
| `MOVIE_DB_MAPPING_PATH` | Optional mapping for single-table mode only |
| `RADARR_BASE_URL`, `RADARR_API_KEY` | Existing GET-only Radarr read adapter configuration |

Example dry-run, after configuring those variables privately (synthetic movie ID):

```sh
node request-cli.mjs --tmdb-id 900001
node request-cli.mjs --title 'Synthetic Movie' --year 2020
```

Only a call-level `--execute` enables a write. No environment/global execute toggle exists. Do not use that flag against live Seerr until the separate acceptance issue explicitly approves a movie. `--previous-unknown` carries an unresolved prior submission into a new CLI process and prevents resubmission if a matching request has not become visible. CLI exit 2 means blocked/ambiguous/unresolved/unknown; exit 0 includes plans and no-ops, not necessarily a new request.

## Identity and preflight

An explicit TMDb ID is preferred. Title/year resolution exhausts bounded Seerr search pages, requires exactly one exact normalized title/original-title and year result of type movie, and verifies that identity again with movie details. Fuzzy matches, missing year, TV matches, duplicates and incomplete pagination do not authorize execution. No discovered IDs are written back to SQLite.

The existing `get_movie_status` checks TMDb/IMDb evidence from Seerr against both read sources. Unavailable sources, ambiguity and conflicting IDs/years block writes; a single-source result is not mislabeled as a cross-source match. Seerr movie details and the full movie-request listing are checked independently, so a failed/omitted media association alone cannot be treated as absence. v0.1 requires Seerr 3.4.1 and admin API visibility; other versions/roles block pending review, without attempting to grant permissions.

| Decision | Effect |
|---|---|
| `requestable` | Return exact planned action; no POST unless explicitly executing |
| `already_available` | Radarr has a file or Seerr reports available; no-op |
| `already_requested` | Matching pending/approved/completed request or processing/partial availability; no-op |
| `already_managed` | Radarr has a record but no confirmed file; no search/add/request |
| `ambiguous` | Multiple plausible identities; no mutation |
| `blocked` | Blocklist, failed/declined request, missing policy, unsupported version/visibility or invalid input |
| `unresolved` | Read/source/configuration failure or identity evidence unresolved |
| `requested` | POST response and GET read-back agree on movie ID, request ID, variant and accepted request status |
| `unknown_after_submit` | Submission/read-back uncertain; never retry automatically |

Existing requests and availability are conservatively checked across variants. This wrapper does not create a second 4K copy, revive a declined request or retry a failed request. A configured default non-duplicate Radarr service must exist uniquely, and its current profile/root must be present in the service details. If not, `media_policy_dependency` delegates the decision to Media Automation. The wrapper never invents or overrides those values.

## Exact HTTP boundary

The private Seerr client exposes no URL/method passthrough. It uses only these GET routes:

- `/api/v1/settings/about`, `/api/v1/auth/me`
- `/api/v1/search?query=...&page=...`
- `/api/v1/movie/{tmdbId}`
- `/api/v1/request?take=100&skip=...&filter=all&mediaType=movie`
- `/api/v1/service/radarr`, `/api/v1/service/radarr/{configuredId}`
- `/api/v1/request/{requestId}` for post-submission verification

The only mutation is POST `/api/v1/request`, constructed internally:

```json
{ "mediaType": "movie", "mediaId": 900001, "is4k": false }
```

`is4k=false` selects Seerr's standard/default request lane, not an HD quality cap. Seerr's configured ARR profile still determines quality. No profile/root/server overrides, approval bypass, user impersonation, TV/seasons, direct ARR write, arbitrary HTTP, shell, SQL write or Docker control exists in the module. Auth uses headers; redirects are refused for GET and POST. Responses are capped at 4 MiB, 10 search pages and 1,000 listed requests; each HTTP request/body has a 10-second timeout (trusted module config allows 1–60000 ms). Oversized/incomplete responses fail closed. Upstream error text, stack traces and credential echoes are discarded.

## Replay, uncertainty and orchestration responsibility

Execution always obtains a new plan and refreshes all preflight evidence again immediately before POST; callers cannot submit a cached/edited plan. A successful POST is followed by GET request read-back. A timeout, HTTP error, redirect, malformed/mismatched response or failed read-back after the attempted POST yields `unknown_after_submit` and no second POST. Even an apparent HTTP rejection is treated conservatively because processing may already have occurred.

One controller permits only one execute invocation at a time, remembers successful receipts, and latches uncertain IDs. Later invocations re-read current state. A visible matching request produces a no-op; an uncertain ID with no visible request remains blocked for reconciliation. Nothing is logged to disk by the wrapper.

**Cross-process limitation:** Seerr does not provide a transactional idempotency key here. This is read-before-write replay protection, not distributed exactly-once delivery. The future orchestrator must serialize execution per movie and durably retain the returned audit event. After process restart, propagate an unresolved submission as `previous_unknown: true` / `--previous-unknown`; never treat a briefly empty list as proof a timed-out POST failed. Concurrent independent processes or discarded uncertainty receipts are outside the v0.1 guarantee. Reconciliation/clearing an uncertain outcome is an explicit later operator action, not an automatic retry path.

Every result has a versioned sanitized audit event: timestamp, action, resolved TMDb ID, decision/reason, preflight decision, mutation-attempted flag and request ID/status when verified. Planning does not prove approval; `requested` proves request persistence, not ARR import/acquisition/Plex completion.

## Evidence and next acceptance

Read-only discovery on 2026-09-26 confirmed Seerr 3.4.1, admin API visibility, working search/movie/request-list GETs, one default standard Radarr service and valid existing default profile/root. Scarface/TMDb 111 reports available. The installed source confirms the movie/request status enums, request media relation and configured-default behavior. Credentials were used only in memory; no settings/services/container changes or live POST were made. This is discovery evidence, not live wrapper/write acceptance.

The later live acceptance issue must select one explicit user-approved movie, review the dry-run identity/policy, authorize one execute call, retain its audit result and verify Seerr → Radarr → acquisition/Plex as appropriate. Stop on ambiguous identity or uncertain submission. Do not implement that acceptance in Issue #14.

See [ADR 003](../../docs/decisions/003-controlled-seerr-movie-request.md) and the [read-layer runbook](README.md). Source semantics: [Seerr v3.4.1 request entity](https://github.com/seerr-team/seerr/blob/v3.4.1/server/entity/MediaRequest.ts), [ARR defaults](https://github.com/seerr-team/seerr/blob/v3.4.1/server/subscriber/MediaRequestSubscriber.ts), [service reads](https://github.com/seerr-team/seerr/blob/v3.4.1/server/routes/service.ts).
