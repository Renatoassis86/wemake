import Link from 'next/link'
import { Source_Serif_4 } from 'next/font/google'
import './academia.css'
import './gestao.css'

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  style: ['normal', 'italic'],
})

export default function AcademiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ac ${serif.variable}`}>
      <Link href="/academia/ciclo-anual" className="ac-pin-ciclo" aria-label="Abrir o Ciclo Anual por Escolas">
        <span className="ac-pin-ico" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2.5" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="16" y1="2.5" x2="16" y2="6.5" />
            <circle cx="8" cy="14.5" r="1.3" fill="currentColor" stroke="none" /><circle cx="13" cy="14.5" r="1.3" fill="currentColor" stroke="none" /><circle cx="8" cy="18" r="1.3" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span className="ac-pin-text">
          <span className="ac-pin-eyebrow">Academia We Make</span>
          <span className="ac-pin-title">Ciclo Anual por Escolas</span>
          <span className="ac-pin-sub">Consultar o cronograma completo →</span>
        </span>
      </Link>
      {children}
    </div>
  )
}
