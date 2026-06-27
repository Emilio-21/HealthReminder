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

const PALETTE = [
  { accent: '#2dd4bf', chipBg: 'rgba(45,212,191,0.13)', glow: 'rgba(45,212,191,0.3)' },
  { accent: '#fbbf24', chipBg: 'rgba(251,191,36,0.13)',  glow: 'rgba(251,191,36,0.3)' },
  { accent: '#fdba74', chipBg: 'rgba(253,186,116,0.13)', glow: 'rgba(253,186,116,0.3)' },
]

const ICONS = ['💧','💊','❤️','🍃','☕','🌙','⚡','🔥','🔔','⏰']
const DAYS_LABELS = ['L','M','X','J','V','S','D']

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width:46, height:27, borderRadius:99, border:'none', cursor:'pointer',
        background: on ? '#2dd4bf' : '#1b2538',
        boxShadow: on ? '0 0 14px rgba(45,212,191,.4)' : 'none',
        position:'relative', transition:'background .2s',
        flexShrink:0,
      }}
    >
      <div style={{
        position:'absolute', width:21, height:21, borderRadius:'50%',
        background: on ? '#04221a' : '#5a6b85',
        top:3, transition:'left .2s',
        left: on ? 'calc(100% - 24px)' : 3,
      }} />
    </button>
  )
}

