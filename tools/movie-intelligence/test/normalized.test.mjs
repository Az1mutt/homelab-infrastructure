import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readMovieIntelligence } from '../sqlite.mjs';
import { get_movie_status } from '../get_movie_status.mjs';
import { fixtureAdapters } from '../fixtures.mjs';

const schema = readFileSync(new URL('../fixtures/normalized-schema.sql', import.meta.url), 'utf8');
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'mi-normalized-'));
  const path = join(dir, 'fixture.sqlite');
  const db = new DatabaseSync(path);
  db.exec(schema);
  t.after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });
  const movie = (id, title = 'Fixture', year = 2024) => db.prepare('INSERT INTO movies (id,title,year) VALUES (?,?,?)').run(id, title, year);
  const external = (id, source, value) => db.prepare('INSERT INTO external_ids (movie_id,source,external_id) VALUES (?,?,?)').run(id, source, value);
  const read = () => readMovieIntelligence({ dbPath: path, schemaMode: 'normalized' });
  return { dir, path, db, movie, external, read };
}

test('normalized Heretik: ČSFD-only, my_rating and honest date semantics', async t => {
  const f = setup(t); f.movie(1, 'Heretik'); f.external(1, 'csfd', '900001');
  f.db.exec("UPDATE movies SET original_title='Heretic' WHERE id=1; INSERT INTO user_movies VALUES (1,1,0,4,'2025-02-02','2025-01-01','2025-03-03');");
  const r = await get_movie_status({ title: 'Heretik', year: 2024 }, { movieIntelligence: f.read, radarr: () => [] });
  assert.equal(r.summary.state, 'single_source_only');
  const [m] = r.sources.movie_intelligence.candidates;
  assert.deepEqual(m, { id: 1, title: 'Heretik', original_title: 'Heretic', year: 2024, external_ids: { tmdb: null, imdb: null, csfd: 900001 }, watched: true, watchlist: false, personal_rating: 4, watched_at: '2025-01-01', rated_at: null });
  assert.ok(!JSON.stringify(m).includes('2025-02-02'));
});

test('normalized Scarface pivots three TEXT namespaces and confirms existing Radarr fixture', async t => {
  const f = setup(t); f.movie(1, 'Scarface', 1983);
  f.external(1, 'tmdb', '111'); f.external(1, 'imdb', 'tt0086250'); f.external(1, 'csfd', '900002');
  const r = await get_movie_status({ tmdb_id: 111 }, { movieIntelligence: f.read, radarr: fixtureAdapters().radarr });
  assert.equal(r.summary.state, 'confirmed_match'); assert.equal(r.summary.matched_by, 'tmdb');
  assert.deepEqual(r.sources.movie_intelligence.candidates[0].external_ids, { tmdb: 111, imdb: 'tt0086250', csfd: 900002 });
});

test('no user row differs from actual default 0/0; absent IDs remain null', t => {
  const f = setup(t); f.movie(1); f.movie(2);
  f.db.exec('INSERT INTO user_movies (movie_id) VALUES (2)');
  const [a,b] = f.read();
  assert.equal(a.watched, null); assert.equal(a.watchlist, null); assert.equal(a.personal_rating, null);
  assert.equal(b.watched, false); assert.equal(b.watchlist, false);
  assert.deepEqual(a.external_ids, { tmdb: null, imdb: null, csfd: null });
  assert.equal(a.rated_at, null); assert.equal(a.watched_at, null);
});

test('malformed supported IDs fail safely without echoing rows', t => {
  const f = setup(t); f.movie(1);
  for (const [source, value] of [['tmdb',''],['tmdb','0'],['tmdb','1.1'],['tmdb','9007199254740992'],['csfd','secret-invalid-fixture'],['imdb','111']]) {
    f.external(1, source, value);
    assert.throws(f.read, { message: 'movie_intelligence_unavailable' });
    f.db.exec('DELETE FROM external_ids');
  }
});

