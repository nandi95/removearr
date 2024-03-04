import tautulliRequest from "./tautulliRequest.ts";
import getPlayedMovies from "./getPlayedMovies.ts";

/**
 * Get movies that have been watched in full and have been sitting around for a given number of days.
 */
export default async function getOldWatchedMovies(days = 30) {
    const {data: histories} = await tautulliRequest('get_history', {body: {media_type: 'movie'}});

    const startedMovies = histories.filter(movie => movie.percent_complete > 0 && movie.percent_complete < 90 && movie.watched_status === 0);
    const watchedMovies = histories.filter(movie => movie.percent_complete >= 90 && movie.watched_status === 1);

    const playedMovies = await getPlayedMovies();

    return watchedMovies
        .filter((movie, index, self) => {
            const startedMovieExists = startedMovies.some(startedMovie => startedMovie.rating_key === movie.rating_key);
            const playedMedia = playedMovies.find(playedMovie => Number(playedMovie.rating_key) === movie.rating_key);

            if (!playedMedia || !startedMovieExists) {
                return false;
            }

            const isOld = new Date(playedMedia.last_played! * 1000) < new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
            // unique by rating key
            const isUnique = self.findIndex(m => m.rating_key === movie.rating_key) === index;

            return isOld && isUnique;
        })
        .map(movie => {
            return playedMovies.find(playedMovie => Number(playedMovie.rating_key) === movie.rating_key)!
        })
}
