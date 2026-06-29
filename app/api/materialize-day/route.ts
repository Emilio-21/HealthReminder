import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { zonedToUtc, todayStr } from '@/lib/time'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: cfg } = await supabaseAdmin.from('config').select('timezone').eq('id', 1).single()
  const tz = cfg?.timezone ?? 'America/Mexico_City'

  // Today's date in the configured timezone
  const dateStr = todayStr(tz) // YYYY-MM-DD
  // Weekday of that local date (parse as UTC midnight so getUTCDay is stable).
  const utcDay = new Date(`${dateStr}T00:00:00Z`).getUTCDay()
  const dayOfWeek = utcDay === 0 ? 7 : utcDay // 1=Mon...7=Sun

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
