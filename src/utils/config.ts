import { dotenv } from "/deps.ts";

interface RemoveArrConfig {
    tautulliApiKey: string;
    tautulliUrl: string;
    version: string;
    deleteAfterDays?: number;
    radarrUrl: string;
    radarrApiKey: string;
    timeZone: string;
    debug: boolean;
}

const env = dotenv();

if (!env.TAUTULLI_API_KEY || !env.TAUTULLI_API_URL) {
    throw new Error('Missing environment variables');
}

export default {
    tautulliApiKey: env.TAUTULLI_API_KEY,
    tautulliUrl: env.TAUTULLI_API_URL,
    version: '0.1.0',
    deleteAfterDays: env.DELETE_AFTER_DAYS ? parseInt(env.DELETE_AFTER_DAYS) : undefined,
    radarrApiKey: env.RADARR_API_KEY,
    radarrUrl: env.RADARR_API_URL,
    timeZone: env.TZ ?? 'Europe/London',
    debug: env.DEBUG === 'true'
} as RemoveArrConfig;
