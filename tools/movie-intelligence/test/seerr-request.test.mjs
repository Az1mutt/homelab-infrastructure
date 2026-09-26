import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createMovieRequestController } from '../seerr-request.mjs';
import { intelligenceRecord, radarrRecord } from '../model.mjs';

const key = 'synthetic-seerr-test-credential';
const clock = () => new Date('2026-01-01T00:00:00Z');
const json = data => new Response(JSON.stringify(data));
const movie = () => ({ id: 123, title: 'Fixture Movie', originalTitle: 'Fixture Movie', releaseDate: '2020-01-01', imdbId: 'tt1234567' });
const server = () => ({ id: 0, isDefault: true, is4k: false, activeProfileId: 42, activeDirectory: '/synthetic-root' });
const request = () => ({ id: 7, type: 'movie', is4k: false, status: 2, media: { tmdbId: 123, mediaType: 'movie' } });
function harness({ override = {}, mi = [], arr = [], fetchOverride, config = {} } = {}) {
  const calls = []; let stored = null;
  const fake = async (url, options) => {
    const path = new URL(url).pathname.replace('/api/v1/', '') + new URL(url).search;
    calls.push({ path, ...options });
    if (fetchOverride) { const r = await fetchOverride(path, options, calls); if (r !== undefined) return r; }
    if (Object.hasOwn(override, path)) return json(typeof override[path] === 'function' ? override[path]() : override[path]);
    if (path === 'settings/about') return json({ version: '3.4.1' });
    if (path === 'auth/me') return json({ permissions: 2 });
    if (path.startsWith('search?')) return json({ page: 1, totalPages: 1, totalResults: 1, results: [{ ...movie(), mediaType: 'movie' }] });
    if (path === 'movie/123') return json(movie());
    if (path.startsWith('request?')) return json({ pageInfo: { results: stored ? 1 : 0 }, results: stored ? [stored] : [], serviceErrors: { radarr: [] } });
    if (path === 'service/radarr') return json([server()]);
    if (path === 'service/radarr/0') return json({ server: server(), profiles: [{ id: 42 }], rootFolders: [{ path: '/synthetic-root' }] });
    if (path === 'request' && options.method === 'POST') { stored = request(); return json(stored); }
    if (path === 'request/7') return json(stored ?? request());
    throw new Error('Unexpected endpoint');
  };
  const controller = createMovieRequestController({
    seerr: { baseUrl: 'http://seerr.invalid', apiKey: key, fetchImpl: fake, ...config }, clock,
    movieIntelligence: typeof mi === 'function' ? mi : () => mi,
    radarr: typeof arr === 'function' ? arr : () => arr,
  });
  return { ...controller, calls, posts: () => calls.filter(c => c.method === 'POST') };
}
const run = (h, input = { tmdb_id: 123 }, options = {}) => h.request_movie(input, options);

test('stable TMDb default is a requestable plan, exact action and sanitized audit', async () => {
  const h = harness(); const r = await run(h);
  assert.equal(r.decision, 'requestable'); assert.equal(r.audit.action, 'plan');
  assert.equal(r.audit.timestamp, clock().toISOString()); assert.equal(r.audit.mutation_attempted, false);
  assert.deepEqual(r.intended_action, { method: 'POST', endpoint: '/api/v1/request', body: { mediaType: 'movie', mediaId: 123, is4k: false } });
  assert.equal(h.posts().length, 0); assert.ok(!JSON.stringify(r).includes('/synthetic-root'));
  assert.ok(!JSON.stringify(r).includes(key));
});

test('unique exact title/year resolves to TMDb; title without year is blocked', async () => {
  const h = harness(); assert.equal((await run(h, { title: 'Fixture Movie', year: 2020 })).identity.tmdb_id, 123);
  assert.equal((await run(h, { title: 'Fixture Movie' })).decision, 'blocked'); assert.equal(h.posts().length, 0);
});

test('multiple/remake search hits are ambiguous; TV or fuzzy-only cannot authorize', async () => {
  for (const [results, expected] of [
    [[{ ...movie(), mediaType: 'movie' }, { ...movie(), id: 124, mediaType: 'movie' }], 'ambiguous'],
    [[{ ...movie(), mediaType: 'tv' }], 'blocked'],
    [[{ ...movie(), title: 'A Similar Film', originalTitle: 'A Similar Film', mediaType: 'movie' }], 'blocked'],
  ]) {
    const h = harness({ override: { 'search?query=Fixture%20Movie&page=1': { page: 1, totalPages: 1, totalResults: results.length, results } } });
    assert.equal((await run(h, { title: 'Fixture Movie', year: 2020 }, { execute: true })).decision, expected);
    assert.equal(h.posts().length, 0);
  }
});

