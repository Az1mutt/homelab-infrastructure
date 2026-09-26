import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { readMovieIntelligence } from '../sqlite.mjs';
import { readRadarr } from '../radarr.mjs';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/library.json', import.meta.url)));
const key = 'fixture-only-not-a-real-credential';
const config = { baseUrl: 'http://radarr.invalid/base/', apiKey: key };
const response = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

function database(t, sql) {
  const dir = mkdtempSync(join(tmpdir(), 'movie-intelligence-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'fixture.sqlite');
  const db = new DatabaseSync(path);
  db.exec(sql); db.close();
  return { dir, path };
}

test('SQLite reads personal state, preserves unknowns and does not alter the DB', t => {
  const { dir, path } = database(t, `CREATE TABLE movies (id INTEGER, title TEXT, original_title TEXT, year INTEGER, watched INTEGER, watchlist INTEGER, personal_rating REAL, watched_at TEXT, rated_at TEXT, tmdb_id INTEGER, imdb_id TEXT, csfd_id INTEGER);
    INSERT INTO movies VALUES (1, 'Heretik', 'Heretic', 2024, 1, 0, 4, '2025-01-01', '2025-01-02', NULL, NULL, 900001);`);
  const hash = () => createHash('sha256').update(readFileSync(path)).digest('hex');
  const before = hash(), files = readdirSync(dir);
  const [row] = readMovieIntelligence({ dbPath: path });
  assert.equal(row.watched, true); assert.equal(row.watchlist, false);
  assert.equal(row.personal_rating, 4); assert.equal(row.external_ids.tmdb, null);
  assert.equal(row.watched_at, '2025-01-01');
  assert.equal(hash(), before); assert.deepEqual(readdirSync(dir), files);
  // Exercise the same runtime readOnly option against an attempted write.
  const ro = new DatabaseSync(path, { readOnly: true });
  try { assert.throws(() => ro.exec('DELETE FROM movies'), /readonly/i); } finally { ro.close(); }
});

test('SQLite explicit identifier mapping supports a different schema without SQL input', t => {
  const { path } = database(t, `CREATE TABLE films (movie_id INTEGER, name TEXT, seen INTEGER); INSERT INTO films VALUES (7, 'Mapped', 0);`);
  const mapping = { table: 'films', columns: { id: 'movie_id', title: 'name', watched: 'seen' } };
  const [row] = readMovieIntelligence({ dbPath: path, mapping });
  assert.equal(row.id, 7); assert.equal(row.watched, false); assert.equal(row.watchlist, null);
  assert.throws(() => readMovieIntelligence({ dbPath: path, mapping: { ...mapping, table: 'films; DELETE FROM films' } }), /unavailable/);
  assert.throws(() => readMovieIntelligence({ dbPath: path, mapping: { table: 'films', columns: { id: 'movie_id', title: 'missing' } } }), /unavailable/);
});

test('missing DB is not created; schema/invalid data failures do not leak paths', t => {
  const { dir, path } = database(t, `CREATE TABLE unrelated (id INTEGER);`);
  const missing = join(dir, 'missing.sqlite');
  assert.throws(() => readMovieIntelligence({ dbPath: missing }), { message: 'movie_intelligence_unavailable' });
  assert.equal(existsSync(missing), false);
  assert.throws(() => readMovieIntelligence({ dbPath: path }), { message: 'movie_intelligence_unavailable' });
});

test('SQLite sees committed WAL rows without immutable mode or journal changes', t => {
  const { path } = database(t, 'CREATE TABLE movies (id INTEGER, title TEXT);');
  const writer = new DatabaseSync(path);
  try {
    writer.exec("PRAGMA journal_mode=WAL; INSERT INTO movies VALUES (1, 'WAL Fixture');");
    assert.equal(readMovieIntelligence({ dbPath: path })[0].title, 'WAL Fixture');
    assert.equal(writer.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
  } finally { writer.close(); }
});

test('Radarr adapter uses only fixed GET routes, header auth and blocks redirects', async () => {
  const calls = [];
  const rows = await readRadarr({ ...config, fetchImpl: async (url, options) => {
    calls.push({ url: String(url), options });
    return response(calls.length === 1 ? fixture.radarr : fixture.profiles);
  } });
  assert.deepEqual(calls.map(c => c.url), ['http://radarr.invalid/base/api/v3/movie', 'http://radarr.invalid/base/api/v3/qualityprofile']);
  for (const c of calls) {
    assert.equal(c.options.method, 'GET'); assert.equal(c.options.redirect, 'error');
    assert.equal(c.options.headers['X-Api-Key'], key); assert.equal(c.options.body, undefined);
    assert.ok(!c.url.includes(key));
  }
  assert.equal(rows[0].quality_profile.name, 'UHD Bluray + WEB');
  assert.equal(rows[0].status, 'released');
  assert.ok(!JSON.stringify(rows).includes(key));
});

test('Radarr errors, malformed data and credential echoes are sanitized', async () => {
  for (const fetchImpl of [
    async () => { throw new Error(key); },
    async () => new Response(key, { status: 401 }),
    async () => new Response('not JSON ' + key),
    async () => response({ error: key }),
    async url => response(String(url).endsWith('/movie') ? [{ ...fixture.radarr[0], title: key }] : fixture.profiles),
    async url => response(String(url).endsWith('/movie') ? [{ ...fixture.radarr[0], monitored: 'false' }] : fixture.profiles),
  ]) {
    await assert.rejects(readRadarr({ ...config, fetchImpl }), { message: 'radarr_unavailable' });
  }
});

test('Radarr rejects credentials in URLs and invalid schemes before HTTP', async () => {
  for (const baseUrl of ['file:///tmp/test', 'http://user:pass@radarr.invalid', 'http://radarr.invalid/?apikey=secret']) {
    await assert.rejects(readRadarr({ ...config, baseUrl, fetchImpl: () => assert.fail() }), /unavailable/);
  }
});

test('Radarr oversized responses and libraries fail rather than reporting absence', async () => {
  await assert.rejects(readRadarr({ ...config, fetchImpl: async () => new Response(new Uint8Array(32 * 1024 * 1024 + 1)) }), /unavailable/);
  await assert.rejects(readRadarr({ ...config, fetchImpl: async () => response(Array(100001).fill(null)) }), /unavailable/);
});

test('Radarr unknown profile and flags stay null, not false', async () => {
  const [row] = await readRadarr({ ...config, fetchImpl: async url => response(String(url).endsWith('/movie') ? [{ id: 1, title: 'Unknown', qualityProfileId: 99 }] : []) });
  assert.equal(row.has_file, null); assert.equal(row.monitored, null);
  assert.deepEqual(row.quality_profile, { id: 99, name: null });
});

test('real HTTP redirect and timeout never forward the credential', async t => {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push(req.url);
    if (req.url.startsWith('/slow/')) return;
    res.writeHead(302, { Location: '/unexpected' }); res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  await assert.rejects(readRadarr({ baseUrl, apiKey: key }), /unavailable/);
  assert.deepEqual(requests, ['/api/v3/movie']);
  await assert.rejects(readRadarr({ baseUrl: baseUrl + '/slow', apiKey: key, timeoutMs: 30 }), /unavailable/);
});

test('fixture CLI runs without DB or network; source errors have nonzero exit', () => {
  const cli = new URL('../cli.mjs', import.meta.url);
  const env = { ...process.env, MOVIE_DB_PATH: 'nonexistent-fixture', RADARR_BASE_URL: 'invalid', RADARR_API_KEY: key };
  const run = args => spawnSync(process.execPath, [fileURLToPath(cli), ...args], { env, encoding: 'utf8' });
  const fixtureRun = run(['--fixtures', '--tmdb-id', '111']);
  assert.equal(fixtureRun.status, 0, fixtureRun.stderr);
  assert.equal(JSON.parse(fixtureRun.stdout).summary.state, 'confirmed_match');
  const failed = run(['--tmdb-id', '111']);
  assert.equal(failed.status, 2);
  assert.equal(JSON.parse(failed.stdout).summary.state, 'unresolved');
  assert.ok(!(failed.stdout + failed.stderr).includes(key));
  assert.ok(!failed.stderr.includes('nonexistent-fixture'));
});
