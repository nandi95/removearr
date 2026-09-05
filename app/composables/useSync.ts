import type { SyncRun } from '#shared/types'

export function useSync() {
  const syncing = useState('syncing', () => false)
  const toast = useToast()
  const { refresh } = useLibrary()

  async function sync() {
    if (syncing.value) return
    syncing.value = true
    try {
      const run = await $fetch<SyncRun>('/api/sync', { method: 'POST' })
      if (run.ok) {
        toast.add({
          title: 'Sync complete',
          description: `${plural(run.deletableCount, 'item')} deletable, ${run.soonCount} leaving soon`,
          icon: 'i-lucide-check',
          color: 'success',
        })
      }
      else {
        toast.add({ title: 'Sync failed', description: run.error ?? undefined, icon: 'i-lucide-triangle-alert', color: 'error' })
      }
      await Promise.all([refresh(), refreshNuxtData('activity')])
    }
    catch (error: any) {
      toast.add({ title: 'Sync failed', description: error?.data?.message ?? String(error), color: 'error' })
    }
    finally {
      syncing.value = false
    }
  }

  return { syncing, sync }
}
