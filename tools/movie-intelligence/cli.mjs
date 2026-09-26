import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { get_movie_status } from './get_movie_status.mjs';
import { readMovieIntelligence } from './sqlite.mjs';
import { readRadarr } from './radarr.mjs';
import { fixtureAdapters } from './fixtures.mjs';

try {
  const { values } = parseArgs({ options: {
    fixtures: { type: 'boolean' }, title: { type: 'string' }, year: { type: 'string' },
    'tmdb-id': { type: 'string' }, 'imdb-id': { type: 'string' }, 'csfd-id': { type: 'string' },
  }, allowPositionals: false, strict: true });
  const query = Object.fromEntries(Object.entries(values).filter(([key]) => key !== 'fixtures').map(([key, value]) => [key.replaceAll('-', '_'), value]));
  // Fixture mode never reads environment configuration or contacts any service.
  const adapters = values.fixtures ? fixtureAdapters() : {
    movieIntelligence: () => readMovieIntelligence({
      dbPath: process.env.MOVIE_DB_PATH,
      mapping: process.env.MOVIE_DB_MAPPING_PATH ? JSON.parse(readFileSync(process.env.MOVIE_DB_MAPPING_PATH, 'utf8')) : undefined,
    }),
    radarr: () => readRadarr({ baseUrl: process.env.RADARR_BASE_URL, apiKey: process.env.RADARR_API_KEY }),
  };
  const result = await get_movie_status(query, adapters);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (Object.values(result.sources).some(s => s.status === 'error')) process.exitCode = 2;
} catch {
  // Do not print input, paths, credentials, response bodies or exception stacks.
  process.stderr.write('{"error":"invalid_query_or_configuration"}\n');
  process.exitCode = 2;
}
