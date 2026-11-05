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
  // Base pros links relativos (og:image, canonical etc.) virarem absolutos nos
  // metadados — sem isso o Next cai pra localhost:3000 em produção (warning de
  // build) e o preview de link quebra silenciosamente em quem compartilha.
  // /proposta tem seu próprio metadataBase (comercial.wemake.tec.br) e continua
  // valendo só ali, por cima deste.
  metadataBase: new URL('https://gestao.wemake.tec.br'),
  title: 'We Make — Gestão Comercial para Educação',
  description: 'Plataforma de gestão comercial e inteligência para educação',
  // A imagem em si vem do arquivo opengraph-image.tsx (convenção de rota do
  // Next) — ele já injeta og:image automaticamente; não repetir aqui.
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistBody.variable} ${fraunces.variable} ${geistUI.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
