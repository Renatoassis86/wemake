import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Geist, Fraunces } from 'next/font/google'
import './globals.css'

// Identidade We Make atual (a mesma da proposta comercial): Fraunces para
// títulos/display, Geist para UI e corpo de texto. Os nomes das variáveis
// CSS (--font-inter, --font-cormorant, --font-montserrat) ficam os mesmos
// de propósito — o app inteiro já referencia essas variáveis, não os nomes
// das fontes, então a troca se propaga sem precisar tocar em cada arquivo.
const geistBody = Geist({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const geistUI = Geist({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0b1f44',
}

export const metadata: Metadata = {
  title: 'We Make — Gestão Comercial para Educação',
  description: 'Plataforma de gestão comercial e inteligência para educação',
  openGraph: {
    images: [{ url: '/proposta/logo-color.png', width: 800, height: 600, alt: 'We Make' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistBody.variable} ${fraunces.variable} ${geistUI.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
