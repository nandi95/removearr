import { expect, test } from 'vitest';
import { computeCandidates, type RawLibrary } from './computeCandidates';

const NOW = Date.parse('2026-09-05T12:00:00Z');
const daysAgo = (d: number) => Math.round(NOW / 1000 - d * 86400);

const movie = (overrides: Partial<RawLibrary['movies'][number]> = {}) => ({
    id: 1, title: 'Dune', year: 2021, size: 10, added: '2026-01-01', ratingKey: 100,
    lastPlayed: daysAgo(20), requestedBy: 'alice', watchedBy: ['alice'], ...overrides
});

const run = (m: Partial<RawLibrary['movies'][number]>, snoozes: Parameters<typeof computeCandidates>[2] = []) =>
    computeCandidates({ movies: [movie(m)], series: [] }, 14, snoozes, NOW).movies[0]!.status;

test.each<[string, Partial<RawLibrary['movies'][number]>, string]>([
    ['idle past threshold', { lastPlayed: daysAgo(20) }, 'deletable'],
    ['idle past half threshold', { lastPlayed: daysAgo(8) }, 'soon'],
    ['recently played', { lastPlayed: daysAgo(2) }, 'keep'],
    ['never played', { lastPlayed: null }, 'keep'],
    ['no requester tag', { requestedBy: null }, 'keep'],
    ['watched only by someone else', { watchedBy: ['bob'] }, 'keep'],
    ['tag label normalised like tautulli name', { requestedBy: 'farkasm7', watchedBy: ['farkas.m7'] }, 'deletable']
])('%s → %s', (_, overrides, expected) => {
    expect(run(overrides)).toBe(expected);
});

test('snoozes', () => {
    const snooze = (until: string | null) => [{ kind: 'movie' as const, arrId: 1, seasonNumber: -1, until, createdAt: '' }];
    expect(run({}, snooze(null))).toBe('snoozed');
    expect(run({}, snooze('2030-01-01T00:00:00Z'))).toBe('snoozed');
    expect(run({}, snooze('2020-01-01T00:00:00Z'))).toBe('deletable');
    expect(run({}, [{ kind: 'series', arrId: 1, seasonNumber: -1, until: null, createdAt: '' }])).toBe('deletable');
});

test('series takes the worst season status; season snooze is per season', () => {
    const season = (seasonNumber: number, lastActivity: number) =>
        ({ seasonNumber, size: 1, episodes: 5, lastActivity, watchedBy: ['alice'] });
    const raw: RawLibrary = {
        movies: [],
        series: [{
            id: 7, title: 'The Wire', year: 2002, size: 3, added: '', lastPlayed: null, requestedBy: 'alice', watchedBy: ['alice'],
            seasons: [season(1, daysAgo(30)), season(2, daysAgo(8)), season(3, daysAgo(1))]
        }]
    };

    const [show] = computeCandidates(raw, 14, [], NOW).series;
    expect(show!.seasons.map(s => s.status)).toEqual(['deletable', 'soon', 'keep']);
    expect(show!.status).toBe('deletable');

    const snoozed = computeCandidates(raw, 14, [{ kind: 'series', arrId: 7, seasonNumber: 1, until: null, createdAt: '' }], NOW).series[0]!;
    expect(snoozed.seasons.map(s => s.status)).toEqual(['snoozed', 'soon', 'keep']);
    expect(snoozed.status).toBe('soon');
});
