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
      <Link href="/academia/ciclo-anual" className="ac-pin-ciclo" aria-label="Abrir o Cronograma de Implantação Anual">
        <span className="ac-pin-eyebrow">Cronograma</span>
        <span className="ac-pin-title">Implantação Anual</span>
      </Link>
      {children}
    </div>
  )
}
