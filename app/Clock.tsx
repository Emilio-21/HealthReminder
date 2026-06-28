'use client'

import { useEffect, useState } from 'react'

const TZ = 'America/Mexico_City'

// Reloj en vivo en horario CDMX. Renderiza el primer tick ya montado
// para evitar mismatch de hidratación (el servidor está en UTC).
export default function Clock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now
    ? now.toLocaleTimeString('es-MX', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : '--:--:--'

  return (
    <div
      suppressHydrationWarning
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: 'rgba(45,212,191,.08)', border: '1px solid rgba(45,212,191,.18)',
        borderRadius: 99, padding: '7px 13px', alignSelf: 'flex-start',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
      <span style={{ font: '600 14px Geist,sans-serif', color: '#2dd4bf', letterSpacing: '.04em', fontVariantNumeric: 'tabular-nums' }}>
        {time}
      </span>
      <span style={{ font: '500 11px Geist,sans-serif', color: '#5a6b85', letterSpacing: '.06em' }}>CDMX</span>
    </div>
  )
}
