import type { Metadata } from 'next'
import { Source_Serif_4 } from 'next/font/google'
import '../(dashboard)/academia/academia.css'
import './modulos.css'

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Módulos · We Make',
  description: 'Módulos da plataforma de gestão da We Make.',
}

export default function ModulosLayout({ children }: { children: React.ReactNode }) {
  return <div className={`ac md ${serif.variable}`}>{children}</div>
}
