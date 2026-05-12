import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'We Make - Plataforma de Gestão Comercial',
  description: 'Plataforma de gestão comercial para educação tecnológica com excelência e inovação criativa.',
  keywords: [
    'gestão comercial',
    'educação',
    'tecnologia',
    'contratos',
    'maker',
    'STEM',
    'escolas',
  ],
  authors: [{ name: 'We Make' }],
  creator: 'We Make Team',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://wemake.tec.br',
    siteName: 'We Make Platform',
    title: 'We Make - Plataforma de Gestão Comercial',
    description: 'Plataforma de gestão comercial para educação tecnológica',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'We Make Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'We Make - Plataforma de Gestão Comercial',
    description: 'Plataforma de gestão comercial para educação tecnológica',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4A7FDB" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
