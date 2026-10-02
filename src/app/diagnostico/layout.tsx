import type { Metadata } from 'next'
import { Source_Serif_4 } from 'next/font/google'
import '../(dashboard)/academia/academia.css'
import './diagnostico.css'

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Diagnóstico do Espaço Maker · We Make',
  description: 'Formulário de diagnóstico do Espaço Maker para escolas parceiras da We Make.',
  robots: { index: false, follow: false },
}

export default function DiagnosticoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`ac dg ${serif.variable}`}>{children}</div>
}