test('canonical ID collisions across movies fail closed despite distinct TEXT keys', t => {
  const f = setup(t); f.movie(1); f.movie(2);
  for (const [source,a,b] of [['tmdb','111','0111'],['imdb','tt0086250','TT0086250'],['csfd','12','012']]) {
    f.external(1,source,a); f.external(2,source,b);
    assert.throws(f.read, /movie_intelligence_unavailable/);
    f.db.exec('DELETE FROM external_ids');
  }
});

test('exact fixture constraints reject duplicate namespaces and duplicate ownership', t => {
  const f = setup(t); f.movie(1); f.movie(2); f.external(1,'tmdb','111');
  assert.throws(() => f.external(1,'tmdb','222'), /UNIQUE/);
  assert.throws(() => f.external(2,'tmdb','111'), /UNIQUE/);
  assert.equal(f.read().length, 2);
});

test('cross-source conflicting IMDb preserves unresolved identity rule', async t => {
  const f = setup(t); f.movie(1,'Scarface',1983); f.external(1,'tmdb','111'); f.external(1,'imdb','tt0023427');
  const r = await get_movie_status({ tmdb_id:111 }, { movieIntelligence:f.read, radarr:fixtureAdapters().radarr });
  assert.equal(r.summary.state,'unresolved'); assert.equal(r.summary.reason,'source_identity_conflict');
});

test('unknown namespaces are ignored without deriving IDs from URLs', t => {
  const f = setup(t); f.movie(1); f.external(1,'future-source','arbitrary-text');
  assert.deepEqual(f.read()[0].external_ids, { tmdb:null, imdb:null, csfd:null });
});

test('fixed mode rejects mapping/unknown modes and missing database', t => {
  const f = setup(t);
  assert.throws(() => readMovieIntelligence({ dbPath:f.path, schemaMode:'guess' }), /unavailable/);
  assert.throws(() => readMovieIntelligence({ dbPath:f.path, schemaMode:'normalized', mapping:{ table:'movies',columns:{} } }), /unavailable/);
  const missing=join(f.dir,'absent.sqlite');
  assert.throws(() => readMovieIntelligence({ dbPath:missing, schemaMode:'normalized' }), /unavailable/);
  assert.equal(existsSync(missing),false);
});

test('normalized read is nonmutating and sees committed WAL data', t => {
  const f = setup(t); f.movie(1);
  const before=readFileSync(f.path), files=readdirSync(f.dir);
  f.read(); assert.deepEqual(readFileSync(f.path),before); assert.deepEqual(readdirSync(f.dir),files);
  const ro=new DatabaseSync(f.path,{readOnly:true,defensive:true,allowExtension:false});
  try { assert.throws(() => ro.exec('DELETE FROM movies'), /readonly/i); } finally { ro.close(); }
  f.db.exec('PRAGMA journal_mode=WAL'); f.external(1,'tmdb','111');
  const wal=readFileSync(f.path+'-wal');
  assert.equal(f.read()[0].external_ids.tmdb,111);
  assert.deepEqual(readFileSync(f.path+'-wal'),wal);
  assert.equal(f.db.prepare('PRAGMA journal_mode').get().journal_mode,'wal');
});

test('CLI selects normalized schema explicitly; fixture mode still ignores config', t => {
  const f=setup(t); f.movie(1,'Heretik'); f.external(1,'csfd','900001');
  const env={...process.env,MOVIE_DB_PATH:f.path,MOVIE_DB_SCHEMA_MODE:'normalized',RADARR_BASE_URL:'invalid',RADARR_API_KEY:'fixture-only'};
  delete env.MOVIE_DB_MAPPING_PATH;
  const run=args=>spawnSync(process.execPath,[fileURLToPath(new URL('../cli.mjs',import.meta.url)),...args],{env,encoding:'utf8'});
  const r=run(['--title','Heretik']); assert.equal(r.status,2);
  assert.equal(JSON.parse(r.stdout).sources.movie_intelligence.candidates[0].external_ids.csfd,900001);
  env.MOVIE_DB_SCHEMA_MODE='invalid';
  assert.equal(run(['--fixtures','--tmdb-id','111']).status,0);
});
