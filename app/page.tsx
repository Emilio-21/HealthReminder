import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Clock from './Clock'
import { dayBounds, dateInTz, TZ } from '@/lib/time'

// Reminder state changes throughout the day (scans, nags, manual edits), so the
// page must reflect the DB on every request rather than being prerendered.
export const dynamic = 'force-dynamic'

type Reminder = { id: string; scheduled_for: string; status: 'pending' | 'done' | 'missed' }

type HabitWithData = {
  id: string; name: string; emoji: string
  reminders: Reminder[]; streak: number; colorIdx: number
}

// Palette per habit (cycles by creation order)
const PALETTE = [
  { accent: '#2dd4bf', glow: 'rgba(45,212,191,0.45)', chipBg: 'rgba(45,212,191,0.13)' },
  { accent: '#fbbf24', glow: 'rgba(251,191,36,0.42)',  chipBg: 'rgba(251,191,36,0.13)' },
  { accent: '#fdba74', glow: 'rgba(253,186,116,0.4)',  chipBg: 'rgba(253,186,116,0.13)' },
]

async function getTodayData(): Promise<HabitWithData[]> {
  const { data: habits } = await supabaseAdmin
    .from('habits').select('id, name, emoji').eq('active', true).order('created_at')
  if (!habits) return []

  const { start: s, end: e } = dayBounds()

  return Promise.all(habits.map(async (h, idx) => {
    const { data: reminders } = await supabaseAdmin
      .from('reminders').select('id, scheduled_for, status')
      .eq('habit_id', h.id).gte('scheduled_for', s.toISOString()).lte('scheduled_for', e.toISOString())
      .order('scheduled_for')

    const { data: past } = await supabaseAdmin
      .from('reminders').select('scheduled_for, status')
      .eq('habit_id', h.id).in('status', ['done','missed'])
      .lt('scheduled_for', s.toISOString()).order('scheduled_for', { ascending: false }).limit(60)

    const byDate = new Map<string, string[]>()
    for (const r of past ?? []) {
      const d = dateInTz(r.scheduled_for)
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(r.status)
    }
    let streak = 0
    const check = new Date(s); check.setDate(check.getDate()-1)
    for (let i=0;i<60;i++) {
      const d = dateInTz(check)
      const st = byDate.get(d)
      if (!st || !st.every(x => x==='done')) break
      streak++; check.setDate(check.getDate()-1)
    }

    return { ...h, reminders: reminders ?? [], streak, colorIdx: idx % PALETTE.length }
  }))
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
}

function ReminderPill({ r, accent }: { r: Reminder; accent: string }) {
  if (r.status === 'done') return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(45,212,191,0.13)', borderRadius:99, padding:'6px 10px' }}>
      <span style={{ font:'600 12px Geist,sans-serif', color: accent, letterSpacing:'.01em' }}>{formatTime(r.scheduled_for)}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
    </span>
  )
  if (r.status === 'missed') return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(180,91,91,0.13)', borderRadius:99, padding:'6px 10px' }}>
      <span style={{ font:'600 12px Geist,sans-serif', color:'#cf8a8a' }}>{formatTime(r.scheduled_for)}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cf8a8a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </span>
  )
  // pending
  return (
    <span className="anim-pend-pulse" style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(251,191,36,0.16)', borderRadius:99, padding:'6px 10px', border:'1.5px solid rgba(251,191,36,0.5)' }}>
      <span style={{ font:'600 12px Geist,sans-serif', color:'#fbbf24' }}>{formatTime(r.scheduled_for)}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    </span>
  )
}

