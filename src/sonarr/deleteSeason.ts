import sonarrRequest from "./sonarrRequest.ts";
import getRequestedSeasons from "../overseerr/getRequestedSeasons.ts";
import type { EpisodeFile, Series } from "../constants/sonarrTypes.ts";

/**
 * Nothing else on disk and no overseerr request for an unreleased season → the series is done.
 * ponytail: "unreleased" = sonarr reports a nextAiring date; a fulfilled-then-deleted request has none.
 */
export function isLastSeason(series: Series, seasonNumber: number, requestedSeasons: number[]) {
    return series.seasons
        .filter(season => season.seasonNumber !== seasonNumber)
        .every(season =>
            season.statistics.episodeFileCount === 0 &&
            !(season.statistics.nextAiring && requestedSeasons.includes(season.seasonNumber))
        );
}

/** Unmonitor a season and delete its files via sonarr. The hardlinked torrent copies are qbittorrent's job (share limit action: remove with content). */
export default async function deleteSeason(series: Series, seasonNumber: number) {
    // drop the whole series so sonarr stops tracking future seasons
    if (isLastSeason(series, seasonNumber, await getRequestedSeasons(series.tvdbId))) {
        return sonarrRequest(`series/${series.id}?deleteFiles=true`, { method: 'DELETE' });
    }

    const files = await sonarrRequest<EpisodeFile[]>(`episodefile?seriesId=${series.id}`);
    const seasonFiles = files.filter(file => file.seasonNumber === seasonNumber);

    // unmonitor the season so sonarr does not redownload it
    const season = series.seasons.find(season => season.seasonNumber === seasonNumber)!;
    season.monitored = false;
    await sonarrRequest(`series/${series.id}`, { method: 'PUT', body: JSON.stringify(series) });

    await sonarrRequest('episodefile/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ episodeFileIds: seasonFiles.map(file => file.id) }),
    });

    // keep the shared series object honest for a later season of the same series in this run
    season.statistics.episodeFileCount = 0;
}