test('title pagination is exhausted before unique selection; truncated results fail closed', async () => {
  const h = harness({ fetchOverride: path => {
    if (path.startsWith('search?')) return json({ page: path.endsWith('page=2') ? 2 : 1, totalPages: 2, totalResults: 2,
      results: [{ ...movie(), id: path.endsWith('page=2') ? 124 : 123, mediaType: 'movie' }] });
  } });
  assert.equal((await run(h, { title: 'Fixture Movie', year: 2020 })).decision, 'ambiguous');
  const truncated = harness({ override: { 'search?query=Fixture%20Movie&page=1': { page: 1, totalPages: 11, totalResults: 201, results: [] } } });
  assert.equal((await run(truncated, { title: 'Fixture Movie', year: 2020 })).decision, 'unresolved');
});

test('Radarr available and managed each prevent POST', async () => {
  for (const hasFile of [true, false]) {
    const row = radarrRecord({ id: 9, title: 'Fixture Movie', year: 2020, tmdbId: 123, hasFile }, new Map());
    const h = harness({ arr: [row] });
    assert.equal((await run(h, undefined, { execute: true })).decision, hasFile ? 'already_available' : 'already_managed');
    assert.equal(h.posts().length, 0);
  }
});

test('Seerr available/processing/blocklisted and request states all prevent mutation', async () => {
  for (const [mediaStatus, expected] of [[5, 'already_available'], [3, 'already_requested'], [6, 'blocked']]) {
    const h = harness({ override: { 'movie/123': { ...movie(), mediaInfo: { tmdbId: 123, mediaType: 'movie', status: mediaStatus, status4k: 1, requests: [] } } } });
    assert.equal((await run(h, undefined, { execute: true })).decision, expected); assert.equal(h.posts().length, 0);
  }
  for (const s of [1, 2, 3, 4, 5]) {
    const h = harness({ override: { 'request?take=100&skip=0&filter=all&mediaType=movie': { pageInfo: { results: 1 }, results: [{ ...request(), status: s }], serviceErrors: { radarr: [] } } } });
    assert.equal((await run(h, undefined, { execute: true })).decision, [3, 4].includes(s) ? 'blocked' : 'already_requested');
    assert.equal(h.posts().length, 0);
  }
});

test('explicit execution submits exactly one policy-free movie POST and verifies readback', async () => {
  const h = harness(); const r = await run(h, undefined, { execute: true });
  assert.equal(r.decision, 'requested'); assert.equal(r.request.tmdb_id, 123); assert.equal(r.audit.mutation_attempted, true);
  assert.equal(h.posts().length, 1);
  assert.deepEqual(JSON.parse(h.posts()[0].body), { mediaType: 'movie', mediaId: 123, is4k: false });
  assert.equal(h.posts()[0].path, 'request'); assert.ok(h.calls.some(c => c.path === 'request/7'));
  assert.equal((await run(h, undefined, { execute: true })).decision, 'already_requested'); assert.equal(h.posts().length, 1);
});

test('fresh preflight catches a request appearing after initial plan', async () => {
  let reads = 0;
  const h = harness({ fetchOverride: path => {
    if (path.startsWith('request?') && ++reads === 2) return json({ pageInfo: { results: 1 }, results: [request()], serviceErrors: { radarr: [] } });
  } });
  assert.equal((await run(h, undefined, { execute: true })).decision, 'already_requested'); assert.equal(h.posts().length, 0);
});

test('timeout after POST is unknown, no retry now or on same-controller replay', async () => {
  const h = harness({ fetchOverride: (path, options) => { if (options.method === 'POST') throw new Error(key); } });
  const r = await run(h, undefined, { execute: true });
  assert.equal(r.decision, 'unknown_after_submit'); assert.equal(r.audit.mutation_attempted, true); assert.ok(!JSON.stringify(r).includes(key));
  assert.equal((await run(h, undefined, { execute: true })).decision, 'unknown_after_submit'); assert.equal(h.posts().length, 1);
  const restart = harness(); assert.equal((await run(restart, undefined, { execute: true, previous_unknown: true })).decision, 'unknown_after_submit'); assert.equal(restart.posts().length, 0);
});

