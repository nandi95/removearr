import config from "../constants/config.ts";

export default async function radarrRequest<T>(endpoint: string, init?: RequestInit): Promise<T> {
    if (!init) {
        init = {};
    }

    init.headers = new Headers({
        "X-Api-Key": config.radarrApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain",
    });

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
