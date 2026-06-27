import { supabaseAdmin } from '@/lib/supabase'
import QRCode from 'qrcode'
import PrintButton from './PrintButton'

const PALETTE = [
  { accent: '#2dd4bf', chipBg: 'rgba(45,212,191,0.13)' },
  { accent: '#fbbf24', chipBg: 'rgba(251,191,36,0.13)' },
  { accent: '#fdba74', chipBg: 'rgba(253,186,116,0.13)' },
]

async function getCards() {
  const { data: habits } = await supabaseAdmin
    .from('habits').select('id, name, emoji, qr_token').eq('active', true).order('created_at')

  const appUrl = process.env.APP_URL ?? 'https://health-reminder-green.vercel.app'

  return Promise.all((habits ?? []).map(async (h, idx) => {
    const url = `${appUrl}/done/${h.qr_token}`
    const shortUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '')
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 280, margin: 1,
      color: { dark: '#0a1018', light: '#ffffff' },
    })
    return { ...h, url, shortUrl, qrDataUrl, colorIdx: idx % PALETTE.length }
  }))
}

export default async function PrintQRPage() {
  const cards = await getCards()

  return (
    <main style={{ minHeight:'100vh', background:'#070b13', color:'#f1f5f9' }}>
      <div style={{ maxWidth:448, margin:'0 auto', padding:'40px 20px 32px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:24 }}>
          <div style={{ flex:1 }}>
            <h1 style={{ font:'700 30px Geist,sans-serif', color:'#f1f5f9', letterSpacing:'-.02em' }}>Imprimir QR</h1>
            <p style={{ font:'500 12px Geist,sans-serif', color:'#5a6b85', marginTop:6, lineHeight:1.5 }}>
              Recorta cada tarjeta y pégala en tu envase. Escanearla silencia el aviso.
            </p>
          </div>
          <PrintButton />
        </div>

        {/* QR grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13, marginBottom:16 }}>
          {cards.map(c => {
            const pal = PALETTE[c.colorIdx]
            return (
              <div key={c.id} style={{
                borderRadius:20, background:'#f4f6fb',
                border:'1px dashed #b9c2d6',
                padding:'14px 13px 13px',
                display:'flex', flexDirection:'column', alignItems:'center',
              }}>
                {/* Name row */}
                <div style={{ display:'flex', alignItems:'center', gap:7, alignSelf:'flex-start', marginBottom:12 }}>
                  <div style={{ width:30, height:30, borderRadius:9, background:pal.chipBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                    {c.emoji}
                  </div>
                  <span style={{ font:'700 13px Geist,sans-serif', color:'#0a0e17' }}>{c.name}</span>
                </div>

                {/* QR */}
                <div style={{ width:'100%', background:'#fff', borderRadius:12, padding:11, boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.qrDataUrl} alt={`QR ${c.name}`} style={{ width:'100%', display:'block' }} />
                </div>

                {/* URL */}
                <p style={{ font:'500 10px "Geist Mono",monospace', color:'#64748b', marginTop:10, wordBreak:'break-all', textAlign:'center' }}>
                  {c.shortUrl}
                </p>
              </div>
            )
          })}
        </div>

        {/* Info banner */}
        <div style={{
          borderRadius:16, background:'#0d1320', border:'1px solid #1b2538',
          padding:'13px 15px', display:'flex', alignItems:'flex-start', gap:10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          </svg>
          <span style={{ font:'500 12px Geist,sans-serif', color:'#94a3b8', lineHeight:1.5 }}>
            Pega el código donde lo veas a diario: botella, frasco, espejo.
          </span>
        </div>
      </div>
    </main>
  )
}