test('uncertain outcome can reconcile visible request into no-op, not resubmit', async () => {
  const h = harness({ override: { 'request?take=100&skip=0&filter=all&mediaType=movie': { pageInfo: { results: 1 }, results: [request()], serviceErrors: { radarr: [] } } } });
  assert.equal((await run(h, undefined, { execute: true, previous_unknown: true })).decision, 'already_requested'); assert.equal(h.posts().length, 0);
});

test('mismatched POST/readback identity or request ID fails closed after attempt', async () => {
  for (const path of ['request', 'request/7']) {
    const h = harness({ override: { [path]: { ...request(), media: { tmdbId: 999, mediaType: 'movie' } } } });
    assert.equal((await run(h, undefined, { execute: true })).decision, 'unknown_after_submit'); assert.equal(h.posts().length, 1);
  }
  const h = harness({ override: { 'request/7': { ...request(), id: 8 } } });
  assert.equal((await run(h, undefined, { execute: true })).decision, 'unknown_after_submit');
});

test('Movie Intelligence conflicts or source failures cannot authorize requests', async () => {
  const mi = intelligenceRecord({ id: 1, title: 'Fixture Movie', tmdb_id: 123, imdb_id: 'tt9999999' });
  for (const options of [{ mi: [mi] }, { arr: () => { throw new Error(key + '/private/path'); } }, { mi: () => { throw new Error(key); } }]) {
    const h = harness(options); const r = await run(h, undefined, { execute: true });
    assert.equal(r.decision, 'unresolved'); assert.equal(h.posts().length, 0);
    assert.ok(!JSON.stringify(r).includes(key)); assert.ok(!JSON.stringify(r).includes('/private/path'));
  }
});

test('watched/watchlist never grants execution or changes request body', async () => {
  const h = harness({ mi: [intelligenceRecord({ id: 1, title: 'Fixture Movie', tmdb_id: 123, watched: true, watchlist: true, personal_rating: 5 })] });
  assert.equal((await run(h)).decision, 'requestable'); assert.equal(h.posts().length, 0);
});

test('policy missing/ambiguous or invalid default profile/root blocks rather than guesses', async () => {
  for (const list of [[], [server(), { ...server(), id: 1 }], [{ ...server(), activeProfileId: null }], [{ ...server(), activeDirectory: '' }]]) {
    const h = harness({ override: { 'service/radarr': list } });
    assert.equal((await run(h, undefined, { execute: true })).reason, 'media_policy_dependency'); assert.equal(h.posts().length, 0);
  }
  const h = harness({ override: { 'service/radarr/0': { server: server(), profiles: [], rootFolders: [] } } });
  assert.equal((await run(h, undefined, { execute: true })).decision, 'blocked'); assert.equal(h.posts().length, 0);
});

test('unknown version/restricted visibility and unsafe query/options fail closed', async () => {
  for (const override of [{ 'auth/me': { permissions: 32 } }, { 'settings/about': { version: '4.0.0' } }]) {
    const h = harness({ override }); assert.equal((await run(h, undefined, { execute: true })).decision, 'blocked'); assert.equal(h.posts().length, 0);
  }
  const h = harness();
  assert.equal((await run(h, { tmdb_id: 123, mediaType: 'tv' }, { execute: true })).decision, 'blocked');
  assert.equal((await run(h, undefined, { execute: 'true' })).decision, 'blocked');
  assert.equal((await run(h, undefined, null)).audit.mutation_attempted, false);
  assert.equal(h.posts().length, 0);
});

test('Seerr unavailable, malformed, oversized and credential-echo responses are sanitized', async () => {
  for (const fetchOverride of [() => { throw new Error(key); }, () => new Response(key, { status: 500 }), () => new Response('{'),
    () => json({ version: key }), () => new Response(new Uint8Array(4 * 1024 * 1024 + 1))]) {
    const h = harness({ fetchOverride }); const r = await run(h, undefined, { execute: true });
    assert.equal(r.decision, 'unresolved'); assert.equal(h.posts().length, 0); assert.ok(!JSON.stringify(r).includes(key));
  }
});

