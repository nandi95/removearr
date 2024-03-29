import getCliArguments from "./src/getCliArguments.ts";
import getOldWatchedMovies from "./src/tautulli/getOldWatchedMovies.ts";
import config from "./src/utils/config.ts";
import radarrRequest from "./src/radarr/radarrRequest.ts";
import { Movie, TagDetailsResource } from "./src/constants/radarrTypes.ts";
import log from "./src/utils/logger.ts";

const cliArgs = getCliArguments();

const deleteAfterDays = config.deleteAfterDays || 14;
const deleteSoonAfterDays = Math.round(deleteAfterDays / 2);

async function removeArr() {
    const oldWatchedMovies = await getOldWatchedMovies(deleteSoonAfterDays);
    const radarrMovies = await radarrRequest<Movie[]>('movie');
    const requesterTags = await radarrRequest<TagDetailsResource[]>('tag/detail')
        // username prefixed like "1 - John Doe"
        .then(tags => tags.map(tag => ({ moviesIds: tag.movieIds, user: tag.label.replace(/^\d+ - /, '') })));

    const moviesWatchedByRequester = oldWatchedMovies.filter(movie => {
        const radarrMovie = radarrMovies.find(
            // titles might not be the same: radarrMovie.title === movie.title see: "Dune" vs "Dune: Part One (2021)"
            // however, year and file size should be unique enough
            radarrMovie => radarrMovie.year === Number(movie.year) && radarrMovie.statistics.sizeOnDisk === Number(movie.file_size)
        );

        if (!radarrMovie) {
            log.info(`Movie not found in radarr: ${movie.title} (${movie.year})`);
            return false;
        }

        const usersWhoWatchedThis = movie.users!;
        const userWhoRequestedThis = requesterTags.find(tag => tag.moviesIds.includes(radarrMovie.id))?.user;

        return usersWhoWatchedThis.includes(userWhoRequestedThis!);
    }).map(movie => {
        const radarrMovie = radarrMovies.find(
            radarrMovie => radarrMovie.year === Number(movie.year) && radarrMovie.statistics.sizeOnDisk === Number(movie.file_size)
        );

        return {
            ...movie,
            radarr_id: radarrMovie!.id
        };
    });

    const { deletableMovies, moviesToDeleteSoon } = moviesWatchedByRequester.reduce((acc, movie) => {
        const playedDaysAgo = Math.round((Date.now() - movie.last_played! * 1000) / (1000 * 60 * 60 * 24));

        acc[
            playedDaysAgo >= deleteAfterDays
                ? "deletableMovies"
                : "moviesToDeleteSoon"
        ].push(movie);

        return acc;
    }, { deletableMovies: [] as typeof moviesWatchedByRequester, moviesToDeleteSoon: [] as typeof moviesWatchedByRequester });

    if (cliArgs['dry-run'] && moviesToDeleteSoon.length > 0) {
        const sizeToReclaim = moviesToDeleteSoon.reduce((acc, movie) => acc + Number(movie.file_size), 0);

        log.info(`Movies going to be deleted soon (${moviesToDeleteSoon.length} ~ ${(sizeToReclaim / 1024 / 1024 / 1024).toFixed(2)} GB):
  - ${moviesToDeleteSoon.map(movie => 
            movie.title + ' - ' + (Number(movie.file_size) / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        ).join("\n  - ")}
`);
    }

    if (deletableMovies.length === 0) {
        log.info('No movies to delete');
        Deno.exit(0);
    }

    if (cliArgs["dry-run"]) {
        const sizeToReclaim = deletableMovies.reduce((acc, movie) => acc + Number(movie.file_size), 0);

        log.info(`Movies going to be deleted (${deletableMovies.length} ~ ${(sizeToReclaim / 1024 / 1024 / 1024).toFixed(2)} GB):
  - ${deletableMovies.map(
      movie => movie.title + ' - ' + (Number(movie.file_size) / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        ).join("\n  - ")}
`);
        Deno.exit(0);
    }

    //   await notify(
    //       'Some movies are about to leave the platform',
    //       `The following movies are about to be deleted:
    // - ${moviesToDeleteSoon.map(movie => movie.title).join("\n  - ")}`
    //   );

    log.info(`Deleting ${deletableMovies.length} movies`);

    // await Promise.all(deletableMovies.map((movie, index) => {
    //     return radarrRequest(`movie/${movie.radarr_id}?delete_files=true`, { method: 'DELETE' })
    //         .then(() => logger.info(`Deleted: ${movie.title} (${index + 1}/${deletableMovies.length})`))
    // }));
}

// https://github.com/LukeHagar/plexjs/blob/main/docs/sdks/library/README.md#getlibraryitems

// TODOS:
// implement sonarr support
// implement notifications of movies soon to be deleted
// implement error handling

// Deno.cron('removeArr', '0 0 * * *', removeArr);
await removeArr();
// --allow-net for fetching from tautulli and radarr
// --allow-read to read .env file
// --allow-env for checking colours is allowed
