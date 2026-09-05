import type { History } from '../types/tautulli';

export type WatchedSeason = {
    showTitle: string;
    seasonNumber: number;
    /**
     * Unix timestamp of the most recent activity on the season,
     * by anyone, watched in full or not.
     */
    lastActivity: number;
    /**
     * Distinct fully-watched episode numbers per user.
     */
    watchedEpisodesByUser: Record<string, Set<number>>;
};

export default function groupIntoSeasons(histories: History[]): WatchedSeason[] {
    const seasons = new Map<string, WatchedSeason>();

    for (const episode of histories) {
        const key = `${episode.grandparent_rating_key}-${episode.parent_media_index}`;

        const season = seasons.get(key) ?? {
            showTitle: episode.grandparent_title,
            seasonNumber: episode.parent_media_index,
            lastActivity: 0,
            watchedEpisodesByUser: {}
        };
        seasons.set(key, season);

        season.lastActivity = Math.max(season.lastActivity, episode.stopped || episode.date);

        if (episode.watched_status === 1) {
            (season.watchedEpisodesByUser[episode.user] ??= new Set()).add(episode.media_index);
        }
    }

    return [...seasons.values()];
}
