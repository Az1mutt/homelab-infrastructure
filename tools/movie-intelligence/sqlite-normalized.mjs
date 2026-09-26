import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { intelligenceRecord, positiveId, imdbId } from './model.mjs';

// One statement gives a consistent WAL snapshot. No caller-supplied SQL or aggregation
// that could silently pick one of several conflicting external identifiers.
const query = `
  SELECT m.id, m.title, m.original_title, m.year,
         u.movie_id AS user_movie_id, u.watched, u.watchlist,
         u.my_rating AS personal_rating, u.watched_at,
         e.source, e.external_id
  FROM movies AS m
  LEFT JOIN user_movies AS u ON u.movie_id = m.id
  LEFT JOIN external_ids AS e ON e.movie_id = m.id
  ORDER BY m.id
  LIMIT 400001
`;

export function readNormalizedMovieIntelligence({ dbPath } = {}) {
  let db;
  try {
    if (typeof dbPath !== 'string' || !dbPath || dbPath === ':memory:') throw new Error('invalid_path');
    db = new DatabaseSync(resolve(dbPath), { readOnly: true, allowExtension: false, defensive: true, timeout: 3000 });
    const movies = new Map();
    const owners = new Map();
    let count = 0;
    for (const row of db.prepare(query).iterate()) {
      if (++count > 400000) throw new Error('source_too_large');
      if (!movies.has(row.id)) {
        if (movies.size >= 100000) throw new Error('source_too_large');
        // No user row means unknown, not false. No rated_at exists in this schema.
        if (row.user_movie_id !== null && (row.watched === null || row.watchlist === null)) throw new Error('invalid_data');
        movies.set(row.id, intelligenceRecord({ ...row, rated_at: null }));
      }
      if (!['csfd', 'tmdb', 'imdb'].includes(row.source)) continue;
      // Empty/null IDs in existing rows are malformed; an absent row is different.
      if (typeof row.external_id !== 'string') throw new Error('invalid_data');
      const id = row.source === 'imdb' ? imdbId(row.external_id) : positiveId(row.external_id);
      if (id === null) throw new Error('invalid_data');
      const movie = movies.get(row.id);
      if (movie.external_ids[row.source] !== null) throw new Error('duplicate_namespace');
      const key = `${row.source}:${id}`;
      if (owners.has(key) && owners.get(key) !== row.id) throw new Error('conflicting_identity');
      owners.set(key, row.id);
      movie.external_ids[row.source] = id;
    }
    return [...movies.values()];
  } catch {
    throw new Error('movie_intelligence_unavailable');
  } finally { db?.close(); }
}
