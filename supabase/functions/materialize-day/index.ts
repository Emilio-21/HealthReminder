// Supabase Edge Function — called by pg_cron daily at 00:05 local time
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(SUPABASE_URL, SERVICE_ROLE)

// Convert a wall-clock date+time in `tz` to the correct UTC instant.
// `timeStr` may be "HH:MM" or "HH:MM:SS" (Postgres `time` columns include seconds).
function zonedToUtc(dateStr: string, timeStr: string, tz: string): Date {
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  const naiveUtc = new Date(`${dateStr}T${time}Z`)
  const asUtc = new Date(naiveUtc.toLocaleString('en-US', { timeZone: 'UTC' }))
  const asTz = new Date(naiveUtc.toLocaleString('en-US', { timeZone: tz }))
  const offset = asUtc.getTime() - asTz.getTime()
  return new Date(naiveUtc.getTime() + offset)
}

Deno.serve(async () => {
  const { data: cfg } = await db.from('config').select('timezone').eq('id', 1).single()
  const tz = cfg?.timezone ?? 'America/Mexico_City'

  const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  const dayOfWeek = nowLocal.getDay() === 0 ? 7 : nowLocal.getDay()
  const dateStr = nowLocal.toISOString().slice(0, 10)

  const { data: schedules, error } = await db
    .from('schedules')
    .select('*, habits(id, name, active)')
    .eq('active', true)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const toInsert: { habit_id: string; scheduled_for: string; status: string }[] = []

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

  if (toInsert.length === 0) return new Response(JSON.stringify({ created: 0 }))

  const { error: insertErr } = await db
    .from('reminders')
    .upsert(toInsert, { onConflict: 'habit_id,scheduled_for', ignoreDuplicates: true })

  if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 })

  return new Response(JSON.stringify({ created: toInsert.length }))
})
