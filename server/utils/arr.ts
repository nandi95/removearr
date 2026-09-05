import type { Movie } from '../types/radarr'
import type { EpisodeFile, Series } from '../types/sonarr'

/** Delete a movie and its files via radarr. The hardlinked torrent copy is qbittorrent's job (share limit action: remove with content). */
export function deleteMovie(movie: Movie) {
  return radarrRequest(`movie/${movie.id}?deleteFiles=true`, { method: 'DELETE' })
}

interface SeerrRequest {
  status: number // 1 pending, 2 approved, 3 declined
  media: { tvdbId: number }
  seasons: { seasonNumber: number }[]
}

/** Season numbers with a pending/approved Seerr request for this tvdb id. */
export async function getRequestedSeasons(tvdbId: number): Promise<number[]> {
  const seasons: number[] = []

  for (let page = 0; ; page++) {
    const { results, pageInfo } = await seerrRequest<{ results: SeerrRequest[], pageInfo: { pages: number } }>(
      `request?take=100&skip=${page * 100}`,
    )

    for (const request of results) {
      if (request.status !== 3 && request.media.tvdbId === tvdbId) {
        seasons.push(...request.seasons.map(season => season.seasonNumber))
      }
    }

    if (page + 1 >= pageInfo.pages) return seasons
  }
}

/** Unmonitor a season and delete its files via sonarr; drop the whole series when nothing else is left. */
export async function deleteSeason(series: Series, seasonNumber: number) {
  if (isLastSeason(series, seasonNumber, await getRequestedSeasons(series.tvdbId))) {
    return sonarrRequest(`series/${series.id}?deleteFiles=true`, { method: 'DELETE' })
  }

  const files = await sonarrRequest<EpisodeFile[]>(`episodefile?seriesId=${series.id}`)
  const season = series.seasons.find(s => s.seasonNumber === seasonNumber)!

  // unmonitor so sonarr does not redownload it
  season.monitored = false
  await sonarrRequest(`series/${series.id}`, { method: 'PUT', body: JSON.stringify(series) })

  await sonarrRequest('episodefile/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ episodeFileIds: files.filter(f => f.seasonNumber === seasonNumber).map(f => f.id) }),
  })
}
