import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { readMovieIntelligence } from './sqlite.mjs';
import { readRadarr } from './radarr.mjs';
import { createMovieRequestController } from './seerr-request.mjs';

try {
  const { values } = parseArgs({ options: {
    title: { type: 'string' }, year: { type: 'string' }, 'tmdb-id': { type: 'string' },
    execute: { type: 'boolean' }, 'previous-unknown': { type: 'boolean' },
  }, strict: true, allowPositionals: false });
  const controller = createMovieRequestController({
    seerr: { baseUrl: process.env.SEERR_BASE_URL, apiKey: process.env.SEERR_API_KEY },
    movieIntelligence: () => readMovieIntelligence({ dbPath: process.env.MOVIE_DB_PATH,
      schemaMode: process.env.MOVIE_DB_SCHEMA_MODE ?? 'normalized',
      mapping: process.env.MOVIE_DB_MAPPING_PATH ? JSON.parse(readFileSync(process.env.MOVIE_DB_MAPPING_PATH, 'utf8')) : undefined }),
    radarr: () => readRadarr({ baseUrl: process.env.RADARR_BASE_URL, apiKey: process.env.RADARR_API_KEY }),
  });
  const query = Object.fromEntries(Object.entries(values).filter(([k]) => !['execute', 'previous-unknown'].includes(k)).map(([k, v]) => [k.replaceAll('-', '_'), v]));
  const result = await controller.request_movie(query, { execute: values.execute ?? false, previous_unknown: values['previous-unknown'] ?? false });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (['blocked', 'ambiguous', 'unresolved', 'unknown_after_submit'].includes(result.decision)) process.exitCode = 2;
} catch {
  process.stdout.write(JSON.stringify({ contract_version: '0.1', decision: 'blocked', reason: 'invalid_arguments',
    audit: { contract_version: '0.1', timestamp: new Date().toISOString(), action: 'blocked', tmdb_id: null,
      decision: 'blocked', reason: 'invalid_arguments', mutation_attempted: false, request_id: null, request_status: null } }) + '\n');
  process.exitCode = 2;
}
