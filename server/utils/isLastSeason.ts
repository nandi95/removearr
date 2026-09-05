import type { Series } from '../types/sonarr';

/**
 * Nothing else on disk and no Seerr request for an unreleased season → the series is done.
 * ponytail: "unreleased" = sonarr reports a nextAiring date; a fulfilled-then-deleted request has none.
 */
export function isLastSeason(series: Series, seasonNumber: number, requestedSeasons: number[]) {
    return series.seasons
        .filter(season => season.seasonNumber !== seasonNumber)
        .every(season =>
            season.statistics.episodeFileCount === 0
            && !(season.statistics.nextAiring && requestedSeasons.includes(season.seasonNumber))
        );
}
