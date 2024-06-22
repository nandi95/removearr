import { MyPlexAccount } from "/deps.ts";
import type { PlexServer } from "npm:@ctrl/plex";
import config from "./config.ts";

let plexClient: PlexServer;

export default async function getPlexClient() {
    if (!plexClient) {
        const account = await new MyPlexAccount(
            config.plexURL,
            config.plexEmail,
            config.plexPassword,
        ).connect();
        const resource = await account.resource(config.plexServerName);
        plexClient = await resource.connect();
    }

    return plexClient;
}
