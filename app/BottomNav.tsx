'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Hoy', icon: '🏠' },
  { href: '/history', label: 'Historial', icon: '📊' },
  { href: '/config', label: 'Config', icon: '⚙️' },
  { href: '/print-qr', label: 'QR', icon: '🖨️' },
]

export default function BottomNav() {
  const path = usePathname()
  // Only show on main app pages, not on /done/
  if (path.startsWith('/done')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {links.map(l => {
          const active = l.href === '/' ? path === '/' : path.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-lg leading-none">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
