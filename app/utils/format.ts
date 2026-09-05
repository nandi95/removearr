const GB = 1024 ** 3

export const gb = (bytes: number, digits = 1) => `${(bytes / GB).toFixed(digits)} GB`

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Unix seconds → "5 Sep 2026" */
export const shortDate = (seconds: number) => dateFormat.format(seconds * 1000)
/** ISO → "5 Sep, 06:00" */
export const dateTime = (iso: string) => timeFormat.format(new Date(iso))

/** Whole days between a unix-seconds timestamp and now. */
export const idleDays = (seconds: number | null, now = Date.now()) =>
  seconds ? Math.floor((now / 1000 - seconds) / 86400) : null

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** ISO → "2 hours ago" / "tomorrow" */
export function relativeTime(iso: string, now = Date.now()) {
  const diff = (Date.parse(iso) - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}

export const plural = (n: number, word: string) => `${n} ${n === 1 || word.endsWith('s') ? word : word + 's'}`
