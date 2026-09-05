import { isLastSeason } from "./deleteSeason.ts";
import type { Series } from "../constants/sonarrTypes.ts";

// [seasonNumber, episodeFileCount, unreleased]
const series = (seasons: [number, number, boolean][]) => ({
    seasons: seasons.map(([seasonNumber, episodeFileCount, unreleased]) =>
        ({ seasonNumber, statistics: { episodeFileCount, nextAiring: unreleased ? '2030-01-01' : undefined } })),
}) as Series;

Deno.test('isLastSeason', () => {
    const cases: [Series, number, number[], boolean][] = [
        [series([[1, 5, false]]), 1, [], true],
        [series([[1, 5, false], [2, 3, false]]), 1, [], false],
        [series([[1, 5, false], [2, 0, false]]), 1, [], true],
        // unreleased but nobody asked for it (sonarr auto-monitor) → delete
        [series([[1, 5, false], [6, 0, true]]), 1, [], true],
        // unreleased and requested in overseerr → keep
        [series([[1, 5, false], [6, 0, true]]), 1, [6], false],
        // old request already fulfilled and cleaned up → delete
        [series([[1, 0, false], [2, 5, false]]), 2, [1], true],
    ];
    for (const [s, n, requested, expected] of cases) {
        if (isLastSeason(s, n, requested) !== expected) throw new Error(`expected ${expected} for ${JSON.stringify(s)} requested ${requested}`);
    }
});
