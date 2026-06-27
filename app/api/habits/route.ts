import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('habits')
    .select('*, schedules(*)')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, emoji, schedule } = body

  if (!name || !schedule) {
    return NextResponse.json({ error: 'name and schedule required' }, { status: 400 })
  }

  const qr_token = `${name.toLowerCase().replace(/\s+/g, '-')}-${randomBytes(4).toString('hex')}`

  const { data: habit, error: habitErr } = await supabaseAdmin
    .from('habits')
    .insert({ name, emoji: emoji ?? '💧', qr_token })
    .select()
    .single()

  if (habitErr) return NextResponse.json({ error: habitErr.message }, { status: 500 })

  const { error: schedErr } = await supabaseAdmin
    .from('schedules')
    .insert({ habit_id: habit.id, ...schedule })

  if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 500 })

  revalidatePath('/')
  revalidatePath('/history')
  return NextResponse.json(habit, { status: 201 })
}
