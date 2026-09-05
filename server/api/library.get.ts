import type { LibraryResponse } from '#shared/types'

export default defineEventHandler(async (): Promise<LibraryResponse> => {
  const [library, last] = await Promise.all([getLibrary(), lastSync()])

  return { ...library, lastSync: last, nextRun: nextRun(), deleteAfterDays: config.deleteAfterDays }
})
