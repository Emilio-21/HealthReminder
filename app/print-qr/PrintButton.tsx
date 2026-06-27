'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium"
    >
      🖨️ Imprimir
    </button>
  )
}
