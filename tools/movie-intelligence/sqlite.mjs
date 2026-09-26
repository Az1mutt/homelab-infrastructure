import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { intelligenceRecord } from './model.mjs';
import { readNormalizedMovieIntelligence } from './sqlite-normalized.mjs';

export const defaultMapping = Object.freeze({
  table: 'movies',
  columns: Object.freeze(Object.fromEntries([
    'id', 'title', 'original_title', 'year', 'tmdb_id', 'imdb_id', 'csfd_id',
    'watched', 'watchlist', 'personal_rating', 'watched_at', 'rated_at',
  ].map(name => [name, name]))),
});

function identifier(name) {
  if (typeof name !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error('invalid_mapping');
  return `"${name}"`;
}

// Returns data only: callers never receive a database handle or SQL interface.
export function readMovieIntelligence({ dbPath, mapping = defaultMapping, schemaMode = 'single-table' } = {}) {
  let db;
  try {
    if (schemaMode === 'normalized') {
      if (mapping !== defaultMapping) throw new Error('incompatible_mapping');
      return readNormalizedMovieIntelligence({ dbPath });
    }
    if (schemaMode !== 'single-table') throw new Error('invalid_schema_mode');
    if (typeof dbPath !== 'string' || !dbPath || dbPath === ':memory:') throw new Error('invalid_path');
    const table = identifier(mapping.table);
    const columns = mapping.columns;
    if (!columns || Object.keys(columns).some(k => !(k in defaultMapping.columns))) throw new Error('invalid_mapping');
    db = new DatabaseSync(resolve(dbPath), { readOnly: true, allowExtension: false, defensive: true, timeout: 3000 });
    // No schema migrations, journal-mode changes, or user-supplied SQL.
    const actual = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name));
    const projection = Object.keys(defaultMapping.columns).map(field => {
      const column = columns[field];
      if (column != null) identifier(column);
      if (column == null || !actual.has(column)) {
        if (['id', 'title'].includes(field) || (mapping !== defaultMapping && column != null)) throw new Error('schema_mismatch');
        return `NULL AS ${identifier(field)}`;
      }
      return `${identifier(column)} AS ${identifier(field)}`;
    });
    const rows = db.prepare(`SELECT ${projection.join(', ')} FROM ${table} LIMIT 100001`).all();
    if (rows.length > 100000) throw new Error('source_too_large');
    return rows.map(intelligenceRecord);
  } catch {
    // SQLite errors may include private paths/schema details. Keep them out of the contract.
    throw new Error('movie_intelligence_unavailable');
  } finally { db?.close(); }
}
