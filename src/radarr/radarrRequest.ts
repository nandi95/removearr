import config from "../constants/config.ts";

export default async function radarrRequest(endpoint: string) {
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
