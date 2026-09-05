import { expect, test } from 'vitest';
import { isLastSeason } from './isLastSeason';
import type { Series } from '../types/sonarr';

// [seasonNumber, episodeFileCount, unreleased]
const series = (seasons: [number, number, boolean][]) => ({
    seasons: seasons.map(([seasonNumber, episodeFileCount, unreleased]) =>
        ({ seasonNumber, statistics: { episodeFileCount, nextAiring: unreleased ? '2030-01-01' : undefined } }))
}) as Series;

test.each<[string, Series, number, number[], boolean]>([
    ['only season', series([[1, 5, false]]), 1, [], true],
    ['another season has files', series([[1, 5, false], [2, 3, false]]), 1, [], false],
    ['another season is empty', series([[1, 5, false], [2, 0, false]]), 1, [], true],
    ['unreleased but nobody asked (sonarr auto-monitor)', series([[1, 5, false], [6, 0, true]]), 1, [], true],
    ['unreleased and requested in Seerr', series([[1, 5, false], [6, 0, true]]), 1, [6], false],
    ['old request already fulfilled and cleaned up', series([[1, 0, false], [2, 5, false]]), 2, [1], true]
])('%s', (_, s, n, requested, expected) => {
    expect(isLastSeason(s, n, requested)).toBe(expected);
});
