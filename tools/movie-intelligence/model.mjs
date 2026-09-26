// Only allowlisted fields cross the adapter boundary; never return raw API rows.
export function positiveId(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error('invalid_data');
  return n;
}

export function text(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new Error('invalid_data');
  return value.trim() || null;
}

export function imdbId(value) {
  const id = text(value)?.toLowerCase() ?? null;
  if (id !== null && !/^tt\d{7,10}$/.test(id)) throw new Error('invalid_data');
  return id;
}

export function boolean(value) {
  if (value === null || value === undefined) return null;
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  throw new Error('invalid_data');
}

export function year(value) {
  const n = positiveId(value);
  if (n !== null && (n < 1800 || n > 9999)) throw new Error('invalid_data');
  return n;
}

export function identity(row) {
  return {
    title: text(row.title), original_title: text(row.original_title), year: year(row.year),
    external_ids: { tmdb: positiveId(row.tmdb_id), imdb: imdbId(row.imdb_id), csfd: positiveId(row.csfd_id) },
  };
}

export function intelligenceRecord(row) {
  const rating = row.personal_rating ?? null;
  if (rating !== null && (typeof rating !== 'number' || !Number.isFinite(rating))) throw new Error('invalid_data');
  const result = {
    id: positiveId(row.id), ...identity(row), watched: boolean(row.watched), watchlist: boolean(row.watchlist),
    personal_rating: rating, watched_at: text(row.watched_at), rated_at: text(row.rated_at),
  };
  if (!result.id || !result.title) throw new Error('invalid_data');
  return result;
}

export function radarrRecord(row, profiles) {
  const profileId = positiveId(row.qualityProfileId);
  const result = {
    id: positiveId(row.id),
    ...identity({ ...row, original_title: row.originalTitle, tmdb_id: row.tmdbId, imdb_id: row.imdbId }),
    monitored: boolean(row.monitored), has_file: boolean(row.hasFile), status: text(row.status),
    quality_profile: { id: profileId, name: profiles.get(profileId) ?? null },
  };
  if (!result.id || !result.title) throw new Error('invalid_data');
  return result;
}

export function normalizeTitle(value) {
  return value?.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
}

export function normalizeQuery(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_query');
  if (Object.keys(input).some(k => !['title', 'year', 'tmdb_id', 'imdb_id', 'csfd_id'].includes(k))) throw new Error('invalid_query');
  try {
    const q = identity(input);
    delete q.original_title;
    if (!q.title && !Object.values(q.external_ids).some(Boolean)) throw new Error('invalid_query');
    return q;
  } catch { throw new Error('invalid_query'); }
}
