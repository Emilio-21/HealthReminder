'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        border: 'none', cursor: 'pointer', borderRadius: 14, flexShrink: 0,
        background: '#2dd4bf', color: '#04221a',
        font: '700 13px Geist,sans-serif', padding: '11px 14px',
        display: 'flex', alignItems: 'center', gap: 7,
        boxShadow: '0 8px 20px rgba(45,212,191,.3)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#04221a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8" rx="1"/>
      </svg>
      Imprimir
    </button>
  )
}
