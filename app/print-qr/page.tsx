import { supabaseAdmin } from '@/lib/supabase'
import QRCode from 'qrcode'
import PrintButton from './PrintButton'

async function getQRDataURLs() {
  const { data: habits } = await supabaseAdmin
    .from('habits')
    .select('id, name, emoji, qr_token, active')
    .eq('active', true)
    .order('created_at')

  const appUrl = process.env.APP_URL ?? 'https://health-reminder-green.vercel.app'

  return Promise.all(
    (habits ?? []).map(async h => {
      const url = `${appUrl}/done/${h.qr_token}`
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
      return { ...h, qrDataUrl: dataUrl, url }
    })
  )
}

export default async function PrintQRPage() {
  const habits = await getQRDataURLs()

  return (
    <main className="min-h-screen bg-white p-8 print:p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-8 print:hidden">QR Codes — Imprimir</h1>
        <div className="grid grid-cols-2 gap-8">
          {habits.map(h => (
            <div
              key={h.id}
              className="border-2 border-slate-200 rounded-2xl p-6 text-center space-y-3"
            >
              <div className="text-4xl">{h.emoji}</div>
              <h2 className="text-xl font-bold text-slate-800">{h.name}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={h.qrDataUrl} alt={`QR ${h.name}`} className="mx-auto w-48 h-48" />
              <p className="text-xs text-slate-400 break-all">{h.url}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center print:hidden">
          <PrintButton />
        </div>
      </div>
    </main>
  )
}
