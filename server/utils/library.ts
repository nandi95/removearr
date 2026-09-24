import type { Library } from '#shared/types';
import type { Movie, TagDetailsResource } from '../types/radarr';
import type { Series, SeriesTagDetails } from '../types/sonarr';
import type { LibraryType } from '../types/tautulli';

async function getPlayedMedia(type: LibraryType) {
    const libraries = await tautulliRequest('get_libraries');
    const library = libraries.find(l => l.section_type === type);

    if (!library) throw new Error(`No ${type} library in Tautulli`);

    const { data } = await tautulliRequest('get_library_media_info', {
        section_id: library.section_id,
        length: library.count,
        order_column: 'last_played'
    });

    return data.filter(media => media.last_played);
}

const requester = (tags: { label: string }[] | undefined) => tags?.[0] ? stripTagPrefix(tags[0].label) : null;

/** Everything the UI and the sync need, joined from Radarr, Sonarr and Tautulli, with a status per item. */
export async function getLibrary(): Promise<Library> {
    const [movies, series, playedMovies, playedShows, movieTags, seriesTags, movieHistory, episodeHistory] = await Promise.all([
        radarrRequest<Movie[]>('movie'),
        sonarrRequest<Series[]>('series'),
        getPlayedMedia('movie'),
        getPlayedMedia('show'),
        radarrRequest<TagDetailsResource[]>('tag/detail'),
        sonarrRequest<SeriesTagDetails[]>('tag/detail'),
        tautulliRequest('get_history', { media_type: 'movie', length: '10000' }),
        tautulliRequest('get_history', { media_type: 'episode', length: '10000' })
    ]);

    // users who fully watched each movie, keyed by tautulli rating_key
    const movieWatchers = new Map<number, string[]>();
    // history includes in-progress sessions; the library's last_played only updates once a session has stopped
    const movieLastSeen = new Map<number, number>();
    for (const entry of movieHistory.data) {
        movieLastSeen.set(entry.rating_key, Math.max(movieLastSeen.get(entry.rating_key) ?? 0, entry.stopped || entry.date));
        if (entry.watched_status !== 1) continue;
        const users = movieWatchers.get(entry.rating_key) ?? [];
        if (!users.includes(entry.user)) users.push(entry.user);
        movieWatchers.set(entry.rating_key, users);
    }

    const watchedSeasons = groupIntoSeasons(episodeHistory.data);

    const raw = {
        movies: movies.filter(movie => movie.hasFile).map(movie => {
            // titles differ between tautulli and radarr ("Dune" vs "Dune: Part One"); year + size on disk is unique enough
            const played = playedMovies.find(p => Number(p.year) === movie.year && Number(p.file_size) === movie.statistics.sizeOnDisk);

            return {
                id: movie.id,
                title: movie.title,
                year: movie.year,
                size: movie.statistics.sizeOnDisk,
                added: movie.added,
                ratingKey: played ? Number(played.rating_key) : null,
                lastPlayed: played ? Math.max(played.last_played ?? 0, movieLastSeen.get(Number(played.rating_key)) ?? 0) || null : null,
                requestedBy: requester(movieTags.filter(tag => tag.movieIds.includes(movie.id))),
                watchedBy: played ? movieWatchers.get(Number(played.rating_key)) ?? [] : []
            };
        }),
        series: series.map(show => {
            const played = playedShows.find(p => norm(p.title) === norm(show.title));
            const showSeasons = watchedSeasons.filter(w => norm(w.showTitle) === norm(show.title));
            const seasons = show.seasons.filter(season => season.statistics.episodeFileCount > 0).map(season => {
                const watched = showSeasons.find(w => w.seasonNumber === season.seasonNumber);

                return {
                    seasonNumber: season.seasonNumber,
                    size: season.statistics.sizeOnDisk,
                    episodes: season.statistics.episodeFileCount,
                    lastActivity: watched?.lastActivity ?? null,
                    // "watched the season" = fully watched at least as many distinct episodes as there are files
                    watchedBy: Object.entries(watched?.watchedEpisodesByUser ?? {})
                        .filter(([, episodes]) => episodes.size >= season.statistics.episodeFileCount)
                        .map(([user]) => user)
                };
            });

            return {
                id: show.id,
                title: show.title,
                year: show.year,
                size: seasons.reduce((acc, s) => acc + s.size, 0),
                added: show.added,
                lastPlayed: played?.last_played ?? null,
                requestedBy: requester(seriesTags.filter(tag => tag.seriesIds.includes(show.id))),
                watchedBy: [...new Set(seasons.flatMap(s => s.watchedBy))],
                seasons
            };
        }).filter(show => show.seasons.length > 0)
    };

    return computeCandidates(raw, config.deleteAfterDays, await listSnoozes());
}
