'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ABAS = [
  { href: '/gestao', label: 'Visão geral', exato: true },
  { href: '/gestao/receita', label: 'Receita contratada' },
]

export default function GeralNav() {
  const path = usePathname()
  return (
    <div className="ac-subnav">
      <nav aria-label="Áreas da gestão geral">
        {ABAS.map(a => {
          const on = a.exato ? path === a.href : path.startsWith(a.href)
          return (
            <Link key={a.href} href={a.href} className={on ? 'is-on' : undefined} aria-current={on ? 'page' : undefined}>
              {a.label}
            </Link>
          )
        })}
        <Link href="/academia/gestao" className="ac-subnav-out">Implantação →</Link>
      </nav>
    </div>
  )
}
