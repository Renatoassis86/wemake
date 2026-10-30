import type { Metadata } from 'next'
import { Fraunces } from 'next/font/google'
import '../(dashboard)/academia/academia.css'
import './modulos.css'

const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['300', '400', '500', '600', '700'],
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
