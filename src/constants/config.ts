import { config } from 'https://deno.land/x/dotenv/mod.ts';

interface RemoveArrConfig {
    tautulliApiKey: string;
    tautulliUrl: string;
    notifierId: string | undefined;
    version: string;
    deleteAfterDays?: number;
    radarrUrl: string;
    radarrApiKey: string;
}

const env = config();

if (!env.TAUTULLI_API_KEY || !env.TAUTULLI_API_URL) {
    throw new Error('Missing environment variables');
}

export default {
    tautulliApiKey: env.TAUTULLI_API_KEY,
    tautulliUrl: env.TAUTULLI_API_URL,
    notifierId: env.TAUTULLI_NOTIFIER_ID,
    version: '0.1.0',
    deleteAfterDays: env.DELETE_AFTER_DAYS ? parseInt(env.DELETE_AFTER_DAYS) : undefined,
    radarrApiKey: env.RADARR_API_KEY,
    radarrUrl: env.RADARR_API_URL,
} as RemoveArrConfig;
