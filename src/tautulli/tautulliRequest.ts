import config from "../utils/config.ts";
import { CommandToOutput, TautulliCommand } from "../constants/tautulliTypes.ts";

/**
 * @link [Tautulli API](https://github.com/Tautulli/Tautulli/wiki/Tautulli-API-Reference)
 */
async function tautulliRequest<CMD extends TautulliCommand>(
    cmd: CMD,
    init?: Omit<RequestInit, 'body'> & { body?: Record<string, string> | string }
): Promise<CommandToOutput[CMD]> {
    const isGet = !init?.method || init.method === 'GET';
    const params = new URLSearchParams({ cmd, apikey: config.tautulliApiKey });

    if (init?.body) {
        if (isGet) {
            for (const [key, value] of Object.entries(init.body)) {
                params.append(key, value);
            }

            delete init.body;
        } else {
            init.body = JSON.stringify(init.body);
        }
    }

    return await fetch(
        config.tautulliUrl + '?' + params.toString(),
        init as RequestInit
    )
        .then(async response => {
            return await response.json()
        })
        .then(resp => {
            if (resp.response.result !== 'success') {
                throw new Error(resp.response.message ?? 'Failed to fetch ' + cmd);
            }

            return resp.response.data;
        });
}

export default tautulliRequest;
