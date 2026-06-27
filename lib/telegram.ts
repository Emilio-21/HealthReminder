const TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const BASE = `https://api.telegram.org/bot${TOKEN}`

export async function sendMessage(chat_id: string, text: string) {
  const res = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Telegram sendMessage failed:', err)
  }
  return res
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
  if (n === 1) return `${emoji} Hora de ${habitName.toLowerCase()}. Ve y escanea el QR.`
  if (n === 2) return `Sigo esperando 👀 Escanea el QR de ${habitName} cuando lo hagas.`
  if (n === 3) return `En serio, ¿ya? Escanea el QR de ${habitName}. ${emoji}`
  return `Llevas ${n} avisos ignorados hoy (${habitName}). No me hagas esto. Escanea el QR. 😤`
}

export function missMessage(habitName: string, emoji: string): string {
  return `${emoji} Se acabó el tiempo para <b>${habitName}</b>. Marcado como fallado por hoy. 😞`
}