export default async function Home() {
  const habits = await getTodayData()
  const now = new Date()
  const dateLabel = now.toLocaleDateString('es-MX', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })
  const allR = habits.flatMap(h => h.reminders)
  const done = allR.filter(r => r.status === 'done').length
  const total = allR.length
  const next = habits.flatMap(h => h.reminders).filter(r => r.status === 'pending').sort((a,b) => a.scheduled_for.localeCompare(b.scheduled_for))[0]

  return (
    <main className="min-h-screen" style={{ background: '#070b13', color: '#f1f5f9' }}>
      <div className="px-5 pt-10 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div style={{ minWidth:0 }}>
            <p style={{ font:'500 12px Geist,sans-serif', color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase' }} className="capitalize">{dateLabel}</p>
            <h1 style={{ font:'700 34px Geist,sans-serif', color:'#f1f5f9', marginTop:5, letterSpacing:'-.02em' }}>Hoy</h1>
          </div>
          <Clock />
        </div>

        {/* Progress */}
        {total > 0 && (
          <div style={{ marginTop:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, height:9, background:'#16202f', borderRadius:99, overflow:'hidden' }}>
                <div style={{ width:`${(done/total)*100}%`, height:'100%', background:'linear-gradient(90deg,#2dd4bf,#22d3ee)', borderRadius:99, boxShadow:'0 0 14px rgba(45,212,191,.5)', transition:'width .5s ease' }} />
              </div>
              <span style={{ font:'600 13px Geist,sans-serif', color:'#cbd5e1' }}>{done} / {total}</span>
            </div>
            <p style={{ font:'500 12px Geist,sans-serif', color:'#5a6b85', marginTop:9 }}>
              {done === total && total > 0 ? '¡Todo hecho por hoy! 🎉' : `${done} de ${total} avisos completados`}
            </p>
          </div>
        )}

        {/* Next alert banner */}
        {next && (
          <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:7, background:'rgba(45,212,191,.08)', borderRadius:99, padding:'8px 14px', alignSelf:'flex-start', width:'fit-content' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span style={{ font:'600 12px Geist,sans-serif', color:'#2dd4bf' }}>Próximo aviso · {formatTime(next.scheduled_for)}</span>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="px-5 pb-8 max-w-lg mx-auto" style={{ display:'flex', flexDirection:'column', gap:14, marginTop:8 }}>
        {habits.length === 0 ? (
          <div style={{ textAlign:'center', paddingTop:64, paddingBottom:64 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🌱</div>
            <p style={{ font:'600 16px Geist,sans-serif', color:'#f1f5f9' }}>No hay hábitos configurados.</p>
            <Link href="/config" style={{ font:'500 14px Geist,sans-serif', color:'#2dd4bf', marginTop:8, display:'inline-block' }}>Configura tus hábitos →</Link>
          </div>
        ) : (
          habits.map(h => {
            const pal = PALETTE[h.colorIdx]
            const nextPending = h.reminders.find(r => r.status === 'pending')
            const allDone = h.reminders.length > 0 && h.reminders.every(r => r.status === 'done')

            return (
              <div key={h.id} style={{
                position:'relative', borderRadius:28, padding:'18px 18px 16px',
                background: '#0d1320', border: `1px solid ${allDone ? pal.accent+'33' : '#1b2538'}`,
                overflow:'hidden',
              }}>
                {/* Corner glow */}
                <div style={{ position:'absolute', width:190, height:190, borderRadius:'50%', right:-55, top:-65, background:`radial-gradient(circle,${pal.glow} 0%,transparent 68%)`, pointerEvents:'none' }} />

                {/* Top row */}
                <div style={{ position:'relative', display:'flex', alignItems:'center', gap:13, marginBottom:16 }}>
                  <div style={{ width:48, height:48, borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', background:pal.chipBg, flexShrink:0, fontSize:24 }}>
                    {h.emoji}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ font:'600 17px Geist,sans-serif', color:'#f1f5f9' }}>{h.name}</div>
                    <div style={{ font:'500 12px Geist,sans-serif', color:'#64748b', marginTop:3 }}>
                      {nextPending
                        ? <>Próximo · <span style={{ color:'#fbbf24' }}>{formatTime(nextPending.scheduled_for)}</span></>
                        : allDone ? <span style={{ color: pal.accent }}>Todo hecho ✓</span>
                        : 'Sin recordatorios hoy'}
                    </div>
                  </div>
                  {/* Streak badge */}
                  {h.streak > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, background:pal.chipBg, borderRadius:99, padding:'7px 12px 7px 10px', flexShrink:0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={pal.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                      <span style={{ font:'700 15px Geist,sans-serif', color:pal.accent }}>{h.streak}</span>
                    </div>
                  )}
                </div>

                {/* Pills */}
                {h.reminders.length > 0 ? (
                  <div style={{ position:'relative', display:'flex', flexWrap:'wrap', gap:7 }}>
                    {h.reminders.map(r => <ReminderPill key={r.id} r={r} accent={pal.accent} />)}
                  </div>
                ) : (
                  <p style={{ font:'500 12px Geist,sans-serif', color:'#334155', position:'relative' }}>
                    Los recordatorios se crean a las 00:05.
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
