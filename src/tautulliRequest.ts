import config from "./constants/config.ts";
import {CommandToOutput, TautulliCommand} from "./constants/types.ts";

/**
 * @link [Tautulli API](https://github.com/Tautulli/Tautulli/wiki/Tautulli-API-Reference)
 */
async function tautulliRequest<CMD extends TautulliCommand>(
    cmd: CMD,
    init?: Omit<RequestInit, 'body'> & { body?: Record<string, string> | string }
): Promise<CommandToOutput[CMD]> {
    const isGet = !init?.method || init.method === 'GET';
    const params = new URLSearchParams({ cmd, apikey: config.apiKey });

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
        config.url + '?' + params.toString(),
        init as RequestInit
    )
        .then(async response => {
            return await response.json()
        })
        .then(resp => {
            if (resp.response.result !== 'success') {
                throw new Error('Failed to fetch ' + cmd);
            }

            return resp.response.data;
        });
}

// async function paginatedRequest<CMD extends TautulliCommand>(
//     cmd: CMD,
//     init?: Omit<RequestInit, 'body'> & { body?: Record<string, string> | string }
// ): Promise<CMD[]> {
//     let page = 1;
//     let data = await tautulliRequest(cmd, { ...init, body: { ...init?.body, page: page.toString() } });
//
//     return;
// }

export default tautulliRequest;
// export { paginatedRequest };
