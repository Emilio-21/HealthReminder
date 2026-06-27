// Supabase Edge Function — called by pg_cron every minute
// Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

const db = createClient(SUPABASE_URL, SERVICE_ROLE)

function nagMessage(habitName: string, emoji: string, n: number): string {
  if (n === 1) return `${emoji} Hora de ${habitName.toLowerCase()}. Ve y escanea el QR.`
  if (n === 2) return `Sigo esperando 👀 Escanea el QR de ${habitName} cuando lo hagas.`
  if (n === 3) return `En serio, ¿ya? Escanea el QR de ${habitName}. ${emoji}`
  return `Llevas ${n} avisos ignorados hoy (${habitName}). No me hagas esto. Escanea el QR. 😤`
}

function missMessage(habitName: string, emoji: string): string {
  return `${emoji} Se acabó el tiempo para <b>${habitName}</b>. Marcado como fallado por hoy. 😞`
}

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

async function log(fn: string, level: string, message: string) {
  await db.from('logs').insert({ fn, level, message })
}

Deno.serve(async () => {
  try {
    const { data: cfg } = await db.from('config').select('*').eq('id', 1).single()

    if (!cfg?.telegram_chat_id) {
      return new Response(JSON.stringify({ skipped: 'no telegram_chat_id' }), { status: 200 })
    }

    const now = new Date()
    const escalationMs = (cfg.escalation_minutes ?? 5) * 60 * 1000
    const giveUpMs = (cfg.give_up_minutes ?? 60) * 60 * 1000

    const { data: due, error } = await db
      .from('reminders')
      .select('*, habits(name, emoji)')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())

    if (error) {
      await log('escalate', 'error', error.message)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    const results = []

    for (const r of due ?? []) {
      const scheduledAt = new Date(r.scheduled_for)
      const habit = r.habits as { name: string; emoji: string }

      if (now.getTime() > scheduledAt.getTime() + giveUpMs) {
        await db.from('reminders').update({ status: 'missed' }).eq('id', r.id)
        await sendTelegram(cfg.telegram_chat_id, missMessage(habit.name, habit.emoji))
        results.push({ id: r.id, action: 'missed' })
        continue
      }

      const lastNagged = r.last_nagged_at ? new Date(r.last_nagged_at).getTime() : null
      const shouldNag = lastNagged === null || now.getTime() >= lastNagged + escalationMs

      if (shouldNag) {
        const newCount = (r.nag_count ?? 0) + 1
        await db
          .from('reminders')
          .update({ nag_count: newCount, last_nagged_at: now.toISOString() })
          .eq('id', r.id)
        await sendTelegram(cfg.telegram_chat_id, nagMessage(habit.name, habit.emoji, newCount))
        results.push({ id: r.id, action: 'nagged', nag_count: newCount })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), { status: 200 })
  } catch (err) {
    await log('escalate', 'error', String(err))
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
