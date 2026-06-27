export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-5xl">💧</div>
        <h1 className="text-3xl font-bold tracking-tight">HealthReminder</h1>
        <p className="text-slate-400">
          Tu nagger personal. Telegram te molesta hasta que escaneas el QR.
        </p>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-left">
          <p className="text-sm font-medium text-slate-300 mb-2">Setup — Fase 1</p>
          <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
            <li>Aplica el schema SQL en Supabase (supabase/migrations/001_schema.sql)</li>
            <li>Registra el webhook: <code className="text-teal-400">/api/telegram/set-webhook</code></li>
            <li>Manda <code className="text-teal-400">/start</code> a tu bot en Telegram</li>
            <li>Prueba: <code className="text-teal-400">/api/test-nag</code></li>
          </ol>
        </div>
      </div>
    </main>
  )
}