test('URL credentials/query/fragment rejected and redirect never forwards key', async t => {
  for (const baseUrl of ['http://user:pass@seerr.invalid', 'http://seerr.invalid?key=secret', 'http://seerr.invalid#fragment', 'file:///tmp/a']) {
    const h = harness({ config: { baseUrl } }); assert.equal((await run(h)).decision, 'unresolved'); assert.equal(h.calls.length, 0);
  }
  const paths = [];
  const s = createServer((req, res) => { paths.push(req.url); res.writeHead(302, { Location: '/unexpected' }); res.end(); });
  await new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
  t.after(() => { s.closeAllConnections(); s.close(); });
  const h = harness({ config: { baseUrl: `http://127.0.0.1:${s.address().port}`, fetchImpl: fetch } });
  assert.equal((await run(h)).decision, 'unresolved'); assert.deepEqual(paths, ['/api/v1/settings/about']);
});

test('concurrent same-controller execute calls cannot both POST', async () => {
  const h = harness(); const r = await Promise.all([run(h, undefined, { execute: true }), run(h, undefined, { execute: true })]);
  assert.equal(h.posts().length, 1); assert.ok(r.some(x => x.reason === 'invocation_in_progress'));
});

test('CLI rejects credential arguments with sanitized audit and no raw input', () => {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL('../request-cli.mjs', import.meta.url)), '--api-key', key], { encoding: 'utf8' });
  assert.equal(r.status, 2); const output = JSON.parse(r.stdout);
  assert.equal(output.audit.mutation_attempted, false); assert.ok(!(r.stdout + r.stderr).includes(key));
});

test('plan_movie_request never mutates; completed receipt guards temporarily stale lists', async () => {
  const h = harness({ override: { 'request?take=100&skip=0&filter=all&mediaType=movie': { pageInfo: { results: 0 }, results: [], serviceErrors: { radarr: [] } } } });
  assert.equal((await h.plan_movie_request({ tmdb_id: 123 })).decision, 'requestable');
  assert.equal(h.posts().length, 0);
  assert.equal((await run(h, undefined, { execute: true })).decision, 'requested');
  assert.equal((await run(h, undefined, { execute: true })).reason, 'previous_request_confirmed');
  assert.equal(h.posts().length, 1);
});

test('request-list errors, truncation and identity mismatch never become requestable', async () => {
  for (const page of [
    { pageInfo: { results: 1 }, results: [], serviceErrors: { radarr: [] } },
    { pageInfo: { results: 0 }, results: [], serviceErrors: { radarr: [{ id: 0 }] } },
    { pageInfo: { results: 1001 }, results: [], serviceErrors: { radarr: [] } },
    { pageInfo: { results: 1 }, results: [{ ...request(), media: { tmdbId: 123, mediaType: 'tv' } }], serviceErrors: { radarr: [] } },
  ]) {
    const h = harness({ override: { 'request?take=100&skip=0&filter=all&mediaType=movie': page } });
    assert.equal((await run(h, undefined, { execute: true })).decision, 'unresolved'); assert.equal(h.posts().length, 0);
  }
});

test('Seerr movie endpoint identity mismatch and mismatched title/year stop before POST', async () => {
  const h = harness({ override: { 'movie/123': { ...movie(), id: 999 } } });
  assert.equal((await run(h, undefined, { execute: true })).decision, 'unresolved'); assert.equal(h.posts().length, 0);
  const other = harness();
  assert.equal((await run(other, { tmdb_id: 123, title: 'Other' }, { execute: true })).reason, 'resolved_identity_conflict');
  assert.equal(other.posts().length, 0);
});

test('POST redirect is unknown with no credential forwarding or automatic retry', async t => {
  const paths = [];
  const s = createServer((req, res) => { paths.push(req.url); res.writeHead(307, { Location: '/unexpected' }); res.end(); });
  await new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
  t.after(() => { s.closeAllConnections(); s.close(); });
  const h = harness({ fetchOverride: (path, options) => options.method === 'POST' ? fetch(`http://127.0.0.1:${s.address().port}/request`, options) : undefined });
  assert.equal((await run(h, undefined, { execute: true })).decision, 'unknown_after_submit');
  assert.deepEqual(paths, ['/request']); assert.equal(h.posts().length, 1);
});
