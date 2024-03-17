import config from "../constants/config.ts";
import {ApiMap} from "../constants/radarrTypes.ts";

export default async function radarrRequest<K extends keyof ApiMap>(endpoint: K): Promise<ApiMap[K]> {
    return await fetch(
        config.radarrUrl + '/' + endpoint,
        {
            headers: new Headers({
                "X-Api-Key": config.radarrApiKey,
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain",
            })
        }
    ).then(response => response.json());
}
