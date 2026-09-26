import { normalizeQuery, normalizeTitle } from './model.mjs';

const namespaces = ['tmdb', 'imdb', 'csfd'];
function shared(a, b) {
  return namespaces.filter(k => a.external_ids[k] != null && a.external_ids[k] === b.external_ids[k]);
}
function conflict(a, b) {
  return namespaces.some(k => a.external_ids[k] != null && b.external_ids[k] != null && a.external_ids[k] !== b.external_ids[k]);
}
function differentYear(a, b) { return a.year != null && b.year != null && a.year !== b.year; }

// Each adapter supplies a normalized library snapshot; errors remain source-separated.
export async function get_movie_status(input, { movieIntelligence, radarr }) {
  const query = normalizeQuery(input);
  const results = await Promise.allSettled([Promise.resolve().then(movieIntelligence), Promise.resolve().then(radarr)]);
  const libraries = results.map(r => r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : null);
  const byId = Object.values(query.external_ids).some(v => v !== null);
  const matches = r => byId ? shared(query, r).length > 0 :
    [r.title, r.original_title].some(t => normalizeTitle(t) === normalizeTitle(query.title)) && !differentYear(query, r);
  const selected = libraries.map(rows => new Set((rows ?? []).filter(matches)));

  // Expand across sources by stable ID, so translated titles still join. Never expand by title.
  let changed;
  do {
    changed = false;
    for (let i = 0; i < 2; i++) {
      for (const row of libraries[i] ?? []) {
        if (!selected[i].has(row) && [...selected[1 - i]].some(other => shared(row, other).length)) {
          selected[i].add(row); changed = true;
        }
      }
    }
  } while (changed);
  const candidates = selected.map(s => [...s].sort((a, b) => a.id - b.id));
  const all = candidates.flat();
  const sources = Object.fromEntries(['movie_intelligence', 'radarr'].map((name, i) => [name, {
    status: libraries[i] === null ? 'error' : 'ok',
    error: libraries[i] === null ? `${name}_unavailable` : null,
    candidates: candidates[i],
  }]));
  let state, reason, matchedBy = null;
  const [a, b] = candidates.map(rows => rows[0]);
  if (libraries.some(rows => rows === null)) { state = 'unresolved'; reason = 'source_unavailable'; }
  else if (all.some(row => conflict(query, row) || (byId && differentYear(query, row)))) {
    state = 'unresolved'; reason = 'query_identity_conflict';
  } else if (candidates.some(rows => rows.length > 1)) { state = 'ambiguous'; reason = 'multiple_candidates'; }
  else if (!all.length) { state = 'not_found'; reason = 'no_candidates'; }
  else if (!a || !b) { state = 'single_source_only'; reason = byId ? 'stable_id_in_one_source' : 'title_candidate_in_one_source'; }
  else if (conflict(a, b) || differentYear(a, b)) { state = 'unresolved'; reason = 'source_identity_conflict'; }
  else if (shared(a, b).length) { state = 'confirmed_match'; reason = 'shared_external_id'; matchedBy = shared(a, b)[0]; }
  else { state = 'unresolved'; reason = 'no_shared_external_id'; }
  return {
    contract_version: '0.1', query, sources,
    summary: { state, reason, matched_by: matchedBy },
    identity: {
      // Reserved enrichment boundary. No synthetic ID or title-only merge.
      external_ids: state === 'confirmed_match' ? Object.fromEntries(namespaces.map(k => [k, a.external_ids[k] ?? b.external_ids[k]])) : null,
      enrichment: { status: 'not_requested' },
    },
  };
}
