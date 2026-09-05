import config from "./src/utils/config.ts";
import log from "./src/utils/logger.ts";
import radarrRequest from "./src/radarr/radarrRequest.ts";
import sonarrRequest from "./src/sonarr/sonarrRequest.ts";
import deleteMovie from "./src/radarr/deleteMovie.ts";
import deleteSeason from "./src/sonarr/deleteSeason.ts";
import getPlayedMedia from "./src/tautulli/getPlayedMedia.ts";
import tautulliRequest from "./src/tautulli/tautulliRequest.ts";
import groupIntoSeasons from "./src/tautulli/groupIntoSeasons.ts";
import type { Movie, TagDetailsResource } from "./src/constants/radarrTypes.ts";
import type { Series, SeriesTagDetails } from "./src/constants/sonarrTypes.ts";

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
// requester tags are username prefixed like "1-johndoe"
const stripTagPrefix = (label: string) => label.replace(/^\d+\s*-\s*/, '');

async function getLibrary() {
    const [movies, series, playedMovies, playedShows, movieTags, seriesTags, movieHistory, episodeHistory] = await Promise.all([
        radarrRequest<Movie[]>('movie'),
        sonarrRequest<Series[]>('series'),
        getPlayedMedia('movie'),
        getPlayedMedia('show'),
        radarrRequest<TagDetailsResource[]>('tag/detail'),
        sonarrRequest<SeriesTagDetails[]>('tag/detail'),
        tautulliRequest('get_history', { body: { media_type: 'movie', length: '10000', transcode_decision: '' } }),
        tautulliRequest('get_history', { body: { media_type: 'episode', length: '10000', transcode_decision: '' } }),
    ]);

    // users who fully watched each movie, keyed by tautulli rating_key
    const movieWatchers = new Map<number, string[]>();
    for (const entry of movieHistory.data) {
        if (entry.watched_status !== 1) continue;

        const users = movieWatchers.get(entry.rating_key) ?? [];
        if (!users.includes(entry.user)) users.push(entry.user);
        movieWatchers.set(entry.rating_key, users);
    }

    const watchedSeasons = groupIntoSeasons(episodeHistory.data);

    return {
        movies: movies.filter(movie => movie.hasFile).map(movie => {
            // same matching convention as the CLI: year + size on disk
            const played = playedMovies.find(played =>
                Number(played.year) === movie.year && Number(played.file_size) === movie.statistics.sizeOnDisk
            );

            const requesterTag = movieTags.find(tag => tag.movieIds.includes(movie.id));

            return {
                id: movie.id,
                title: movie.title,
                year: movie.year,
                size: movie.statistics.sizeOnDisk,
                added: movie.added,
                lastPlayed: played?.last_played ?? null,
                requestedBy: requesterTag ? stripTagPrefix(requesterTag.label) : null,
                watchedBy: played ? movieWatchers.get(Number(played.rating_key)) ?? [] : [],
            };
        }),
        series: series.map(series => {
            const played = playedShows.find(played => norm(played.title) === norm(series.title));
            const seasons = series.seasons.filter(season => season.statistics.episodeFileCount > 0);
            const showSeasons = watchedSeasons.filter(watched => norm(watched.showTitle) === norm(series.title));
            const requesterTag = seriesTags.find(tag => tag.seriesIds.includes(series.id));

            return {
                id: series.id,
                title: series.title,
                year: series.year,
                size: seasons.reduce((acc, season) => acc + season.statistics.sizeOnDisk, 0),
                added: series.added,
                lastPlayed: played?.last_played ?? null,
                requestedBy: requesterTag ? stripTagPrefix(requesterTag.label) : null,
                watchedBy: [...new Set(showSeasons.flatMap(watched => Object.keys(watched.watchedEpisodesByUser)))],
                seasons: seasons.map(season => ({
                    seasonNumber: season.seasonNumber,
                    size: season.statistics.sizeOnDisk,
                    episodes: season.statistics.episodeFileCount,
                    watchedBy: Object.keys(
                        showSeasons.find(watched => watched.seasonNumber === season.seasonNumber)?.watchedEpisodesByUser ?? {}
                    ),
                })),
            };
        }).filter(series => series.seasons.length > 0),
    };
}

// radarr/sonarr serve posters at <api base>/mediacover/<id>/poster-250.jpg
async function poster(kind: string, id: string) {
    const isMovie = kind === 'movie';
    const response = await fetch(
        `${isMovie ? config.radarrUrl : config.sonarrUrl}/mediacover/${id}/poster-250.jpg`,
        { headers: { 'X-Api-Key': isMovie ? config.radarrApiKey : config.sonarrApiKey } },
    );

    return new Response(response.body, {
        status: response.status,
        headers: {
            'Content-Type': response.headers.get('Content-Type') ?? 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
        },
    });
}

const html = await Deno.readFile(new URL('./public/index.html', import.meta.url));
const port = Number(Deno.env.get('PORT') ?? 8484);

Deno.serve({ port }, async (request) => {
    const { pathname } = new URL(request.url);

    try {
        if (request.method === 'GET' && pathname === '/') {
            return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        if (request.method === 'GET' && pathname === '/api/library') {
            return Response.json(await getLibrary());
        }

        const posterMatch = pathname.match(/^\/api\/poster\/(movie|series)\/(\d+)$/);
        if (request.method === 'GET' && posterMatch) {
            return await poster(posterMatch[1], posterMatch[2]);
        }

        const movieMatch = pathname.match(/^\/api\/movie\/(\d+)$/);
        if (request.method === 'DELETE' && movieMatch) {
            const movie = await radarrRequest<Movie>(`movie/${movieMatch[1]}`);
            await deleteMovie(movie);
            log.info(`Deleted via UI: ${movie.title} (${movie.year})`);

            return Response.json({ ok: true });
        }

        const seasonMatch = pathname.match(/^\/api\/series\/(\d+)\/season\/(\d+)$/);
        if (request.method === 'DELETE' && seasonMatch) {
            const series = await sonarrRequest<Series>(`series/${seasonMatch[1]}`);
            await deleteSeason(series, Number(seasonMatch[2]));
            log.info(`Deleted via UI: ${series.title} - Season ${seasonMatch[2]}`);

            return Response.json({ ok: true });
        }

        return new Response('Not found', { status: 404 });
    } catch (error) {
        log.error(`${request.method} ${pathname}`, error);

        return Response.json({ error: String(error) }, { status: 500 });
    }
});

log.info(`RemoveArr UI listening on http://localhost:${port}`);
