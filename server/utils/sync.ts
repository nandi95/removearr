import type { Cron } from 'croner'
import type { SyncRun } from '#shared/types'

export const scheduler = { job: null as Cron | null }
let running: Promise<SyncRun> | null = null

/** Compute candidates and mirror soon/deletable movies into the Plex "Leaving Soon" collection. Never deletes. */
export function runSync(): Promise<SyncRun> {
  return running ??= (async () => {
    const at = new Date().toISOString()
    const base = { at, ok: false, error: null, deletableCount: 0, soonCount: 0, deletableBytes: 0, soonBytes: 0, libraryBytes: 0, plexAdded: 0, plexRemoved: 0 }

    try {
      await pruneSnoozes()
      const library = await getLibrary()
      const seasons = library.series.flatMap(s => s.seasons)
      const items = [...library.movies, ...seasons]
      const sum = (status: string) => items.filter(i => i.status === status).reduce((acc, i) => acc + i.size, 0)
      const stats = {
        deletableCount: items.filter(i => i.status === 'deletable').length,
        soonCount: items.filter(i => i.status === 'soon').length,
        deletableBytes: sum('deletable'),
        soonBytes: sum('soon'),
        libraryBytes: items.reduce((acc, i) => acc + i.size, 0),
      }

      // plex is best effort: the candidate numbers are still worth recording if it is down
      let plex = { added: 0, removed: 0 }
      let error: string | null = null
      try {
        const leaving = library.movies.filter(m => (m.status === 'soon' || m.status === 'deletable') && m.ratingKey)
        plex = await syncLeavingSoon(leaving.map(m => m.ratingKey!))
      }
      catch (e) {
        error = `Plex: ${e instanceof Error ? e.message : String(e)}`
        log.error('plex sync failed', e)
      }

      const run = await recordSync({ ...base, ...stats, ok: !error, error, plexAdded: plex.added, plexRemoved: plex.removed })
      log.info(`sync: ${run.deletableCount} deletable, ${run.soonCount} soon, plex +${run.plexAdded} -${run.plexRemoved}${error ? ' (plex failed)' : ''}`)

      return run
    }
    catch (error) {
      log.error('sync failed', error)

      return recordSync({ ...base, error: String(error) })
    }
    finally {
      running = null
    }
  })()
}

export const nextRun = () => scheduler.job?.nextRun()?.toISOString() ?? null
