import getCliArguments from "./src/getCliArguments.ts";
import getOldWatchedMovies from "./src/getOldWatchedMovies.ts";
import config from "./src/constants/config.ts";

const cliArgs = getCliArguments();

const deletableMovies = await getOldWatchedMovies(config.deleteAfterDays || 7);

if (cliArgs["dry-run"]) {
    console.log(`
Would delete ${deletableMovies.length} movies:
  - ${deletableMovies.map(movie => movie.title).join("\n  - ")}
`);
    Deno.exit(0);
}

// https://github.com/LukeHagar/plexjs/blob/main/docs/sdks/library/README.md#getlibraryitems

// TODOS:
// implement notifications of movies soon to be deleted
// implement logging
// implement error handling
// implement crons
