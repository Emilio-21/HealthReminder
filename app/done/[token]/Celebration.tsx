'use client'

import { useEffect, useState } from 'react'

type Props = { emoji: string; habitName: string; streak: number; marked: boolean }

const MILESTONES: [number, string][] = [
  [100, '¡100 días! Eres una máquina imparable.'],
  [50,  '¡50 días seguidos! Absolutamente extraordinario.'],
  [30,  '¡Un mes entero sin fallar! Esto ya es parte de ti.'],
  [21,  '¡21 días! La ciencia dice que ya es un hábito.'],
  [14,  '¡Dos semanas seguidas! Lo estás logrando de verdad.'],
  [7,   'Una semana entera sin fallar. La cadena sigue intacta — no la rompas.'],
  [3,   '¡Tres días seguidos! El hábito está naciendo.'],
  [1,   '¡Primer día! El camino empieza aquí.'],
]

function getPhrase(streak: number) {
  for (const [n, phrase] of MILESTONES) if (streak >= n) return phrase
  return '¡Cada vez que lo haces, te cuidas un poco más!'
}

function getMilestoneLabel(streak: number): string | null {
  const exact = [1,3,7,14,21,30,50,100].find(n => n === streak)
  if (exact) return `Hito · ${exact} día${exact > 1 ? 's' : ''}`
  return null
}

const CONF_COLORS = ['#2dd4bf','#22d3ee','#fbbf24','#fdba74','#34d399','#f1f5f9']

function Confetti() {
  const pieces = Array.from({ length: 48 }, (_, i) => {
    const sz = 5 + (i % 7)
    return {
      left: `${(i * 2.1 + Math.sin(i * 0.7) * 30 + 50) % 100}%`,
      size: sz,
      color: CONF_COLORS[i % CONF_COLORS.length],
      radius: i % 3 === 0 ? '50%' : '2px',
      dur: `${2.6 + (i % 5) * 0.44}s`,
      delay: `${(i % 12) * 0.2}s`,
    }
  })
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:2 }}>
      {pieces.map((p, i) => (
        <span key={i} className="anim-conf-fall" style={{
          position:'absolute', top:-20, left:p.left,
          width:p.size, height:p.size,
          background:p.color, borderRadius:p.radius,
          animationDuration:p.dur, animationDelay:p.delay,
        }} />
      ))}
    </div>
  )
}

