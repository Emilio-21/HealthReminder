import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Convert a wall-clock date+time in the given IANA timezone to the correct UTC instant.
// `timeStr` may be "HH:MM" or "HH:MM:SS" (Postgres `time` columns include seconds).
function zonedToUtc(dateStr: string, timeStr: string, tz: string): Date {
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr // normalize to HH:MM:SS
  // Treat the wall clock as if it were UTC, then correct by the zone's offset.
  // Compute the offset by formatting the same instant in UTC and in tz; the
  // server's own timezone cancels out, so this works regardless of where it runs.
  const naiveUtc = new Date(`${dateStr}T${time}Z`)
  const asUtc = new Date(naiveUtc.toLocaleString('en-US', { timeZone: 'UTC' }))
  const asTz = new Date(naiveUtc.toLocaleString('en-US', { timeZone: tz }))
  const offset = asUtc.getTime() - asTz.getTime()
  return new Date(naiveUtc.getTime() + offset)
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: cfg } = await supabaseAdmin.from('config').select('timezone').eq('id', 1).single()
  const tz = cfg?.timezone ?? 'America/Mexico_City'

  // Today's date in the configured timezone
  const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  const dayOfWeek = nowLocal.getDay() === 0 ? 7 : nowLocal.getDay() // 1=Mon...7=Sun
  const dateStr = nowLocal.toISOString().slice(0, 10) // YYYY-MM-DD

  const { data: schedules, error } = await supabaseAdmin
    .from('schedules')
    .select('*, habits(id, name, active)')
    .eq('active', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const toInsert: {
    habit_id: string
    scheduled_for: string
    status: string
  }[] = []

  for (const s of schedules ?? []) {
    const habit = s.habits as { id: string; name: string; active: boolean }
    if (!habit?.active) continue
    if (!s.days_of_week?.includes(dayOfWeek)) continue

    if (s.mode === 'fixed' && s.fixed_times) {
      for (const t of s.fixed_times) {
        const scheduled = zonedToUtc(dateStr, t, tz)
        toInsert.push({ habit_id: habit.id, scheduled_for: scheduled.toISOString(), status: 'pending' })
      }
    }

    if (s.mode === 'interval' && s.interval_min && s.window_start && s.window_end) {
      const start = zonedToUtc(dateStr, s.window_start, tz)
      const end = zonedToUtc(dateStr, s.window_end, tz)
      let cur = new Date(start)
      while (cur <= end) {
        toInsert.push({ habit_id: habit.id, scheduled_for: cur.toISOString(), status: 'pending' })
        cur = new Date(cur.getTime() + s.interval_min * 60 * 1000)
      }
    }
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0 })
  }

  const { error: insertErr, count } = await supabaseAdmin
    .from('reminders')
    .upsert(toInsert, { onConflict: 'habit_id,scheduled_for', ignoreDuplicates: true })
    .select()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({ created: toInsert.length })
}
