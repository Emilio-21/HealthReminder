'use client'

import { useEffect, useState } from 'react'

type Schedule = {
  id: string
  mode: 'fixed' | 'interval'
  fixed_times: string[] | null
  interval_min: number | null
  window_start: string
  window_end: string
  days_of_week: number[]
  active: boolean
}

type Habit = {
  id: string
  name: string
  emoji: string
  qr_token: string
  active: boolean
  schedules: Schedule[]
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

const EMOJIS = ['💧', '🌅', '🌙', '💊', '🏃', '🥗', '☕', '🧘', '💤', '🫀']

function HabitForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Habit>
  onSave: (data: { name: string; emoji: string; schedule: Partial<Schedule> }) => void
  onCancel: () => void
}) {
  const sched = initial?.schedules?.[0]
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '💧')
  const [mode, setMode] = useState<'fixed' | 'interval'>(sched?.mode ?? 'fixed')
  const [fixedTimes, setFixedTimes] = useState<string[]>(sched?.fixed_times ?? ['08:00'])
  const [intervalMin, setIntervalMin] = useState(sched?.interval_min ?? 120)
  const [windowStart, setWindowStart] = useState(sched?.window_start ?? '08:00')
  const [windowEnd, setWindowEnd] = useState(sched?.window_end ?? '21:00')
  const [days, setDays] = useState<number[]>(sched?.days_of_week ?? ALL_DAYS)

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  function addFixedTime() {
    setFixedTimes(prev => [...prev, '12:00'])
  }

  function removeFixedTime(i: number) {
    setFixedTimes(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    if (!name.trim()) return
    const schedule: Partial<Schedule> = {
      mode,
      days_of_week: days,
      window_start: windowStart,
      window_end: windowEnd,
      ...(mode === 'fixed'
        ? { fixed_times: fixedTimes }
        : { interval_min: intervalMin }),
    }
    onSave({ name: name.trim(), emoji, schedule })
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre</label>
        <input
          className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Agua, Vitaminas AM"
        />
      </div>

      {/* Emoji */}
      <div>
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Emoji</label>
        <div className="mt-1 flex gap-2 flex-wrap">
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-2xl p-1 rounded-lg transition-colors ${emoji === e ? 'bg-teal-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div>
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo de horario</label>
        <div className="mt-1 flex gap-2">
          <button
            onClick={() => setMode('fixed')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'fixed' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Horas fijas
          </button>
          <button
            onClick={() => setMode('interval')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'interval' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Cada N minutos
          </button>
        </div>
      </div>

      {/* Fixed times */}
      {mode === 'fixed' && (
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Horas</label>
          <div className="mt-1 space-y-2">
            {fixedTimes.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="time"
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  value={t}
                  onChange={e => setFixedTimes(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                />
                {fixedTimes.length > 1 && (
                  <button onClick={() => removeFixedTime(i)} className="text-slate-500 hover:text-red-400 text-lg">✕</button>
                )}
              </div>
            ))}
            <button onClick={addFixedTime} className="text-sm text-teal-400 hover:text-teal-300">+ Agregar hora</button>
          </div>
        </div>
      )}

      {/* Interval */}
      {mode === 'interval' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cada cuántos minutos</label>
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              value={intervalMin}
              onChange={e => setIntervalMin(Number(e.target.value))}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Desde</label>
              <input
                type="time"
                className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                value={windowStart}
                onChange={e => setWindowStart(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Hasta</label>
              <input
                type="time"
                className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                value={windowEnd}
                onChange={e => setWindowEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Days of week */}
      <div>
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Días</label>
        <div className="mt-1 flex gap-1">
          {DAYS.map((d, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i + 1)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${days.includes(i + 1) ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700 text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || days.length === 0}
          className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function unlock() {
    const res = await fetch('/api/config/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase }),
    })
    if (res.ok) {
      setUnlocked(true)
      loadHabits()
    } else {
      setError('Contraseña incorrecta')
    }
  }

  async function loadHabits() {
    setLoading(true)
    const res = await fetch('/api/habits')
    const data = await res.json()
    setHabits(data)
    setLoading(false)
  }

  async function createHabit(data: { name: string; emoji: string; schedule: Partial<Schedule> }) {
    setSaving(true)
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setShowNew(false)
    await loadHabits()
    setSaving(false)
  }

  async function updateHabit(id: string, data: { name: string; emoji: string; schedule: Partial<Schedule> }) {
    setSaving(true)
    await fetch(`/api/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setEditingId(null)
    await loadHabits()
    setSaving(false)
  }

  async function toggleActive(habit: Habit) {
    await fetch(`/api/habits/${habit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !habit.active }),
    })
    await loadHabits()
  }

  async function deleteHabit(id: string) {
    if (!confirm('¿Eliminar este hábito y todos sus recordatorios?')) return
    await fetch(`/api/habits/${id}`, { method: 'DELETE' })
    await loadHabits()
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
        <div className="max-w-sm w-full space-y-4">
          <h1 className="text-2xl font-bold text-white text-center">Configuración</h1>
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500"
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlock()}
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={unlock}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-lg text-white font-medium transition-colors"
          >
            Entrar
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hábitos</h1>
          <button
            onClick={() => { setShowNew(true); setEditingId(null) }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
          >
            + Nuevo
          </button>
        </div>

        {showNew && (
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="font-semibold mb-4 text-slate-200">Nuevo hábito</h2>
            <HabitForm
              onSave={createHabit}
              onCancel={() => setShowNew(false)}
            />
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-center py-8">Cargando...</p>
        ) : habits.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No hay hábitos. Crea uno.</p>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => (
              <div key={habit.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                {editingId === habit.id ? (
                  <div className="p-5">
                    <h2 className="font-semibold mb-4 text-slate-200">Editar: {habit.name}</h2>
                    <HabitForm
                      initial={habit}
                      onSave={data => updateHabit(habit.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{habit.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${habit.active ? 'text-white' : 'text-slate-500'}`}>
                          {habit.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {habit.schedules?.[0]?.mode === 'fixed'
                            ? `Fijo: ${habit.schedules[0].fixed_times?.join(', ')}`
                            : habit.schedules?.[0]?.mode === 'interval'
                            ? `Cada ${habit.schedules[0].interval_min} min (${habit.schedules[0].window_start}–${habit.schedules[0].window_end})`
                            : 'Sin horario'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(habit)}
                          className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${habit.active ? 'bg-teal-900 text-teal-400' : 'bg-slate-700 text-slate-500'}`}
                        >
                          {habit.active ? 'Activo' : 'Inactivo'}
                        </button>
                        <button
                          onClick={() => setEditingId(habit.id)}
                          className="text-slate-400 hover:text-white text-sm px-2"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="text-slate-500 hover:text-red-400 text-sm px-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 text-center">
          <a href="/print-qr" className="text-sm text-teal-400 hover:text-teal-300">
            🖨️ Imprimir QR codes
          </a>
        </div>
      </div>
    </main>
  )
}
