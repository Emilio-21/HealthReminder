import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { passphrase } = await req.json()
  if (passphrase === process.env.DASHBOARD_PASSPHRASE) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'invalid' }, { status: 401 })
}