export default function Celebration({ emoji, habitName, streak, marked }: Props) {
  const [show, setShow] = useState(false)
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 60)
    const t2 = setTimeout(() => setConfetti(true), 120)
    const t3 = setTimeout(() => setConfetti(false), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const milestoneLabel = getMilestoneLabel(streak)
  const phrase = getPhrase(streak)

  if (!marked) return (
    <div className="anim-fade-up" style={{ textAlign:'center' }}>
      <div style={{ fontSize:64, marginBottom:24 }}>{emoji}</div>
      <h1 style={{ font:'700 26px Geist,sans-serif', color:'#94a3b8' }}>Nada pendiente ahora</h1>
      <p style={{ font:'500 14px Geist,sans-serif', color:'#5a6b85', marginTop:8 }}>{habitName} — no hay avisos activos en este momento.</p>
      {streak > 0 && (
        <div style={{ marginTop:24, display:'inline-flex', alignItems:'center', gap:8, background:'rgba(45,212,191,0.1)', borderRadius:99, padding:'8px 18px', border:'1px solid rgba(45,212,191,0.2)' }}>
          <span style={{ font:'700 18px Geist,sans-serif', color:'#2dd4bf' }}>{streak}</span>
          <span style={{ font:'500 13px Geist,sans-serif', color:'#94a3b8' }}>{streak === 1 ? 'día de racha' : 'días de racha'}</span>
        </div>
      )}
      <div style={{ marginTop:32 }}>
        <a href="/" style={{ font:'500 13px Geist,sans-serif', color:'#475569' }}>← Volver al inicio</a>
      </div>
    </div>
  )

  return (
    <>
      {confetti && <Confetti />}

      {/* Background aura */}
      <div className="anim-aura" style={{
        position:'fixed', width:460, height:460, borderRadius:'50%',
        top:-60, left:'50%', transform:'translateX(-50%)',
        background:'radial-gradient(circle,rgba(45,212,191,.4) 0%,rgba(52,211,153,.18) 38%,transparent 66%)',
        pointerEvents:'none', zIndex:0,
      }} />
      <div style={{
        position:'fixed', width:300, height:300, borderRadius:'50%',
        bottom:60, left:'50%', transform:'translateX(-50%)',
        background:'radial-gradient(circle,rgba(251,191,36,.16) 0%,transparent 70%)',
        pointerEvents:'none', zIndex:0,
      }} />

      <div style={{ position:'relative', zIndex:5, textAlign:'center', transition:'all .5s', opacity: show ? 1 : 0, transform: show ? 'none' : 'scale(0.9)' }}>
        {/* Check circle */}
        <div style={{ position:'relative', width:108, height:108, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 26px' }}>
          <div className="anim-ring-pop" style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1.5px solid rgba(45,212,191,0.4)' }} />
          <div className="anim-pop-in" style={{
            width:96, height:96, borderRadius:'50%',
            background:'linear-gradient(140deg,#2dd4bf,#34d399)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 16px 40px rgba(45,212,191,.5)',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#04221a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
        </div>

        {/* Habit badge */}
        <div style={{ display:'flex', alignItems:'center', gap:9, justifyContent:'center', marginBottom:14 }}>
          <div style={{ width:34, height:34, borderRadius:11, background:'rgba(45,212,191,.13)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{emoji}</div>
          <span style={{ font:'500 14px Geist,sans-serif', color:'#94a3b8' }}>{habitName}</span>
        </div>

        <h1 style={{ font:'800 38px Geist,sans-serif', color:'#2dd4bf', letterSpacing:'-.02em', textShadow:'0 0 30px rgba(45,212,191,.4)' }}>
          ¡Registrado!
        </h1>

        {/* Streak card */}
        {streak > 0 && (
          <div style={{
            marginTop:30, borderRadius:28,
            background:'rgba(13,19,32,0.7)',
            border: `1px solid ${milestoneLabel ? 'rgba(251,191,36,0.3)' : 'rgba(45,212,191,0.2)'}`,
            padding:'26px 22px 24px',
            display:'flex', flexDirection:'column', alignItems:'center',
            overflow:'hidden', position:'relative',
          }}>
            {/* Amber glow */}
            {milestoneLabel && (
              <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', top:-50, right:-40, background:'radial-gradient(circle,rgba(251,191,36,.22) 0%,transparent 70%)', pointerEvents:'none' }} />
            )}

            {milestoneLabel && (
              <div style={{ position:'relative', display:'flex', alignItems:'center', gap:7, background:'rgba(251,191,36,.16)', borderRadius:99, padding:'6px 12px', marginBottom:22 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                <span style={{ font:'600 12px Geist,sans-serif', color:'#fbbf24', letterSpacing:'.02em' }}>{milestoneLabel}</span>
              </div>
            )}

            {/* Big streak number */}
            <div style={{ position:'relative' }}>
              <span style={{
                font:'900 80px Geist,sans-serif',
                color: milestoneLabel ? '#fbbf24' : '#2dd4bf',
                letterSpacing:'-.04em',
                textShadow: milestoneLabel ? '0 0 40px rgba(251,191,36,.5)' : '0 0 40px rgba(45,212,191,.4)',
                lineHeight:1,
              }}>
                {streak}
              </span>
            </div>
            <div style={{ font:'600 15px Geist,sans-serif', color:'#94a3b8', marginTop:10, letterSpacing:'.18em', textTransform:'uppercase' }}>
              días seguidos
            </div>
          </div>
        )}

        {/* Phrase */}
        <p style={{ font:'500 14px Geist,sans-serif', color:'#94a3b8', marginTop:24, lineHeight:1.55, maxWidth:280, margin:'24px auto 0', textWrap:'pretty' } as React.CSSProperties}>
          {phrase}
        </p>

        <div style={{ marginTop:32, font:'500 13px Geist,sans-serif', color:'#475569' }}>
          Ya puedes cerrar esta ventana
        </div>
        <div style={{ marginTop:12 }}>
          <a href="/" style={{ font:'500 13px Geist,sans-serif', color:'#2dd4bf' }}>← Inicio</a>
        </div>
      </div>
    </>
  )
}
