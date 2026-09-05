import type { H3Event } from 'h3';

export const PLEX_HEADERS = {
    accept: 'application/json',
    'X-Plex-Product': 'RemoveArr',
    // must be stable: plex.tv ties the PIN to it
    'X-Plex-Client-Identifier': `removearr-${config.plexServerId}`
};

interface SessionData {
    pinId?: number;
    user?: string;
}

export const getAuthSession = async (event: H3Event) => useSession<SessionData>(event, {
    password: config.sessionSecret,
    maxAge: 60 * 60 * 24 * 30,
    // secure cookies never arrive over plain http on the LAN
    cookie: { secure: getRequestURL(event).protocol === 'https:' }
});
