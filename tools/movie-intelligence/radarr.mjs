import { positiveId, text, radarrRecord } from './model.mjs';

export async function readRadarr({ baseUrl, apiKey, timeoutMs = 10000, fetchImpl = fetch } = {}) {
  try {
    const base = new URL(baseUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('invalid_config');
    if (typeof apiKey !== 'string' || !apiKey.trim() || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new Error('invalid_config');
    base.pathname = base.pathname.replace(/\/$/, '') + '/';
    async function get(endpoint) {
      const response = await fetchImpl(new URL(`api/v3/${endpoint}`, base), {
        method: 'GET', headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
        redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error('api_failure');
      // Limit bytes as well as records; do not echo upstream response bodies/errors.
      let size = 0;
      const chunks = [];
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > 32 * 1024 * 1024) throw new Error('source_too_large');
        chunks.push(chunk);
      }
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!Array.isArray(data) || data.length > 100000) throw new Error('invalid_response');
      return data;
    }
    const movies = await get('movie');
    const profiles = new Map((await get('qualityprofile')).map(p => [positiveId(p.id), text(p.name)]));
    const records = movies.map(row => radarrRecord(row, profiles));
    // Fail closed even if an upstream service echoes the header into a selected field.
    if (JSON.stringify(records).includes(apiKey)) throw new Error('credential_echo');
    return records;
  } catch { throw new Error('radarr_unavailable'); }
}