function EditCard({
  initial, pal, onSave, onCancel,
}: {
  initial?: Partial<Habit>
  pal: typeof PALETTE[0]
  onSave: (d: { name: string; emoji: string; schedule: Partial<Schedule> }) => void
  onCancel: () => void
}) {
  const s = initial?.schedules?.[0]
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '💧')
  const [active, setActive] = useState(initial?.active ?? true)
  const [mode, setMode] = useState<'fixed'|'interval'>(s?.mode ?? 'fixed')
  const [times, setTimes] = useState<string[]>(s?.fixed_times ?? ['08:00'])
  const [intervalMin, setIntervalMin] = useState(s?.interval_min ?? 120)
  const [winStart, setWinStart] = useState(s?.window_start ?? '08:00')
  const [winEnd, setWinEnd] = useState(s?.window_end ?? '21:00')
  const [days, setDays] = useState<number[]>(s?.days_of_week ?? [1,2,3,4,5,6,7])

  const toggleDay = (d: number) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())

  return (
    <div style={{
      borderRadius:26, background:'#0d1320',
      border:`1.5px solid ${pal.glow}`,
      padding:'18px 17px', position:'relative', overflow:'hidden',
    }}>
      {/* Corner glow */}
      <div style={{ position:'absolute', width:160, height:160, borderRadius:'50%', right:-50, top:-55, background:`radial-gradient(circle,${pal.glow} 0%,transparent 70%)`, pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ position:'relative', display:'flex', alignItems:'center', gap:11, marginBottom:18 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:pal.chipBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{emoji}</div>
        <span style={{ flex:1, font:'600 16px Geist,sans-serif', color:'#f1f5f9' }}>
          {initial?.name ? `Editando · ${initial.name}` : 'Nuevo hábito'}
        </span>
        <Toggle on={active} onChange={() => setActive(v => !v)} />
      </div>

      {/* Nombre */}
      <label style={{ font:'500 11px Geist,sans-serif', color:'#5a6b85', letterSpacing:'.08em', textTransform:'uppercase' }}>Nombre</label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Ej: Agua, Vitaminas AM"
        style={{
          marginTop:8, width:'100%', background:'#0a0f1a', border:'1px solid #1b2538',
          borderRadius:13, padding:'12px 14px', font:'600 15px Geist,sans-serif',
          color:'#e2e8f0', outline:'none',
        }}
      />

      {/* Ícono */}
      <label style={{ font:'500 11px Geist,sans-serif', color:'#5a6b85', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginTop:18 }}>Ícono</label>
      <div style={{ marginTop:9, display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
        {ICONS.map(ic => (
          <button key={ic} onClick={() => setEmoji(ic)} style={{
            aspectRatio:'1', borderRadius:13, border: ic === emoji ? `1.5px solid ${pal.accent}` : '1px solid #1b2538',
            background: ic === emoji ? pal.chipBg : '#0a0f1a',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, cursor:'pointer',
          }}>{ic}</button>
        ))}
      </div>

      {/* Tipo */}
      <label style={{ font:'500 11px Geist,sans-serif', color:'#5a6b85', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginTop:18 }}>Tipo de recordatorio</label>
      <div style={{ marginTop:9, display:'flex', gap:8, background:'#0a0f1a', border:'1px solid #1b2538', borderRadius:14, padding:4 }}>
        {(['fixed','interval'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, textAlign:'center', borderRadius:11, padding:'9px 0',
            font:'600 13px Geist,sans-serif', border:'none', cursor:'pointer',
            background: mode === m ? pal.chipBg : 'transparent',
            color: mode === m ? pal.accent : '#5a6b85',
          }}>
            {m === 'fixed' ? 'Horas fijas' : 'Intervalo'}
          </button>
        ))}
      </div>

      {/* Fixed times */}
      {mode === 'fixed' && (
        <>
          <label style={{ font:'500 11px Geist,sans-serif', color:'#5a6b85', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginTop:18 }}>Horarios</label>
          <div style={{ marginTop:9, display:'flex', flexWrap:'wrap', gap:8 }}>
            {times.map((t, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:6,
                background:'rgba(45,212,191,0.1)', border:'1px solid rgba(45,212,191,0.25)',
                borderRadius:11, padding:'8px 11px',
              }}>
                <input
                  type="time"
                  value={t}
                  onChange={e => setTimes(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                  style={{ font:'600 13px "Geist Mono",monospace', color:'#7fe9da', background:'transparent', border:'none', outline:'none' }}
                />
                {times.length > 1 && (
                  <button onClick={() => setTimes(prev => prev.filter((_,idx) => idx !== i))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#4b8c82', padding:0, display:'flex' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setTimes(p => [...p, '12:00'])} style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'1px dashed #2c3a52', borderRadius:11, padding:'8px 12px',
              background:'transparent', color:'#5a6b85', cursor:'pointer',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a6b85" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          </div>
        </>
      )}

      {/* Interval */}
      {mode === 'interval' && (
        <div style={{ marginTop:18 }}>
          <label style={{ font:'500 11px Geist,sans-serif', color:'#5a6b85', letterSpacing:'.08em', textTransform:'uppercase' }}>Cada (minutos)</label>
          <input type="number" min={15} max={480} step={15} value={intervalMin}
            onChange={e => setIntervalMin(Number(e.target.value))}
            style={{ marginTop:8, width:'100%', background:'#0a0f1a', border:'1px solid #1b2538', borderRadius:13, padding:'12px 14px', font:'600 15px Geist,sans-serif', color:'#e2e8f0', outline:'none' }}
          />
          <div style={{ display:'flex', gap:10, marginTop:10 }}>
            {[['Desde', winStart, setWinStart], ['Hasta', winEnd, setWinEnd]].map(([label, val, setter]) => (
              <div key={label as string} style={{ flex:1 }}>
                <label style={{ font:'500 11px Geist,sans-serif', color:'#5a6b85', letterSpacing:'.08em', textTransform:'uppercase' }}>{label as string}</label>
                <input type="time" value={val as string} onChange={e => (setter as (v:string)=>void)(e.target.value)}
                  style={{ marginTop:6, width:'100%', background:'#0a0f1a', border:'1px solid #1b2538', borderRadius:13, padding:'10px 12px', font:'600 14px Geist,sans-serif', color:'#e2e8f0', outline:'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Days */}
      <label style={{ font:'500 11px Geist,sans-serif', color:'#5a6b85', letterSpacing:'.08em', textTransform:'uppercase', display:'block', marginTop:18 }}>Días</label>
      <div style={{ marginTop:9, display:'flex', gap:6, justifyContent:'space-between' }}>
        {DAYS_LABELS.map((d, i) => {
          const dayNum = i + 1
          const on = days.includes(dayNum)
          return (
            <button key={d} onClick={() => toggleDay(dayNum)} style={{
              flex:1, aspectRatio:'1', borderRadius:12, border:'none', cursor:'pointer',
              background: on ? pal.chipBg : '#0a0f1a',
              color: on ? pal.accent : '#5a6b85',
              font:'600 13px Geist,sans-serif',
            }}>{d}</button>
          )
        })}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        <button onClick={onCancel} style={{
          flex:1, padding:'12px 0', borderRadius:14, border:'1px solid #1b2538',
          background:'transparent', color:'#5a6b85', font:'600 14px Geist,sans-serif', cursor:'pointer',
        }}>Cancelar</button>
        <button onClick={() => onSave({ name: name.trim(), emoji, schedule: { mode, days_of_week:days, window_start:winStart, window_end:winEnd, active, ...(mode==='fixed' ? { fixed_times:times } : { interval_min:intervalMin }) } })}
          disabled={!name.trim() || days.length === 0}
          style={{
            flex:1, padding:'12px 0', borderRadius:14, border:'none', cursor:'pointer',
            background:'linear-gradient(135deg,#2dd4bf,#22d3ee)',
            color:'#04221a', font:'700 14px Geist,sans-serif',
            opacity: (!name.trim() || days.length === 0) ? 0.4 : 1,
          }}>Guardar</button>
      </div>
    </div>
  )
}

function HabitRow({ habit, pal, onEdit, onDelete }: { habit: Habit; pal: typeof PALETTE[0]; onEdit: () => void; onDelete: () => void }) {
  const s = habit.schedules?.[0]
  const sub = s?.mode === 'fixed'
    ? `${s.fixed_times?.length ?? 0} avisos · ${s.days_of_week?.length === 7 ? 'todos los días' : `${s.days_of_week?.length} días`}`
    : s?.mode === 'interval'
    ? `Cada ${s.interval_min} min · ${s.window_start}–${s.window_end}`
    : 'Sin horario'

  return (
    <div style={{
      borderRadius:22, background: habit.active ? '#0b1018' : '#080c14',
      border:'1px solid #1b2538', padding:'14px 15px',
      display:'flex', alignItems:'center', gap:12,
      opacity: habit.active ? 1 : 0.5,
    }}>
      <div style={{ width:40, height:40, borderRadius:12, background:pal.chipBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{habit.emoji}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ font:'600 15px Geist,sans-serif', color:'#f1f5f9' }}>{habit.name}</div>
        <div style={{ font:'500 12px Geist,sans-serif', color:'#5a6b85', marginTop:2 }}>{sub}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <button onClick={onEdit} style={{ background:'none', border:'none', cursor:'pointer', color:'#5a6b85', display:'flex' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button onClick={onDelete} style={{ background:'none', border:'none', cursor:'pointer', color:'#334155', display:'flex' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const [unlocked] = useState(true)
  const [pass] = useState('')
  const [passErr] = useState('')
  const [habits, setHabits] = useState<Habit[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  // passphrase removed — open access

  async function load() {
    const r = await fetch('/api/habits')
    setHabits(await r.json())
  }

  async function save(data: { name:string; emoji:string; schedule: object }) {
    if (editingId) {
      await fetch(`/api/habits/${editingId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
      setEditingId(null)
    } else {
      await fetch('/api/habits', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
      setShowNew(false)
    }
    load()
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar este hábito?')) return
    await fetch(`/api/habits/${id}`, { method:'DELETE' })
    load()
  }

  void pass; void passErr; void unlocked

  return (
    <main style={{ minHeight:'100vh', background:'#070b13', color:'#f1f5f9' }}>
      <div style={{ maxWidth:448, margin:'0 auto', padding:'40px 20px 32px' }}>
        {/* Header */}
        <h1 style={{ font:'700 32px Geist,sans-serif', color:'#f1f5f9', letterSpacing:'-.02em' }}>Ajustes</h1>
        <div style={{ marginBottom:20 }} />

        {/* New habit button */}
        <button onClick={() => { setShowNew(true); setEditingId(null) }} style={{
          width:'100%', padding:'15px 0', borderRadius:18, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#2dd4bf,#22d3ee)',
          color:'#04221a', font:'700 15px Geist,sans-serif',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          boxShadow:'0 10px 26px rgba(45,212,191,.3)', marginBottom:18,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04221a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nuevo hábito
        </button>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* New habit form */}
          {showNew && (
            <EditCard pal={PALETTE[habits.length % PALETTE.length]} onSave={save} onCancel={() => setShowNew(false)} />
          )}

          {/* Existing habits */}
          {habits.map((h, idx) => (
            editingId === h.id
              ? <EditCard key={h.id} initial={h} pal={PALETTE[idx % PALETTE.length]} onSave={save} onCancel={() => setEditingId(null)} />
              : <HabitRow key={h.id} habit={h} pal={PALETTE[idx % PALETTE.length]} onEdit={() => { setEditingId(h.id); setShowNew(false) }} onDelete={() => del(h.id)} />
          ))}
        </div>

        {habits.length === 0 && !showNew && (
          <p style={{ textAlign:'center', color:'#334155', font:'500 14px Geist,sans-serif', marginTop:32 }}>No hay hábitos. Crea uno arriba.</p>
        )}
      </div>
    </main>
  )
}
