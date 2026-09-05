import type { Movie, TagDetailsResource } from '../../types/radarr';

export default defineEventHandler(async event => {
    const id = Number(getRouterParam(event, 'id'));
    const [movie, tags] = await Promise.all([radarrRequest<Movie>(`movie/${id}`), radarrRequest<TagDetailsResource[]>('tag/detail')]);

    await deleteMovie(movie);
    await Promise.all([
        recordDeletion({
            kind: 'movie', arrId: id, title: movie.title, year: movie.year, seasonNumber: null,
            sizeBytes: movie.statistics.sizeOnDisk,
            requestedBy: tags.find(t => t.movieIds.includes(id)) ? stripTagPrefix(tags.find(t => t.movieIds.includes(id))!.label) : null
        }),
        deleteSnooze('movie', id)
    ]);
    log.info(`deleted movie: ${movie.title} (${movie.year})`);

    return { ok: true };
});
