import tautulliRequest from "./tautulliRequest.ts";
import log from "../utils/logger.ts";
import getPlayedMedia from "./getPlayedMedia.ts";

/**
 * Get seasons that have been watched in full
 * and have been sitting around for a given
 * number of days without anyone else watching.
 */
export default async function getOldWatchedSeries(days: number) {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
    // todo - make this configurable
    const staleWatchedMovieDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * days * 3);

    // todo implement pagination
    const {data: histories} = await tautulliRequest('get_history', {body: {
            media_type: 'episode',
            length: '1000',
            'order_dir': 'asc',
            'order_column': 'date',
            // format YYYY-MM-DD
            'before': pastDate.toISOString().split('T')[0],
            'transcode_decision': '',
        }});

    /**
     * Map of rating_key to user ids who have watched the whole season
     */
    const seasons = new Map<number, string[]>();

    const playedShows = await getPlayedMedia('show');

    const startedEpisodes = histories.filter(episode => episode.watched_status !== 1 && new Date(episode.started * 1000) >= staleWatchedMovieDate);

    return histories
        .filter((episode, index, self) => {
            if (episode.watched_status !== 1) {
                return false;
            }

            // somebody else has started the episode and it's not old
            const startedMovieExists = startedEpisodes.some(startedMovie => startedMovie.rating_key === episode.rating_key);
            const playedMedia = playedShows.find(playedMovie => Number(playedMovie.rating_key) === episode.rating_key);

            if (!playedMedia || startedMovieExists) {
                return false;
            }

            if (!seasons.has(episode.rating_key)) {
                seasons.set(episode.rating_key, []);
            }

            // add user id to the map if isn't already there
            if (!seasons.get(episode.rating_key)!.includes(episode.user)) {
                seasons.get(episode.rating_key)!.push(episode.user);
            }

            const isOld = new Date(playedMedia.last_played! * 1000) < pastDate;
            // unique by rating key
            const isUnique = self.findIndex(m => m.rating_key === episode.rating_key) === index;

            return isOld && isUnique;
        })
        .map(movie => {
            const playedMovie = playedShows.find(playedMovie => Number(playedMovie.rating_key) === movie.rating_key)!;

            return {
                ...playedMovie,
                users: seasons.get(movie.rating_key)
            };
        });
}
