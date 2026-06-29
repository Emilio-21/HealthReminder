// Timezone helpers. All "today" boundaries in the app must be computed in the
// user's timezone (CDMX), not the server's (UTC on Vercel) — otherwise reminders
// near local midnight land in the wrong day.

export const TZ = 'America/Mexico_City'

// Convert a wall-clock date+time in the given IANA timezone to the correct UTC
// instant. `timeStr` may be "HH:MM" or "HH:MM:SS" (Postgres `time` columns
// include seconds). Treat the wall clock as if it were UTC, then correct by the
// zone's offset — the server's own timezone cancels out, so this works wherever
// it runs.
export function zonedToUtc(dateStr: string, timeStr: string, tz: string = TZ): Date {
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  const naiveUtc = new Date(`${dateStr}T${time}Z`)
  const asUtc = new Date(naiveUtc.toLocaleString('en-US', { timeZone: 'UTC' }))
  const asTz = new Date(naiveUtc.toLocaleString('en-US', { timeZone: tz }))
  const offset = asUtc.getTime() - asTz.getTime()
  return new Date(naiveUtc.getTime() + offset)
}

// The calendar date ("YYYY-MM-DD") that an instant falls on in `tz`. en-CA
// formats as YYYY-MM-DD. Use this to bucket reminders by local day instead of
// the UTC date embedded in their ISO string (which is off for evening times).
export function dateInTz(d: Date | string, tz: string = TZ): string {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: tz })
}

// Current date as "YYYY-MM-DD" in `tz`.
export function todayStr(tz: string = TZ, now: Date = new Date()): string {
  return dateInTz(now, tz)
}

// The UTC instants bounding "today" (00:00:00–23:59:59) in `tz`.
export function dayBounds(tz: string = TZ, now: Date = new Date()) {
  const date = todayStr(tz, now)
  return {
    date,
    start: zonedToUtc(date, '00:00:00', tz),
    end: zonedToUtc(date, '23:59:59', tz),
  }
}
