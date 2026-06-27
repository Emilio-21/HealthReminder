import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { name, emoji, active, schedule } = body

  if (name !== undefined || emoji !== undefined || active !== undefined) {
    const patch: Record<string, unknown> = {}
    if (name !== undefined) patch.name = name
    if (emoji !== undefined) patch.emoji = emoji
    if (active !== undefined) patch.active = active

    const { error } = await supabaseAdmin.from('habits').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (schedule) {
    // Upsert the schedule for this habit (one schedule per habit for simplicity)
    const { data: existing } = await supabaseAdmin
      .from('schedules')
      .select('id')
      .eq('habit_id', id)
      .single()

    if (existing) {
      const { error } = await supabaseAdmin
        .from('schedules')
        .update(schedule)
        .eq('id', existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabaseAdmin
        .from('schedules')
        .insert({ habit_id: id, ...schedule })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('habits').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
