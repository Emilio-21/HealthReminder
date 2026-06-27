import { NextRequest, NextResponse } from 'next/server'
import { setWebhook } from '@/lib/telegram'

// GET /api/telegram/set-webhook?url=https://your-domain.com
// Call this once to register your webhook with Telegram
export async function GET(req: NextRequest) {
  const appUrl = req.nextUrl.searchParams.get('url') || process.env.APP_URL
  const webhookUrl = `${appUrl}/api/telegram/webhook`
  const result = await setWebhook(webhookUrl)
  return NextResponse.json(result)
}
