// Dev-only manual trigger to test the escalate logic
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, scanButton } from '@/lib/telegram'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 })
  }
  const { data: cfg } = await supabaseAdmin.from('config').select('telegram_chat_id').eq('id', 1).single()
  if (!cfg?.telegram_chat_id) {
    return NextResponse.json({ error: 'No telegram_chat_id. Send /start to your bot first.' }, { status: 400 })
  }
  await sendMessage(cfg.telegram_chat_id, '🧪 Test: da clic para escanear.', scanButton)
  return NextResponse.json({ ok: true, sent_to: cfg.telegram_chat_id })
}
