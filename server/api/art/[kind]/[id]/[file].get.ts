import { fetch } from 'undici';

// radarr/sonarr serve artwork at <api base>/mediacover/<id>/<file>
const FILES: Record<string, string> = { poster: 'poster-250.jpg', backdrop: 'fanart-360.jpg' };

export default defineEventHandler(async event => {
    const { kind, id, file } = getRouterParams(event);
    const name = FILES[file!];

    if (!['movie', 'series'].includes(kind!) || !/^\d+$/.test(id!) || !name) throw createError({ statusCode: 404 });

    const movie = kind === 'movie';

    return proxyRequest(event, `${movie ? config.radarrUrl : config.sonarrUrl}/mediacover/${id}/${name}`, {
        // node 24's bundled undici crashes with assert(!this.paused) when the browser abandons a streamed
        // image and the upstream closes; fixed in undici 8 (nodejs/undici#5360)
        fetch: fetch as unknown as typeof globalThis.fetch,
        headers: { 'X-Api-Key': movie ? config.radarrApiKey : config.sonarrApiKey },
        onResponse: e => setResponseHeader(e, 'Cache-Control', 'public, max-age=86400')
    });
});
