'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ABAS: { href: string; label: string; exato?: boolean }[] = [
  { href: '/academia/gestao', label: 'Painel', exato: true },
  { href: '/academia/gestao/lista', label: 'Lista' },
  { href: '/academia/gestao/quadro', label: 'Quadro' },
  { href: '/academia/gestao/calendario', label: 'Calendário' },
  { href: '/academia/gestao/agenda', label: 'Agenda' },
  { href: '/academia/gestao/workspace', label: 'Workspace' },
]
const DIAG: { href: string; label: string; exato?: boolean } = { href: '/academia/gestao/diagnosticos', label: 'Diagnósticos' }

export default function GestaoNav({ diagnosticos = false }: { diagnosticos?: boolean }) {
  const path = usePathname()
  return (
    <div className="ac-subnav">
      <nav aria-label="Visões da gestão">
        {(diagnosticos ? [...ABAS, DIAG] : ABAS).map(a => {
          const on = a.exato ? path === a.href : path.startsWith(a.href)
          return (
            <Link key={a.href} href={a.href} className={on ? 'is-on' : undefined} aria-current={on ? 'page' : undefined}>
              {a.label}
            </Link>
          )
        })}
        <Link href="/academia" className="ac-subnav-out">← Documentos</Link>
      </nav>
    </div>
  )
}
