import { supabaseAdmin } from '@/lib/supabase'

export type MarkDoneResult = {
  habit: { id: string; name: string; emoji: string }
  marked: boolean
  streak: number
}

// Marks the most recent pending reminder for a habit (by qr_token) as done and
// recomputes the current streak. Shared by /done/[token] (QR scan) and /api/scan
// (Telegram Mini App scan). Returns null if the token doesn't match a habit.
export async function markDone(token: string, source = 'qr'): Promise<MarkDoneResult | null> {
  const { data: habit } = await supabaseAdmin
    .from('habits')
    .select('id, name, emoji')
    .eq('qr_token', token)
    .single()

  if (!habit) return null

  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999)

  const { data: reminder } = await supabaseAdmin
    .from('reminders')
    .select('id')
    .eq('habit_id', habit.id)
    .eq('status', 'pending')
    .gte('scheduled_for', startOfDay.toISOString())
    .lte('scheduled_for', endOfDay.toISOString())
    .order('scheduled_for', { ascending: false })
    .limit(1)
    .single()

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
    const d = r.scheduled_for.slice(0, 10)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(r.status)
  }

  // Include today's just-marked reminder
  const todayStr = now.toISOString().slice(0, 10)
  if (marked) {
    if (!byDate.has(todayStr)) byDate.set(todayStr, [])
    byDate.get(todayStr)!.push('done')
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
      const d = check.toISOString().slice(0, 10)
      const s = byDate.get(d)
      if (!s || !s.every(x => x === 'done')) break
      streak++
      check.setDate(check.getDate() - 1)
    }
  } else {
    const check = new Date(startOfDay)
    check.setDate(check.getDate() - 1)
    for (let i = 0; i < 90; i++) {
      const d = check.toISOString().slice(0, 10)
      const s = byDate.get(d)
      if (!s || !s.every(x => x === 'done')) break
      streak++
      check.setDate(check.getDate() - 1)
    }
  }

  return { habit, marked, streak }
}
