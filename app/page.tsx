import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

type Reminder = {
  id: string
  scheduled_for: string
  status: 'pending' | 'done' | 'missed'
  nag_count: number
}

type HabitWithReminders = {
  id: string
  name: string
  emoji: string
  qr_token: string
  reminders: Reminder[]
  streak: number
}

async function getTodayData(): Promise<HabitWithReminders[]> {
  const { data: habits } = await supabaseAdmin
    .from('habits')
    .select('id, name, emoji, qr_token')
    .eq('active', true)
    .order('created_at')

  if (!habits) return []

  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999)

  return Promise.all(habits.map(async h => {
    const { data: reminders } = await supabaseAdmin
      .from('reminders')
      .select('id, scheduled_for, status, nag_count')
      .eq('habit_id', h.id)
      .gte('scheduled_for', startOfDay.toISOString())
      .lte('scheduled_for', endOfDay.toISOString())
      .order('scheduled_for')

    // Streak
    const { data: past } = await supabaseAdmin
      .from('reminders')
      .select('scheduled_for, status')
      .eq('habit_id', h.id)
      .in('status', ['done', 'missed'])
      .lt('scheduled_for', startOfDay.toISOString())
      .order('scheduled_for', { ascending: false })
      .limit(60)

    const byDate = new Map<string, string[]>()
    for (const r of past ?? []) {
      const d = r.scheduled_for.slice(0, 10)
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(r.status)
    }

    let streak = 0
    const check = new Date(startOfDay)
    check.setDate(check.getDate() - 1)
    for (let i = 0; i < 60; i++) {
      const d = check.toISOString().slice(0, 10)
      const s = byDate.get(d)
      if (!s || !s.every(x => x === 'done')) break
      streak++
      check.setDate(check.getDate() - 1)
    }

    return { ...h, reminders: reminders ?? [], streak }
  }))
}

function statusColor(status: string) {
  if (status === 'done') return 'text-teal-400'
  if (status === 'missed') return 'text-red-400'
  return 'text-amber-400'
}

function statusIcon(status: string) {
  if (status === 'done') return '✅'
  if (status === 'missed') return '❌'
  return '⏳'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function habitSummaryStatus(reminders: Reminder[]): 'done' | 'missed' | 'pending' | 'empty' {
  if (reminders.length === 0) return 'empty'
  if (reminders.every(r => r.status === 'done')) return 'done'
  if (reminders.some(r => r.status === 'pending')) return 'pending'
  return 'missed'
}

function nextPending(reminders: Reminder[]): Reminder | null {
  return reminders.find(r => r.status === 'pending') ?? null
}

export default async function Home() {
  const habits = await getTodayData()

  const now = new Date()
  const dateLabel = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  const totalToday = habits.flatMap(h => h.reminders).length
  const doneToday = habits.flatMap(h => h.reminders).filter(r => r.status === 'done').length

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="px-5 pt-10 pb-6 max-w-lg mx-auto">
        <div>
          <p className="text-slate-500 text-sm capitalize">{dateLabel}</p>
          <h1 className="text-2xl font-bold mt-0.5 tracking-tight">Hoy</h1>
        </div>

        {/* Daily progress bar */}
        {totalToday > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{doneToday} de {totalToday} completados</span>
              <span>{Math.round((doneToday / totalToday) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${(doneToday / totalToday) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Habit cards */}
      <div className="px-5 pb-10 max-w-lg mx-auto space-y-4">
        {habits.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <p className="text-4xl mb-3">🌱</p>
            <p className="font-medium">No hay hábitos configurados.</p>
            <Link href="/config" className="text-teal-400 text-sm mt-2 inline-block hover:text-teal-300">
              Configura tus hábitos →
            </Link>
          </div>
        ) : (
          habits.map(habit => {
            const summary = habitSummaryStatus(habit.reminders)
            const next = nextPending(habit.reminders)

            return (
              <div
                key={habit.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  summary === 'done'
                    ? 'bg-teal-950/40 border-teal-800/50'
                    : summary === 'missed'
                    ? 'bg-red-950/30 border-red-900/40'
                    : 'bg-slate-800/80 border-slate-700/60'
                }`}
              >
                {/* Top row */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{habit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg leading-tight">{habit.name}</h2>
                    {next ? (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Próximo aviso: <span className="text-amber-400 font-medium">{formatTime(next.scheduled_for)}</span>
                      </p>
                    ) : summary === 'done' ? (
                      <p className="text-xs text-teal-400 mt-0.5">Todo hecho por hoy ✓</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-0.5">Sin recordatorios hoy</p>
                    )}
                  </div>
                  {/* Streak badge */}
                  {habit.streak > 0 && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-teal-400 leading-none">{habit.streak}</p>
                      <p className="text-xs text-slate-500">{habit.streak === 1 ? 'día' : 'días'}</p>
                    </div>
                  )}
                </div>

                {/* Reminder pills */}
                {habit.reminders.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {habit.reminders.map(r => (
                      <span
                        key={r.id}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium
                          ${r.status === 'done' ? 'bg-teal-900/60 text-teal-300' :
                            r.status === 'missed' ? 'bg-red-900/50 text-red-400' :
                            'bg-slate-700 text-slate-300'}`}
                      >
                        {statusIcon(r.status)} {formatTime(r.scheduled_for)}
                      </span>
                    ))}
                  </div>
                )}

                {/* No reminders materialized yet */}
                {habit.reminders.length === 0 && (
                  <p className="text-xs text-slate-600">
                    Los recordatorios se crean a las 00:05. Si es tu primer día,{' '}
                    <a href="/api/materialize-day" className="text-teal-600 underline">materializa manualmente</a>.
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
