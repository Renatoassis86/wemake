import type { Metadata } from 'next'
import { Fraunces } from 'next/font/google'
import '../(dashboard)/academia/academia.css'
import './diagnostico.css'

const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['300', '400', '500', '600', '700'],
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
