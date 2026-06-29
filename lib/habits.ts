import { supabaseAdmin } from '@/lib/supabase'
import { dayBounds, dateInTz, todayStr } from '@/lib/time'

export type MarkDoneResult = {
  habit: { id: string; name: string; emoji: string }
  marked: boolean
  streak: number
}

// Marks the reminder that's currently being nagged about (the oldest *due*
// pending reminder for a habit, by qr_token) as done and recomputes the current
// streak. Shared by /done/[token] (QR scan) and /api/scan (Telegram Mini App
// scan). Returns null if the token doesn't match a habit.
export async function markDone(token: string, source = 'qr'): Promise<MarkDoneResult | null> {
  const { data: habit } = await supabaseAdmin
    .from('habits')
    .select('id, name, emoji')
    .eq('qr_token', token)
    .single()

  if (!habit) return null

  const now = new Date()
  const { start: startOfDay, end: endOfDay } = dayBounds()

  // Mark the reminder the escalate job is actually nagging about: the oldest
  // pending one that's already due (scheduled_for <= now). Marking the *latest*
  // (e.g. tonight's 11 PM slot) would leave the overdue one pending and the
  // nags would never stop. If nothing is due yet (a proactive scan), fall back
  // to the earliest pending reminder of the day.
  let { data: reminder } = await supabaseAdmin
    .from('reminders')
    .select('id')
    .eq('habit_id', habit.id)
    .eq('status', 'pending')
    .gte('scheduled_for', startOfDay.toISOString())
    .lte('scheduled_for', now.toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!reminder) {
    const { data: upcoming } = await supabaseAdmin
      .from('reminders')
      .select('id')
      .eq('habit_id', habit.id)
      .eq('status', 'pending')
      .gte('scheduled_for', startOfDay.toISOString())
      .lte('scheduled_for', endOfDay.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(1)
      .maybeSingle()
    reminder = upcoming
  }

  let marked = false
  if (reminder) {
    await supabaseAdmin
      .from('reminders')
      .update({ status: 'done', done_at: now.toISOString(), source })
      .eq('id', reminder.id)
    marked = true
  }

  // Compute streak after marking
  const { data: past } = await supabaseAdmin
    .from('reminders')
    .select('scheduled_for, status')
    .eq('habit_id', habit.id)
    .in('status', ['done', 'missed'])
    .order('scheduled_for', { ascending: false })
    .limit(90)

  const byDate = new Map<string, string[]>()
  for (const r of past ?? []) {
    const d = dateInTz(r.scheduled_for)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(r.status)
  }

  // Include today's just-marked reminder
  const today = todayStr()
  if (marked) {
    if (!byDate.has(today)) byDate.set(today, [])
    byDate.get(today)!.push('done')
  }

  // Count today's pending reminders to decide if today counts for streak
  const { data: todayAll } = await supabaseAdmin
    .from('reminders')
    .select('id, status')
    .eq('habit_id', habit.id)
    .gte('scheduled_for', startOfDay.toISOString())
    .lte('scheduled_for', endOfDay.toISOString())

  const todayStatuses = (todayAll ?? []).map(r =>
    r.status === 'pending' && marked && r.id === reminder?.id ? 'done' : r.status
  )
  const todayAllDone = todayStatuses.length > 0 && todayStatuses.every(s => s === 'done')

  let streak = 0
  if (todayAllDone) {
    streak = 1
    const check = new Date(startOfDay)
    check.setDate(check.getDate() - 1)
    for (let i = 0; i < 89; i++) {
      const d = dateInTz(check)
      const s = byDate.get(d)
      if (!s || !s.every(x => x === 'done')) break
      streak++
      check.setDate(check.getDate() - 1)
    }
  } else {
    const check = new Date(startOfDay)
    check.setDate(check.getDate() - 1)
    for (let i = 0; i < 90; i++) {
      const d = dateInTz(check)
      const s = byDate.get(d)
      if (!s || !s.every(x => x === 'done')) break
      streak++
      check.setDate(check.getDate() - 1)
    }
  }

  return { habit, marked, streak }
}
