import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: habits } = await supabaseAdmin
    .from('habits')
    .select('id, name, emoji')
    .eq('active', true)
    .order('created_at')

  if (!habits) return NextResponse.json([])

  const stats = await Promise.all(habits.map(async h => {
    const { data: reminders } = await supabaseAdmin
      .from('reminders')
      .select('scheduled_for, status')
      .eq('habit_id', h.id)
      .in('status', ['done', 'missed'])
      .order('scheduled_for', { ascending: false })
      .limit(90)

    const total = reminders?.length ?? 0
    const done = reminders?.filter(r => r.status === 'done').length ?? 0
    const compliance = total > 0 ? Math.round((done / total) * 100) : null

    // Streak: consecutive days where ALL reminders were done
    const byDate = new Map<string, string[]>()
    for (const r of reminders ?? []) {
      const d = r.scheduled_for.slice(0, 10)
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(r.status)
    }

    let streak = 0
    const checkDate = new Date()
    checkDate.setHours(0, 0, 0, 0)

    for (let i = 0; i < 90; i++) {
      const d = checkDate.toISOString().slice(0, 10)
      const statuses = byDate.get(d)
      if (!statuses) {
        // today with no terminal status yet — skip, don't break streak
        if (i === 0) { checkDate.setDate(checkDate.getDate() - 1); continue }
        break
      }
      if (!statuses.every(s => s === 'done')) break
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    return { ...h, streak, compliance, total, done }
  }))

  return NextResponse.json(stats)
}
