const TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const BASE = `https://api.telegram.org/bot${TOKEN}`
const APP_URL = process.env.APP_URL ?? 'https://health-reminder-green.vercel.app'

type ReplyMarkup = { inline_keyboard: { text: string; web_app: { url: string } }[][] }

export async function sendMessage(chat_id: string, text: string, reply_markup?: ReplyMarkup) {
  const res = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', reply_markup }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Telegram sendMessage failed:', err)
  }
  return res
}

// Inline button that opens the /scan Mini App (native QR scanner) inside Telegram,
// without leaving the chat or opening browser tabs.
export const scanButton: ReplyMarkup = {
  inline_keyboard: [[{ text: '📷 Escanear', web_app: { url: `${APP_URL}/scan` } }]],
}

export async function setWebhook(url: string) {
  const res = await fetch(`${BASE}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return res.json()
}

export function nagMessage(habitName: string, emoji: string, n: number): string {
  if (n === 1) return `${emoji} Hora de ${habitName.toLowerCase()}. Da clic para escanear.`
  if (n === 2) return `Sigo esperando 👀 Escanea ${habitName} cuando lo hagas.`
  if (n === 3) return `En serio, ¿ya? Escanea ${habitName}. ${emoji}`
  return `Llevas ${n} avisos ignorados hoy (${habitName}). No me hagas esto. Escanea ya. 😤`
}

export function missMessage(habitName: string, emoji: string): string {
  return `${emoji} Se acabó el tiempo para <b>${habitName}</b>. Marcado como fallado por hoy. 😞`
}
