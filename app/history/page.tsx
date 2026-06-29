import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { dayBounds, dateInTz, todayStr } from '@/lib/time'

// History reflects reminder state that changes daily; render at request time.
export const dynamic = 'force-dynamic'

const PALETTE = [
  { accent: '#2dd4bf', glow: 'rgba(45,212,191,0.35)', chipBg: 'rgba(45,212,191,0.12)' },
  { accent: '#fbbf24', glow: 'rgba(251,191,36,0.35)',  chipBg: 'rgba(251,191,36,0.12)' },
  { accent: '#fdba74', glow: 'rgba(253,186,116,0.32)', chipBg: 'rgba(253,186,116,0.12)' },
]

type DayCell = { color: string }

async function getHistory() {
  const { data: habits } = await supabaseAdmin
    .from('habits').select('id, name, emoji').eq('active', true).order('created_at')
  if (!habits) return []

  // 30-day window ending today, in CDMX local days.
  const { start: todayStart, end: today } = dayBounds()
  const from = new Date(todayStart); from.setDate(from.getDate()-29)

  const dateList: string[] = []
  const cur = new Date(from)
  while (cur <= today) { dateList.push(dateInTz(cur)); cur.setDate(cur.getDate()+1) }

  return Promise.all(habits.map(async (h, idx) => {
    const { data: reminders } = await supabaseAdmin
      .from('reminders').select('scheduled_for, status')
      .eq('habit_id', h.id).gte('scheduled_for', from.toISOString()).lte('scheduled_for', today.toISOString())

    const byDate = new Map<string, string[]>()
    for (const r of reminders ?? []) {
      const d = dateInTz(r.scheduled_for)
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(r.status)
    }

    const cells: DayCell[] = dateList.map(date => {
      const s = (byDate.get(date) ?? []).filter(x => x !== 'pending')
      if (!s.length) return { color: '#1b2538' }
      if (s.every(x => x === 'done')) return { color: PALETTE[idx % PALETTE.length].accent }
      if (s.every(x => x === 'missed')) return { color: '#b45b5b' }
      return { color: '#fbbf24' }
    })

    const terminal = (reminders ?? []).filter(r => r.status !== 'pending')
    const done = terminal.filter(r => r.status === 'done').length
    const compliance = terminal.length > 0 ? Math.round((done / terminal.length) * 100) : null

    // Streak
    const check = new Date(); check.setDate(check.getDate()-1)
    let streak = 0
    for (let i=0;i<60;i++) {
      const d = dateInTz(check)
      const s = (byDate.get(d) ?? []).filter(x => x !== 'pending')
      if (!s.length || !s.every(x => x === 'done')) break
      streak++; check.setDate(check.getDate()-1)
    }
    const todayS = (byDate.get(todayStr()) ?? []).filter(x => x !== 'pending')
    if (todayS.length && todayS.every(x => x === 'done')) streak++

    return { ...h, cells, compliance, streak, colorIdx: idx % PALETTE.length }
  }))
}

export default async function HistoryPage() {
  const habits = await getHistory()

  return (
    <main style={{ minHeight:'100vh', background:'#070b13', color:'#f1f5f9' }}>
      <div style={{ maxWidth:448, margin:'0 auto', padding:'40px 20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <Link href="/" style={{ width:34, height:34, borderRadius:11, background:'#0d1320', border:'1px solid #1b2538', display:'flex', alignItems:'center', justifyContent:'center', color:'#5a6b85', textDecoration:'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <p style={{ font:'500 12px Geist,sans-serif', color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase' }}>Últimos 30 días</p>
            <h1 style={{ font:'700 32px Geist,sans-serif', color:'#f1f5f9', marginTop:4, letterSpacing:'-.02em' }}>Historial</h1>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {habits.map(h => {
            const pal = PALETTE[h.colorIdx]
            return (
              <div key={h.id} style={{ borderRadius:26, background:'#0d1320', border:'1px solid #1b2538', padding:'18px 18px 16px' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:16 }}>
                  <div style={{ width:40, height:40, borderRadius:13, background:pal.chipBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {h.emoji}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ font:'600 16px Geist,sans-serif', color:'#f1f5f9' }}>{h.name}</div>
                    {h.streak > 0 && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={pal.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                        <span style={{ font:'600 12px Geist,sans-serif', color:pal.accent }}>{h.streak} días de racha</span>
                      </div>
                    )}
                  </div>
                  {h.compliance !== null && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ font:'700 22px Geist,sans-serif', color:'#f1f5f9', letterSpacing:'-.02em' }}>{h.compliance}%</div>
                      <div style={{ font:'500 11px Geist,sans-serif', color:'#5a6b85' }}>cumplido</div>
                    </div>
                  )}
                </div>

                {/* Heatmap */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(30,1fr)', gap:2 }}>
                  {h.cells.map((c, i) => (
                    <div key={i} style={{ width:'100%', aspectRatio:'1', borderRadius:2, background:c.color }} />
                  ))}
                </div>

                {/* Date labels */}
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ font:'500 10px Geist,sans-serif', color:'#334155' }}>hace 30 días</span>
                  <span style={{ font:'500 10px Geist,sans-serif', color:'#334155' }}>hoy</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:24, padding:'0 4px' }}>
          {[
            { c:'#2dd4bf', l:'Hecho' },
            { c:'#fbbf24', l:'Parcial' },
            { c:'#b45b5b', l:'Fallado' },
            { c:'#1b2538', l:'Vacío' },
          ].map(g => (
            <div key={g.l} style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:12, height:12, borderRadius:3, background:g.c }} />
              <span style={{ font:'500 12px Geist,sans-serif', color:'#7c8aa3' }}>{g.l}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
