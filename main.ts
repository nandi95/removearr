import getCliArguments from "./src/tautulli/getCliArguments.ts";
import getOldWatchedMovies from "./src/tautulli/getOldWatchedMovies.ts";
import config from "./src/constants/config.ts";
import notify from "./src/notify.ts";
import radarrRequest from "./src/radarr/radarrRequest.ts";

const cliArgs = getCliArguments();

const { deletableMovies, moviesToDeleteSoon } = await getOldWatchedMovies(Math.max(config.deleteAfterDays || 14))
    .then(movies => {
        // todo check if they have been watched by the requesting user
        return movies.reduce((acc, movie) => {
            acc[
                new Date(movie.last_played! * 1000) < new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
                    ? "moviesToDeleteSoon"
                    : "deletableMovies"
                ].push(movie);

            return acc;
        }, { deletableMovies: [] as typeof movies, moviesToDeleteSoon: [] as typeof movies});
    });

if (deletableMovies.length === 0) {
    console.log('No movies to delete');
    Deno.exit(0);
}

if (cliArgs["dry-run"]) {
    console.log(`
Would delete ${deletableMovies.length} movies:
  - ${deletableMovies.map(movie => movie.title).join("\n  - ")}
`);
    Deno.exit(0);
}

await notify(
    'Some movies are about to leave the platform',
    `The following movies are about to be deleted:
  - ${deletableMovies.map(movie => movie.title).join("\n  - ")}`
);

// can relate to radarr movies by get_metadata -> 'guids[]' -> 'tmdb://1156503'

// delete through radarr/sonarr

// https://github.com/LukeHagar/plexjs/blob/main/docs/sdks/library/README.md#getlibraryitems

// TODOS:
// implement notifications of movies soon to be deleted
// implement logging
// implement error handling
// implement crons
