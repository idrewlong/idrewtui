/**
 * Display helpers for the date shapes used in `app/data`.
 * Dates are stored as ISO strings and formatted in UTC so a visitor's timezone
 * can never shift a month backwards.
 */

/** '2024-06' → 'Jun 2024'. Returns the input unchanged if it isn't YYYY-MM. */
export function formatMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(iso)
  if (!match) return iso

  const [, year, month] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** '2025-01-07' → 'Jan 7, 2025'. Returns the input unchanged if malformed. */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** The `2024-06 ── 2026-05` range shown in the git-log view. */
export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} — ${end ? formatMonth(end) : 'present'}`
}

/** Machine-readable range for `<time>`, e.g. '2024-06/2026-05' or '2026-05/..'. */
export function machineRange(start: string, end: string | null): string {
  return `${start}/${end ?? '..'}`
}
