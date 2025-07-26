import getCliArguments from "./src/getCliArguments.ts";
import getOldWatchedMedia, { type OldWatchedMedia } from "./src/tautulli/getOldWatchedMedia.ts";
import config from "./src/utils/config.ts";
import radarrRequest from "./src/radarr/radarrRequest.ts";
import { Movie, TagDetailsResource } from "./src/constants/radarrTypes.ts";
import log from "./src/utils/logger.ts";
import leavingSoonCollection from "./src/plex/leavingSoonCollection.ts";

const cliArgs = getCliArguments();

const deleteAfterDays = config.deleteAfterDays || 14;
const deleteSoonAfterDays = Math.round(deleteAfterDays / 2);

export type OldWatchedMovieWithRadarr = {
    tautulli: OldWatchedMedia;
    radarr: Movie
}

async function removeArr() {
    const oldWatchedMovies = await getOldWatchedMedia(deleteSoonAfterDays, 'movie');
    const radarrMovies = await radarrRequest<Movie[]>('movie');

    const requesterTags = await radarrRequest<TagDetailsResource[]>('tag/detail')
        // username prefixed like "1 - John Doe"
        .then(tags => tags.map(tag => ({ moviesIds: tag.movieIds, user: tag.label.replace(/^\d+ - /, '') })));

    const moviesWatchedByRequester: OldWatchedMovieWithRadarr[] = oldWatchedMovies.filter(movie => {
        const radarrMovie = radarrMovies.find(
            // titles might not be the same: radarrMovie.title === movie.title see: "Dune" vs "Dune: Part One (2021)"
            // however, year and file size should be unique enough
            radarrMovie => radarrMovie.year === Number(movie.year) && radarrMovie.statistics.sizeOnDisk === Number(movie.file_size)
        );

        if (!radarrMovie) {
            log.info(`Movie not found in radarr: ${movie.title} (${movie.year})`);

            if (config.debug) {
                // sometimes the year may mismatch: "Good Morning, Vietnam (1988)" vs "Good Morning, Vietnam (1987)"
                const sameSized = radarrMovies.filter(radarrMovie => radarrMovie.statistics.sizeOnDisk === Number(movie.file_size));

                if (sameSized.length > 0) {
                    log.debug(`Potential matches: ${sameSized.map(movie => `${movie.title} (${movie.year})`).join(', ')}`);
                }
            }

            return false;
        }

        const usersWhoWatchedThis = movie.users!;
        const userWhoRequestedThis = requesterTags.find(tag => tag.moviesIds.includes(radarrMovie.id))?.user!;

        return usersWhoWatchedThis.includes(userWhoRequestedThis);
    }).map(movie => {
        const radarrMovie = radarrMovies.find(
            radarrMovie => radarrMovie.year === Number(movie.year) && radarrMovie.statistics.sizeOnDisk === Number(movie.file_size)
        )!;

        return {
            tautulli: movie,
            radarr: radarrMovie
        };
    });

    const { deletableMovies, moviesToDeleteSoon } = moviesWatchedByRequester.reduce((acc, movie) => {
        const playedDaysAgo = Math.round((Date.now() - movie.tautulli.last_played! * 1000) / (1000 * 60 * 60 * 24));

        acc[
            playedDaysAgo >= deleteAfterDays
                ? "deletableMovies"
                : "moviesToDeleteSoon"
        ].push(movie);

        return acc;
    }, { deletableMovies: [] as typeof moviesWatchedByRequester, moviesToDeleteSoon: [] as typeof moviesWatchedByRequester });

    if (cliArgs.dryRun && moviesToDeleteSoon.length > 0) {
        const sizeToReclaim = moviesToDeleteSoon.reduce((acc, movie) => acc + Number(movie.tautulli.file_size), 0);

        log.info(`Movies going to be deleted soon (${moviesToDeleteSoon.length} ~ ${(sizeToReclaim / 1024 / 1024 / 1024).toFixed(2)} GB):
  - ${moviesToDeleteSoon.map(movie =>
            movie.tautulli.title + ' - ' + (Number(movie.tautulli.file_size) / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        ).join("\n  - ")}
`);
    }

    if (deletableMovies.length === 0) {
        log.info('No movies to delete');
        Deno.exit(0);
    }

    if (cliArgs.dryRun) {
        const sizeToReclaim = deletableMovies.reduce((acc, movie) => acc + Number(movie.tautulli.file_size), 0);

        log.info(`Movies going to be deleted (${deletableMovies.length} ~ ${(sizeToReclaim / 1024 / 1024 / 1024).toFixed(2)} GB):
  - ${deletableMovies.map(
            movie => movie.tautulli.title + ' - ' + (Number(movie.tautulli.file_size) / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        ).join("\n  - ")}
`);
        Deno.exit(0);
    }

    const plexLeavingSoonCollection = (await leavingSoonCollection())!;

    if (moviesToDeleteSoon.length > 0) {
        await plexLeavingSoonCollection.remove(moviesToDeleteSoon);
    }

    log.info(`Deleting ${deletableMovies.length} movies`);
    log.debug('Leaving Soon', plexLeavingSoonCollection);
    Deno.exit(0);

    await plexLeavingSoonCollection.remove(deletableMovies);

    await Promise.all(deletableMovies.map(async (movie, index) => {
        // need to delete the original file because radarr does not delete it
        const realPath = movie.radarr.path.startsWith(config.mountPath) ? movie.radarr.path : config.mountPath + '/' + movie.radarr.path;

        const lstat = await Deno.lstat(realPath);
        let path: string | undefined;

        if (lstat.isSymlink) {
            path = Deno.realPathSync(realPath);

            if (path.replace(/\/[^/]+$/, '').endsWith('/movies')) {
                // remove containing folder
                path = path.replace(/\/[^/]+$/, '');
            }
        }

        await radarrRequest(`movie/${movie.radarr.id}?delete_files=true`, { method: 'DELETE' });

        if (path) {
            Deno.removeSync(path, { recursive: true });
        }

        return log.info(`Deleted: ${movie.tautulli.title} (${index + 1}/${deletableMovies.length})`);
    }));
}

// https://github.com/LukeHagar/plexjs/blob/main/docs/sdks/library/README.md#getlibraryitems

// TODOS:
// implement sonarr support
// implement notifications of movies soon to be deleted
// implement error handling

// Deno.cron('removeArr', config.cronSchedule, removeArr);
await removeArr();
// --allow-net for fetching from tautulli and radarr
// --allow-read to read .env file
// --allow-env for checking colours is allowed
