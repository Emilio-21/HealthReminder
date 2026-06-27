'use client'

import { useEffect, useState } from 'react'

type Props = {
  emoji: string
  habitName: string
  streak: number
  marked: boolean
}

const MOTIVATIONAL: Record<number, string> = {
  1: '¡Primer día, el camino empieza aquí!',
  3: '¡Tres días seguidos! El hábito está naciendo.',
  7: '¡Una semana completa! Eso es disciplina real.',
  14: '¡Dos semanas! Ya es parte de ti.',
  21: '¡21 días! La ciencia dice que ya es un hábito.',
  30: '¡Un mes! Absolutamente imparable.',
  50: '¡50 días! Eres una máquina.',
  100: '¡100 días! Leyenda.',
}

function getMotivation(streak: number): string {
  const milestones = Object.keys(MOTIVATIONAL).map(Number).sort((a, b) => b - a)
  for (const m of milestones) {
    if (streak >= m) return MOTIVATIONAL[m]
  }
  if (streak > 1) return `¡${streak} días seguidos! Sigue así.`
  return '¡Cada vez que lo haces, te cuidas un poco más!'
}

function isMilestone(streak: number): boolean {
  return [1, 3, 7, 14, 21, 30, 50, 100].includes(streak)
}

// Confetti particle
function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i)
  const colors = ['#2dd4bf', '#34d399', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa']

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map(i => {
        const color = colors[i % colors.length]
        const left = `${(i * 2.5 + Math.sin(i) * 20 + 50) % 100}%`
        const delay = `${(i * 0.07) % 1.5}s`
        const duration = `${1.2 + (i % 5) * 0.3}s`
        const size = `${6 + (i % 4) * 3}px`
        return (
          <div
            key={i}
            className="absolute top-0 animate-confetti"
            style={{
              left,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              animationDelay: delay,
              animationDuration: duration,
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        )
      })}
    </div>
  )
}

export default function Celebration({ emoji, habitName, streak, marked }: Props) {
  const [show, setShow] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 50)
    const t2 = setTimeout(() => setShowConfetti(true), 100)
    const t3 = setTimeout(() => setShowConfetti(false), 3500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (!marked) {
    return (
      <div className={`transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-6xl mb-6">{emoji}</div>
        <h1 className="text-2xl font-bold text-slate-300">Nada pendiente</h1>
        <p className="text-slate-500 mt-2">{habitName} — no hay recordatorios activos ahora.</p>
        {streak > 0 && (
          <div className="mt-6 inline-flex items-center gap-2 bg-slate-800 rounded-full px-5 py-2.5 border border-slate-700">
            <span className="text-amber-400 font-bold text-lg">{streak}</span>
            <span className="text-slate-400 text-sm">{streak === 1 ? 'día de racha' : 'días de racha'}</span>
          </div>
        )}
        <div className="mt-8">
          <a href="/" className="text-teal-400 text-sm hover:text-teal-300 transition-colors">← Volver al inicio</a>
        </div>
      </div>
    )
  }

  return (
    <>
      {showConfetti && <Confetti />}

      <div className={`transition-all duration-600 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        {/* Big emoji with pulse */}
        <div className="relative inline-block mb-6">
          <div className={`text-7xl ${isMilestone(streak) ? 'animate-bounce' : ''}`}>{emoji}</div>
          {/* Check badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pop">
            ✓
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-teal-400 mb-1">¡Registrado!</h1>
        <p className="text-slate-400 text-sm">{habitName}</p>

        {/* Streak */}
        {streak > 0 && (
          <div className={`mt-7 mx-auto max-w-xs ${isMilestone(streak) ? 'animate-pulse-once' : ''}`}>
            <div className={`rounded-2xl p-6 border ${isMilestone(streak) ? 'bg-amber-950/40 border-amber-700/50' : 'bg-slate-800/80 border-slate-700'}`}>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Racha actual</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className={`text-6xl font-black ${isMilestone(streak) ? 'text-amber-400' : 'text-teal-400'}`}>
                  {streak}
                </span>
                <span className="text-slate-400 text-lg">{streak === 1 ? 'día' : 'días'}</span>
              </div>
              {isMilestone(streak) && (
                <div className="mt-2 text-2xl">🔥</div>
              )}
            </div>
          </div>
        )}

        {/* Motivational */}
        <p className="mt-5 text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
          {getMotivation(streak)}
        </p>

        <div className="mt-8">
          <a href="/" className="text-teal-400 text-sm hover:text-teal-300 transition-colors">← Volver al inicio</a>
        </div>
      </div>
    </>
  )
}
