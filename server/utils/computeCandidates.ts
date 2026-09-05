import type { Library, LibraryMovie, LibrarySeason, LibrarySeries, Snooze, Status } from '#shared/types';

// pure module: no runtime imports so it stays unit-testable outside Nitro

export const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
/** requester tags are username prefixed like "1-johndoe" */
export const stripTagPrefix = (label: string) => label.replace(/^\d+\s*-\s*/, '');

type Raw<T> = Omit<T, 'status'>;
export interface RawLibrary {
    movies: Raw<LibraryMovie>[];
    series: (Omit<LibrarySeries, 'status' | 'seasons'> & { seasons: Raw<LibrarySeason>[] })[];
}

const RANK: Record<Status, number> = { keep: 0, snoozed: 1, soon: 2, deletable: 3 };
const worst = (statuses: Status[]) => statuses.reduce<Status>((acc, s) => RANK[s] > RANK[acc] ? s : acc, 'keep');

function idleStatus(lastActivity: number | null, requester: string | null, watchers: string[], days: number, now: number): Status {
    if (!lastActivity || !requester || !watchers.some(user => norm(user) === norm(requester))) return 'keep';

    // ponytail: no separate "someone else started it recently" grace — any play (partial or full) bumps lastActivity
    const idleDays = (now / 1000 - lastActivity) / 86400;

    return idleDays >= days ? 'deletable' : idleDays >= Math.round(days / 2) ? 'soon' : 'keep';
}

export function computeCandidates(raw: RawLibrary, days: number, snoozes: Snooze[] = [], now = Date.now()): Library {
    const active = snoozes.filter(s => s.until === null || Date.parse(s.until) > now);
    const snoozed = (kind: Snooze['kind'], arrId: number, seasonNumber = -1) =>
        active.some(s => s.kind === kind && s.arrId === arrId && (s.seasonNumber === -1 || s.seasonNumber === seasonNumber));

    return {
        movies: raw.movies.map(movie => ({
            ...movie,
            status: snoozed('movie', movie.id) ? 'snoozed' : idleStatus(movie.lastPlayed, movie.requestedBy, movie.watchedBy, days, now)
        })),
        series: raw.series.map(series => {
            const seasons = series.seasons.map(season => ({
                ...season,
                status: snoozed('series', series.id, season.seasonNumber)
                    ? 'snoozed' as Status
                    : idleStatus(season.lastActivity, series.requestedBy, season.watchedBy, days, now)
            }));

            return { ...series, seasons, status: worst(seasons.map(s => s.status)) };
        })
    };
}
