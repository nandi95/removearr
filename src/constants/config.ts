import { config } from 'https://deno.land/x/dotenv/mod.ts';

interface RemoveArrConfig {
    apiKey: string;
    url: string;
    notifierId: string | undefined;
    version: string;
    deleteAfterDays?: number;
}

const env = config();

if (!env.TAUTULLI_API_KEY || !env.TAUTULLI_API_URL) {
    throw new Error('Missing environment variables');
}

export default {
    apiKey: env.TAUTULLI_API_KEY,
    url: env.TAUTULLI_API_URL,
    notifierId: env.TAUTULLI_NOTIFIER_ID,
    version: '0.1.0',
    deleteAfterDays: env.DELETE_AFTER_DAYS ? parseInt(env.DELETE_AFTER_DAYS) : undefined,
} as RemoveArrConfig;
