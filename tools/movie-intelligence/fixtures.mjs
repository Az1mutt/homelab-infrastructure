import { readFileSync } from 'node:fs';
import { intelligenceRecord, radarrRecord } from './model.mjs';

// Public synthetic data, not an export of the personal media database.
export function fixtureAdapters() {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/library.json', import.meta.url), 'utf8'));
  const profiles = new Map(fixture.profiles.map(p => [p.id, p.name]));
  return {
    movieIntelligence: () => fixture.movie_intelligence.map(intelligenceRecord),
    radarr: () => fixture.radarr.map(r => radarrRecord(r, profiles)),
  };
}
