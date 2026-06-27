import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'

async function markDone(token: string) {
  // Find habit by qr_token
  const { data: habit } = await supabaseAdmin
    .from('habits')
    .select('id, name, emoji')
    .eq('qr_token', token)
    .single()

  if (!habit) return null

  // Get today's date range
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  // Find the most recent pending reminder for today
  const { data: reminder } = await supabaseAdmin
    .from('reminders')
    .select('id, nag_count')
    .eq('habit_id', habit.id)
    .eq('status', 'pending')
    .gte('scheduled_for', startOfDay.toISOString())
    .lte('scheduled_for', endOfDay.toISOString())
    .order('scheduled_for', { ascending: false })
    .limit(1)
    .single()

  if (!reminder) {
    return { habit, marked: false, streak: await getStreak(habit.id) }
  }

  await supabaseAdmin
    .from('reminders')
    .update({ status: 'done', done_at: now.toISOString(), source: 'qr' })
    .eq('id', reminder.id)

  return { habit, marked: true, streak: await getStreak(habit.id) }
}

async function getStreak(habitId: string): Promise<number> {
  const { data: reminders } = await supabaseAdmin
    .from('reminders')
    .select('scheduled_for, status')
    .eq('habit_id', habitId)
    .in('status', ['done', 'missed'])
    .order('scheduled_for', { ascending: false })
    .limit(90)

  if (!reminders || reminders.length === 0) return 0

  // Group by date and check consecutive done days
  const byDate = new Map<string, string[]>()
  for (const r of reminders) {
    const d = r.scheduled_for.slice(0, 10)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(r.status)
  }

  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  let checkDate = new Date(today)

  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10)
    const statuses = byDate.get(dateStr)
    if (!statuses) break
    const allDone = statuses.every(s => s === 'done')
    if (!allDone) break
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return streak
}

export default async function DonePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await markDone(token)

  if (!result) notFound()

  const { habit, marked, streak } = result

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-white">
      <div className="max-w-sm w-full text-center space-y-8">
        {marked ? (
          <>
            <div className="text-7xl animate-bounce">{habit.emoji}</div>
            <div>
              <h1 className="text-3xl font-bold text-teal-400">¡Registrado!</h1>
              <p className="text-slate-400 mt-2">{habit.name} marcado como hecho.</p>
            </div>
            {streak > 0 && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Racha actual</p>
                <p className="text-5xl font-bold text-teal-400">{streak}</p>
                <p className="text-slate-400 text-sm mt-1">{streak === 1 ? 'día' : 'días'} consecutivos</p>
              </div>
            )}
            <p className="text-slate-500 text-sm">
              {streak >= 7 ? '🔥 ¡Una semana seguida, increíble!' :
               streak >= 3 ? '💪 ¡Vas muy bien, sigue así!' :
               '✨ ¡Cada día cuenta!'}
            </p>
          </>
        ) : (
          <>
            <div className="text-7xl">{habit.emoji}</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-300">Nada pendiente ahora</h1>
              <p className="text-slate-400 mt-2">{habit.name} — no hay recordatorios pendientes para hoy.</p>
            </div>
            {streak > 0 && (
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                <p className="text-slate-400 text-sm">Racha: <span className="text-teal-400 font-bold">{streak} días</span></p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
