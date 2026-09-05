import type { Series, SeriesTagDetails } from '../../../../types/sonarr'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const seasonNumber = Number(getRouterParam(event, 'n'))
  const [series, tags] = await Promise.all([sonarrRequest<Series>(`series/${id}`), sonarrRequest<SeriesTagDetails[]>('tag/detail')])
  const season = series.seasons.find(s => s.seasonNumber === seasonNumber)

  if (!season) throw createError({ statusCode: 404, message: `Season ${seasonNumber} not found` })

  await deleteSeason(series, seasonNumber)
  const tag = tags.find(t => t.seriesIds.includes(id))
  await Promise.all([
    recordDeletion({
      kind: 'series', arrId: id, title: series.title, year: series.year, seasonNumber,
      sizeBytes: season.statistics.sizeOnDisk, requestedBy: tag ? stripTagPrefix(tag.label) : null,
    }),
    deleteSnooze('series', id, seasonNumber),
  ])
  log.info(`deleted season: ${series.title} - Season ${seasonNumber}`)

  return { ok: true }
})
