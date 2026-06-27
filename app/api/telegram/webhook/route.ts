import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const message = body.message
  if (!message?.text) return NextResponse.json({ ok: true })

  const chatId = String(message.chat.id)
  const text = message.text.trim()

  if (text === '/start') {
    await supabaseAdmin
      .from('config')
      .upsert({ id: 1, telegram_chat_id: chatId }, { onConflict: 'id' })
    await sendMessage(chatId, '✅ Conectado. Aquí te voy a estar molestando.')
    return NextResponse.json({ ok: true })
  }

  if (text === '/hoy') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: reminders } = await supabaseAdmin
      .from('reminders')
      .select('status, habits(name, emoji)')
      .gte('scheduled_for', today.toISOString())
      .lt('scheduled_for', tomorrow.toISOString())

    if (!reminders || reminders.length === 0) {
      await sendMessage(chatId, '📋 No hay recordatorios registrados para hoy.')
      return NextResponse.json({ ok: true })
    }

    const done = reminders.filter(r => r.status === 'done')
    const missed = reminders.filter(r => r.status === 'missed')
    const pending = reminders.filter(r => r.status === 'pending')

    const lines = [
      `📋 <b>Estado de hoy</b>`,
      `✅ Hechos: ${done.length}`,
      `⏳ Pendientes: ${pending.length}`,
      `❌ Fallados: ${missed.length}`,
    ]
    await sendMessage(chatId, lines.join('\n'))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
