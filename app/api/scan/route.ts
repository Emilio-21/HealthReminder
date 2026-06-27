import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { markDone } from '@/lib/habits'

// Called by the Telegram Mini App (/scan) after the native QR scanner returns.
// Body: { token } — the qr_token embedded in the scanned code (we accept either
// the raw token or a full /done/<token> URL).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const raw = body?.token
  if (typeof raw !== 'string' || !raw.trim()) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  // Accept a full URL (…/done/<token>) or a bare token.
  const token = raw.trim().replace(/\/+$/, '').split('/').pop() ?? ''

  const result = await markDone(token, 'telegram')
  if (!result) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  revalidatePath('/')
  revalidatePath('/history')
  return NextResponse.json(result)
}
