import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, nagMessage, missMessage } from '@/lib/telegram'

// This is the Next.js equivalent of the edge function.
// pg_cron will call this (or the Supabase edge function) every minute.
export async function POST(req: NextRequest) {
  // Validate it's coming from our cron (service role key as bearer)
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: cfg } = await supabaseAdmin.from('config').select('*').eq('id', 1).single()
  if (!cfg?.telegram_chat_id) {
    return NextResponse.json({ skipped: 'no telegram_chat_id configured' })
  }

  const now = new Date()
  const escalationMs = (cfg.escalation_minutes ?? 5) * 60 * 1000
  const giveUpMs = (cfg.give_up_minutes ?? 60) * 60 * 1000

  const { data: due, error } = await supabaseAdmin
    .from('reminders')
    .select('*, habits(name, emoji)')
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString())

  if (error) {
    console.error('escalate query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = []

  for (const r of due ?? []) {
    const scheduledAt = new Date(r.scheduled_for)
    const habit = r.habits as { name: string; emoji: string }

    // Give up?
    if (now.getTime() > scheduledAt.getTime() + giveUpMs) {
      await supabaseAdmin
        .from('reminders')
        .update({ status: 'missed' })
        .eq('id', r.id)
      await sendMessage(cfg.telegram_chat_id, missMessage(habit.name, habit.emoji))
      results.push({ id: r.id, action: 'missed' })
      continue
    }

    // Time to nag?
    const lastNagged = r.last_nagged_at ? new Date(r.last_nagged_at).getTime() : null
    const shouldNag = lastNagged === null || now.getTime() >= lastNagged + escalationMs

    if (shouldNag) {
      const newCount = (r.nag_count ?? 0) + 1
      await supabaseAdmin
        .from('reminders')
        .update({ nag_count: newCount, last_nagged_at: now.toISOString() })
        .eq('id', r.id)
      await sendMessage(cfg.telegram_chat_id, nagMessage(habit.name, habit.emoji, newCount))
      results.push({ id: r.id, action: 'nagged', nag_count: newCount })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
