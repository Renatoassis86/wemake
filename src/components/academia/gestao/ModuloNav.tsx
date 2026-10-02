'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface Aba { href: string; label: string }

export default function ModuloNav({ abas, moduloHome }: { abas: Aba[]; moduloHome: string }) {
  const path = usePathname()
  return (
    <div className="ac-subnav">
      <nav aria-label="Páginas do módulo">
        {abas.map(a => {
          const on = a.href === moduloHome ? path === a.href : path.startsWith(a.href)
          return (
            <Link key={a.href} href={a.href} className={on ? 'is-on' : undefined} aria-current={on ? 'page' : undefined}>{a.label}</Link>
          )
        })}
        <Link href="/" className="ac-subnav-out">Todos os módulos →</Link>
      </nav>
    </div>
  )
}
