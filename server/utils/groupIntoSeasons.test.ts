import { expect, test } from 'vitest';
import groupIntoSeasons from './groupIntoSeasons';
import type { History } from '../types/tautulli';

const episode = (overrides: Partial<History>): History => ({
    grandparent_rating_key: 1, grandparent_title: 'The Wire', parent_media_index: 1, media_index: 1,
    user: 'alice', watched_status: 1, stopped: 100, date: 100, ...overrides
} as History);

test('groups by show and season', () => {
    const [seasonOne, seasonTwo, ...rest] = groupIntoSeasons([
        episode({ media_index: 1 }),
        episode({ media_index: 2, stopped: 200 }),
        // same episode watched twice counts once
        episode({ media_index: 2, stopped: 250 }),
        // partial watch bumps activity but not the watched set
        episode({ media_index: 3, watched_status: 0, user: 'bob', stopped: 300 }),
        // different season is a separate group
        episode({ parent_media_index: 2, media_index: 1, stopped: 400 })
    ]);

    expect(rest).toHaveLength(0);
    expect(seasonOne!.lastActivity).toBe(300);
    expect(seasonOne!.watchedEpisodesByUser.alice!.size).toBe(2);
    expect(seasonOne!.watchedEpisodesByUser.bob).toBeUndefined();
    expect(seasonTwo!.seasonNumber).toBe(2);
});
