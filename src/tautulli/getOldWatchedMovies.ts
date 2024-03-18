import tautulliRequest from "./tautulliRequest.ts";
import getPlayedMovies from "./getPlayedMovies.ts";

/**
 * Get movies that have been watched in full
 * and have been sitting around for a given
 * number of days without anyone else watching.
 */
export default async function getOldWatchedMovies(days: number) {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
    // todo - make this configurable
    const staleWatchedMovieDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * days * 3);

    const {data: histories} = await tautulliRequest('get_history', {body: {
        media_type: 'movie',
        length: '1000',
        'order_dir': 'asc',
        'order_column': 'date',
        // format YYYY-MM-DD
        'before': pastDate.toISOString().split('T')[0],
        'transcode_decision': '',
    }});

    const playedMovies = await getPlayedMovies();

    const startedMovies = histories.filter(movie => movie.watched_status !== 1 && new Date(movie.started * 1000) >= staleWatchedMovieDate);

    /**
     * Map of rating_key to user ids who have watched the movie
     */
    const map = new Map<number, string[]>();

    return histories
        .filter((movie, index, self) => {
            if (movie.watched_status !== 1) {
                return false;
            }

            // somebody else has started the movie and it's not old
            const startedMovieExists = startedMovies.some(startedMovie => startedMovie.rating_key === movie.rating_key);
            const playedMedia = playedMovies.find(playedMovie => Number(playedMovie.rating_key) === movie.rating_key);

            if (!playedMedia || startedMovieExists) {
                return false;
            }

            if (!map.has(movie.rating_key)) {
                map.set(movie.rating_key, []);
            }

            // add user id to the map if isn't already there
            if (!map.get(movie.rating_key)!.includes(movie.user)) {
                map.get(movie.rating_key)!.push(movie.user);
            }

            const isOld = new Date(playedMedia.last_played! * 1000) < pastDate;
            // unique by rating key
            const isUnique = self.findIndex(m => m.rating_key === movie.rating_key) === index;

            return isOld && isUnique;
        })
        .map(movie => {
            const playedMovie = playedMovies.find(playedMovie => Number(playedMovie.rating_key) === movie.rating_key)!;

            return {
                ...playedMovie,
                users: map.get(movie.rating_key)
            };
        })
}
