const missing: string[] = [];
const required = (key: string) => process.env[key] ?? (missing.push(key), '');

export const config = {
    tautulliApiKey: required('TAUTULLI_API_KEY'),
    tautulliUrl: required('TAUTULLI_API_URL'),
    radarrUrl: required('RADARR_API_URL'),
    radarrApiKey: required('RADARR_API_KEY'),
    sonarrUrl: required('SONARR_API_URL'),
    sonarrApiKey: required('SONARR_API_KEY'),
    seerrUrl: required('SEER_URL'),
    seerrApiKey: required('SEER_API_KEY'),
    plexUrl: required('PLEX_URL'),
    plexServerId: required('PLEX_SERVER_ID'),
    plexServerName: required('PLEX_SERVER_NAME'),
    plexEmail: required('PLEX_EMAIL'),
    plexPassword: required('PLEX_PASSWORD'),
    /** 32+ random chars, seals the login cookie */
    sessionSecret: required('SESSION_SECRET'),
    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- empty env values must fall back too */
    deleteAfterDays: Number(process.env.DELETE_AFTER_DAYS || 14),
    cronSchedule: process.env.CRON_SCHEDULE || '0 6 * * *',
    /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
    debug: process.env.DEBUG === 'true'
};

if (missing.length) {
    // log.ts imports config, so consola isn't available here
    // eslint-disable-next-line no-console
    console.error(`Missing env: ${missing.join(', ')}`);
    process.exit(1);
}
