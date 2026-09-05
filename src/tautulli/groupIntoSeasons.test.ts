import groupIntoSeasons from "./groupIntoSeasons.ts";
import type { History } from "../constants/tautulliTypes.ts";

function episode(overrides: Partial<History>): History {
    return {
        grandparent_rating_key: 1,
        grandparent_title: 'The Wire',
        parent_media_index: 1,
        media_index: 1,
        user: 'alice',
        watched_status: 1,
        stopped: 100,
        date: 100,
        ...overrides,
    } as History;
}

Deno.test('groupIntoSeasons groups by show and season', () => {
    const seasons = groupIntoSeasons([
        episode({ media_index: 1 }),
        episode({ media_index: 2, stopped: 200 }),
        // same episode watched twice counts once
        episode({ media_index: 2, stopped: 250 }),
        // partial watch bumps activity but not the watched set
        episode({ media_index: 3, watched_status: 0, user: 'bob', stopped: 300 }),
        // different season is a separate group
        episode({ parent_media_index: 2, media_index: 1, stopped: 400 }),
    ]);

    if (seasons.length !== 2) throw new Error(`expected 2 seasons, got ${seasons.length}`);

    const [seasonOne, seasonTwo] = seasons;

    if (seasonOne.lastActivity !== 300) throw new Error(`expected lastActivity 300, got ${seasonOne.lastActivity}`);
    if (seasonOne.watchedEpisodesByUser['alice'].size !== 2) throw new Error('alice should have 2 watched episodes');
    if (seasonOne.watchedEpisodesByUser['bob']) throw new Error('bob has no fully watched episodes');
    if (seasonTwo.seasonNumber !== 2) throw new Error('second group should be season 2');
});
