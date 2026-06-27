import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

type DayStatus = 'done' | 'missed' | 'partial' | 'empty'

type HabitHistory = {
  id: string
  name: string
  emoji: string
  streak: number
  compliance: number | null
  days: { date: string; status: DayStatus }[]
}

async function getHistory(): Promise<HabitHistory[]> {
  const { data: habits } = await supabaseAdmin
    .from('habits')
    .select('id, name, emoji')
    .eq('active', true)
    .order('created_at')

  if (!habits) return []

  // Last 30 days
  const today = new Date(); today.setHours(23, 59, 59, 999)
  const from = new Date(today); from.setDate(from.getDate() - 29); from.setHours(0, 0, 0, 0)

  const dateList: string[] = []
  const cur = new Date(from)
  while (cur <= today) {
    dateList.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }

  return Promise.all(habits.map(async h => {
    const { data: reminders } = await supabaseAdmin
      .from('reminders')
      .select('scheduled_for, status')
      .eq('habit_id', h.id)
      .gte('scheduled_for', from.toISOString())
      .lte('scheduled_for', today.toISOString())
      .order('scheduled_for')

    const byDate = new Map<string, string[]>()
    for (const r of reminders ?? []) {
      const d = r.scheduled_for.slice(0, 10)
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(r.status)
    }

    const days = dateList.map(date => {
      const statuses = byDate.get(date) ?? []
      let status: DayStatus = 'empty'
      if (statuses.length > 0) {
        const terminal = statuses.filter(s => s !== 'pending')
        if (terminal.length === 0) status = 'empty'
        else if (terminal.every(s => s === 'done')) status = 'done'
        else if (terminal.every(s => s === 'missed')) status = 'missed'
        else status = 'partial'
      }
      return { date, status }
    })

    const terminal = (reminders ?? []).filter(r => r.status !== 'pending')
    const done = terminal.filter(r => r.status === 'done').length
    const compliance = terminal.length > 0 ? Math.round((done / terminal.length) * 100) : null

    // Streak
    const todayStr = new Date().toISOString().slice(0, 10)
    let streak = 0
    const check = new Date(); check.setDate(check.getDate() - 1)
    for (let i = 0; i < 60; i++) {
      const d = check.toISOString().slice(0, 10)
      const s = byDate.get(d)
      if (!s || !s.filter(x => x !== 'pending').every(x => x === 'done') || s.filter(x => x !== 'pending').length === 0) break
      streak++
      check.setDate(check.getDate() - 1)
    }
    // Include today if all done
    const todayS = byDate.get(todayStr)
    if (todayS && todayS.filter(x => x !== 'pending').length > 0 && todayS.filter(x => x !== 'pending').every(x => x === 'done')) {
      streak++
    }

    return { ...h, streak, compliance, days }
  }))
}

function dayColor(status: DayStatus) {
  if (status === 'done') return 'bg-teal-500'
  if (status === 'missed') return 'bg-red-700/70'
  if (status === 'partial') return 'bg-amber-600/70'
  return 'bg-slate-800'
}

function shortDay(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.getDate()
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().slice(0, 10)
}

export default async function HistoryPage() {
  const habits = await getHistory()

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-lg mx-auto px-5 pt-10 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors text-lg">←</Link>
          <h1 className="text-2xl font-bold tracking-tight">Historial</h1>
        </div>

        <div className="space-y-8">
          {habits.map(h => (
            <div key={h.id}>
              {/* Habit header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{h.emoji}</span>
                <div className="flex-1">
                  <h2 className="font-semibold">{h.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Últimos 30 días</p>
                </div>
                <div className="flex gap-4 text-right">
                  {h.compliance !== null && (
                    <div>
                      <p className="text-lg font-bold text-teal-400">{h.compliance}%</p>
                      <p className="text-xs text-slate-500">cumpl.</p>
                    </div>
                  )}
                  {h.streak > 0 && (
                    <div>
                      <p className="text-lg font-bold text-amber-400">{h.streak}</p>
                      <p className="text-xs text-slate-500">racha</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Heatmap grid — 5 rows × 6 cols = 30 days */}
              <div className="grid grid-cols-[repeat(30,1fr)] gap-1">
                {h.days.map(({ date, status }) => (
                  <div
                    key={date}
                    title={date}
                    className={`aspect-square rounded-sm ${dayColor(status)} ${isToday(date) ? 'ring-2 ring-white/40' : ''}`}
                  />
                ))}
              </div>

              {/* Month labels */}
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-slate-600">
                  {new Date(h.days[0].date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-xs text-slate-600">hoy</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-10 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-teal-500 inline-block" /> Hecho</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-600/70 inline-block" /> Parcial</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-700/70 inline-block" /> Fallado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-800 inline-block" /> Sin datos</span>
        </div>
      </div>
    </main>
  )
}
