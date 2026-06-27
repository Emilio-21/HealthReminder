'use client'

import { useCallback, useEffect, useState } from 'react'
import Script from 'next/script'

type TG = {
  ready: () => void
  expand: () => void
  close: () => void
  showScanQrPopup: (p: { text?: string }, cb: (text: string) => boolean) => void
  closeScanQrPopup: () => void
  HapticFeedback?: {
    notificationOccurred: (t: 'error' | 'success' | 'warning') => void
  }
}

declare global {
  interface Window { Telegram?: { WebApp?: TG } }
}

type State =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'done'; emoji: string; name: string; streak: number; marked: boolean }
  | { kind: 'notfound' }
  | { kind: 'error' }

export default function ScanPage() {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState<State>({ kind: 'idle' })

  const tg = () => (typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined)

  const submit = useCallback(async (token: string) => {
    setState({ kind: 'saving' })
    try {
      const r = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (r.status === 404) {
        tg()?.HapticFeedback?.notificationOccurred('error')
        setState({ kind: 'notfound' })
        return
      }
      if (!r.ok) throw new Error('bad status')
      const d = await r.json()
      tg()?.HapticFeedback?.notificationOccurred('success')
      setState({ kind: 'done', emoji: d.habit.emoji, name: d.habit.name, streak: d.streak, marked: d.marked })
    } catch {
      tg()?.HapticFeedback?.notificationOccurred('error')
      setState({ kind: 'error' })
    }
  }, [])

  const openScanner = useCallback(() => {
    const w = tg()
    if (!w) return
    w.showScanQrPopup({ text: 'Apunta al código de tu hábito' }, (text) => {
      // returning true closes the native scanner
      if (text) submit(text)
      return true
    })
  }, [submit])

  // Auto-open the native scanner as soon as the SDK is ready.
  useEffect(() => {
    if (!ready) return
    const w = tg()
    if (!w) return
    w.ready()
    w.expand()
    openScanner()
  }, [ready, openScanner])

  return (
    <main style={{ minHeight:'100vh', background:'#070b13', color:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />

      <div style={{ width:'100%', maxWidth:360, textAlign:'center' }}>
        {state.kind === 'idle' && (
          <>
            <div style={{ fontSize:56, marginBottom:16 }}>📷</div>
            <h1 style={{ font:'700 22px Geist,sans-serif', marginBottom:8 }}>Escanea tu hábito</h1>
            <p style={{ font:'500 14px Geist,sans-serif', color:'#5a6b85', marginBottom:24, lineHeight:1.5 }}>
              Apunta la cámara al código que pegaste en tu envase para silenciar el aviso.
            </p>
            <button onClick={openScanner} disabled={!ready} style={btnPrimary(!ready)}>
              {ready ? 'Abrir escáner' : 'Cargando…'}
            </button>
          </>
        )}

        {state.kind === 'saving' && (
          <>
            <div className="anim-pend-pulse" style={{ fontSize:56, marginBottom:16 }}>⏳</div>
            <p style={{ font:'600 16px Geist,sans-serif', color:'#cbd5e1' }}>Registrando…</p>
          </>
        )}

        {state.kind === 'done' && (
          <>
            <div className="anim-pop-in" style={{ fontSize:64, marginBottom:12 }}>{state.emoji}</div>
            <h1 style={{ font:'700 24px Geist,sans-serif', marginBottom:8 }}>
              {state.marked ? '¡Listo! ✓' : 'Ya estaba registrado'}
            </h1>
            <p style={{ font:'500 14px Geist,sans-serif', color:'#5a6b85', marginBottom:6 }}>{state.name}</p>
            {state.streak > 0 && (
              <p style={{ font:'700 15px Geist,sans-serif', color:'#2dd4bf', marginBottom:24 }}>🔥 Racha de {state.streak} días</p>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
              <button onClick={() => tg()?.close()} style={btnPrimary(false)}>Cerrar</button>
              <button onClick={openScanner} style={btnGhost}>Escanear otro</button>
            </div>
          </>
        )}

        {state.kind === 'notfound' && (
          <>
            <div style={{ fontSize:56, marginBottom:16 }}>🤔</div>
            <h1 style={{ font:'700 20px Geist,sans-serif', marginBottom:8 }}>Código no reconocido</h1>
            <p style={{ font:'500 14px Geist,sans-serif', color:'#5a6b85', marginBottom:24, lineHeight:1.5 }}>
              Ese código no corresponde a ningún hábito. Asegúrate de escanear el correcto.
            </p>
            <button onClick={openScanner} style={btnPrimary(false)}>Reintentar</button>
          </>
        )}

        {state.kind === 'error' && (
          <>
            <div style={{ fontSize:56, marginBottom:16 }}>⚠️</div>
            <h1 style={{ font:'700 20px Geist,sans-serif', marginBottom:8 }}>Algo salió mal</h1>
            <p style={{ font:'500 14px Geist,sans-serif', color:'#5a6b85', marginBottom:24 }}>Inténtalo de nuevo.</p>
            <button onClick={openScanner} style={btnPrimary(false)}>Reintentar</button>
          </>
        )}
      </div>
    </main>
  )
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    width:'100%', padding:'15px 0', borderRadius:16, border:'none',
    cursor: disabled ? 'default' : 'pointer',
    background:'linear-gradient(135deg,#2dd4bf,#22d3ee)',
    color:'#04221a', font:'700 15px Geist,sans-serif',
    opacity: disabled ? 0.5 : 1,
  }
}

const btnGhost: React.CSSProperties = {
  width:'100%', padding:'13px 0', borderRadius:16, border:'1px solid #1b2538',
  background:'transparent', color:'#5a6b85', font:'600 14px Geist,sans-serif', cursor:'pointer',
}
