import tautulliRequest from "./tautulliRequest.ts";
import getPlayedMovies from "./getPlayedMovies.ts";

/**
 * Get movies that have been watched in full and have been sitting around for a given number of days.
 */
export default async function getOldWatchedMovies(days: number) {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);

    const {data: histories} = await tautulliRequest('get_history', {body: {
        media_type: 'movie',
        length: '1000',
        'order_dir': 'asc',
        'order_column': 'date',
        // format YYYY-MM-DD
        'before': pastDate.toISOString().split('T')[0]
    }});

    const playedMovies = await getPlayedMovies();

    const startedMovies = histories.filter(movie => movie.watched_status !== 1);

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

            const isOld = new Date(playedMedia.last_played! * 1000) < pastDate;
            // unique by rating key
            const isUnique = self.findIndex(m => m.rating_key === movie.rating_key) === index;

            return isOld && isUnique;
        })
        .map(movie => {
            return playedMovies.find(playedMovie => Number(playedMovie.rating_key) === movie.rating_key)!
        })
}
