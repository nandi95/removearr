import type { Kind, LibraryMovie, LibraryResponse, LibrarySeason, LibrarySeries, Status } from '#shared/types'

/** One reviewable thing: a movie or a single season. */
export interface Candidate {
  key: string
  kind: Kind
  id: number
  seasonNumber: number | null
  title: string
  year: number
  size: number
  lastActivity: number | null
  requestedBy: string | null
  watchedBy: string[]
  status: Status
}

const RANK: Record<Status, number> = { keep: 0, snoozed: 1, soon: 2, deletable: 3 }
const worst = (statuses: Status[]) => statuses.reduce<Status>((acc, s) => RANK[s] > RANK[acc] ? s : acc, 'keep')

export const movieCandidate = (m: LibraryMovie): Candidate => ({
  key: `movie:${m.id}`, kind: 'movie', id: m.id, seasonNumber: null, title: m.title, year: m.year, size: m.size,
  lastActivity: m.lastPlayed, requestedBy: m.requestedBy, watchedBy: m.watchedBy, status: m.status,
})

export const seasonCandidate = (s: LibrarySeries, season: LibrarySeason): Candidate => ({
  key: `series:${s.id}:${season.seasonNumber}`, kind: 'series', id: s.id, seasonNumber: season.seasonNumber,
  title: s.title, year: s.year, size: season.size, lastActivity: season.lastActivity,
  requestedBy: s.requestedBy, watchedBy: season.watchedBy, status: season.status,
})

export function useLibrary() {
  // deep: local mutations after deletes/snoozes must be reactive
  const fetch = useFetch<LibraryResponse>('/api/library', { key: 'library', lazy: true, deep: true })
  const { data } = fetch

  const movies = computed(() => data.value?.movies ?? [])
  const series = computed(() => data.value?.series ?? [])

  const candidates = computed<Candidate[]>(() => [
    ...movies.value.map(movieCandidate),
    ...series.value.flatMap(s => s.seasons.map(season => seasonCandidate(s, season))),
  ])

  const byStatus = (status: Status) => candidates.value.filter(c => c.status === status)
  const totals = computed(() => ({
    deletable: byStatus('deletable'),
    soon: byStatus('soon'),
    snoozed: byStatus('snoozed'),
    libraryBytes: candidates.value.reduce((acc, c) => acc + c.size, 0),
  }))

  function removeLocal(c: Candidate) {
    if (!data.value) return
    if (c.kind === 'movie') {
      data.value.movies = data.value.movies.filter(m => m.id !== c.id)
      return
    }
    const show = data.value.series.find(s => s.id === c.id)
    if (!show) return
    show.seasons = show.seasons.filter(s => s.seasonNumber !== c.seasonNumber)
    show.size = show.seasons.reduce((acc, s) => acc + s.size, 0)
    show.status = worst(show.seasons.map(s => s.status))
    if (!show.seasons.length) data.value.series = data.value.series.filter(s => s.id !== c.id)
  }

  function setStatusLocal(c: Candidate, status: Status) {
    if (!data.value) return
    if (c.kind === 'movie') {
      const movie = data.value.movies.find(m => m.id === c.id)
      if (movie) movie.status = status
      return
    }
    const show = data.value.series.find(s => s.id === c.id)
    const season = show?.seasons.find(s => s.seasonNumber === c.seasonNumber)
    if (show && season) {
      season.status = status
      show.status = worst(show.seasons.map(s => s.status))
    }
  }

  const deleteUrl = (c: Candidate) => c.kind === 'movie' ? `/api/movie/${c.id}` : `/api/series/${c.id}/season/${c.seasonNumber}`

  async function deleteOne(c: Candidate) {
    await $fetch(deleteUrl(c), { method: 'DELETE' })
    removeLocal(c)
  }

  /** Snooze until an ISO date, or forever with null. */
  async function keep(c: Candidate, until: string | null) {
    await $fetch('/api/snooze', { method: 'POST', body: { kind: c.kind, id: c.id, seasonNumber: c.seasonNumber ?? -1, until } })
    setStatusLocal(c, 'snoozed')
  }

  async function unkeep(c: Candidate) {
    await $fetch('/api/snooze', { method: 'DELETE', body: { kind: c.kind, id: c.id, seasonNumber: c.seasonNumber ?? -1 } })
    // the underlying status is only known server side
    await fetch.refresh()
  }

  return { ...fetch, movies, series, candidates, totals, deleteOne, keep, unkeep }
}

/** The item currently open in the detail slideover, shared across the app. */
export const useSelected = () => useState<{ kind: Kind, id: number } | null>('selected', () => null)
