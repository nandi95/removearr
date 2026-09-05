import type { CommandToOutput, TautulliCommand } from '../types/tautulli';

function makeArrRequest(baseUrl: string, apiKey: string) {
    return async function arrRequest<T>(endpoint: string, init?: RequestInit): Promise<T> {
        const response = await fetch(`${baseUrl}/${endpoint}`, {
            ...init,
            headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json, text/plain' }
        });

        if (!response.ok) throw new Error(`${init?.method ?? 'GET'} ${baseUrl}/${endpoint} → ${response.status}`);

        // DELETE/PUT can respond with an empty body
        const text = await response.text();
        return (text ? JSON.parse(text) : undefined) as T;
    };
}

export const radarrRequest = makeArrRequest(config.radarrUrl, config.radarrApiKey);
export const sonarrRequest = makeArrRequest(config.sonarrUrl, config.sonarrApiKey);
export const seerrRequest = makeArrRequest(`${config.seerrUrl}/api/v1`, config.seerrApiKey);

/** @link https://github.com/Tautulli/Tautulli/wiki/Tautulli-API-Reference */
export async function tautulliRequest<CMD extends TautulliCommand>(
    cmd: CMD,
    params: Record<string, string> = {}
): Promise<CommandToOutput[CMD]> {
    const query = new URLSearchParams({ cmd, apikey: config.tautulliApiKey, ...params });
    const response = await fetch(`${config.tautulliUrl}?${query}`);
    const body = await response.json();

    if (body.response.result !== 'success') throw new Error(body.response.message ?? `Failed to fetch ${cmd}`);

    return body.response.data;
}
