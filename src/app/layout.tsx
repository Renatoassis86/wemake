import type { Metadata } from 'next'
import type { Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Identidade We Make oficial (identidade_visual_nova.zip): Satoshi é a única
// fonte da marca — não tem par serifado nenhum no kit, então as 3 variáveis
// (antes Fraunces pro display + Geist pro resto) agora são todas Satoshi, só
// em pesos diferentes por papel. Os nomes das variáveis CSS (--font-inter,
// --font-cormorant, --font-montserrat) ficam os mesmos de propósito — o app
// inteiro já referencia essas variáveis, não os nomes das fontes, então a
// troca se propaga sem precisar tocar em cada arquivo.
// O carregador de fonte do Next exige os valores escritos literais na própria
// chamada (análise estática em tempo de build) — não aceita ler de uma
// constante à parte, por isso os 3 arrays abaixo se repetem.
const satoshiBody = localFont({
  src: [
    { path: '../../public/fonts/satoshi/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Italic.woff2',  weight: '400', style: 'italic' },
    { path: '../../public/fonts/satoshi/Satoshi-Medium.woff2',  weight: '500', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Bold.woff2',    weight: '700', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Black.woff2',   weight: '900', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
})

const satoshiDisplay = localFont({
  src: [
    { path: '../../public/fonts/satoshi/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Italic.woff2',  weight: '400', style: 'italic' },
    { path: '../../public/fonts/satoshi/Satoshi-Medium.woff2',  weight: '500', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Bold.woff2',    weight: '700', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Black.woff2',   weight: '900', style: 'normal' },
  ],
  variable: '--font-cormorant',
  display: 'swap',
})

const satoshiUI = localFont({
  src: [
    { path: '../../public/fonts/satoshi/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Italic.woff2',  weight: '400', style: 'italic' },
    { path: '../../public/fonts/satoshi/Satoshi-Medium.woff2',  weight: '500', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Bold.woff2',    weight: '700', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Black.woff2',   weight: '900', style: 'normal' },
  ],
  variable: '--font-montserrat',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#002933',
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
    <html lang="pt-BR" className={`${satoshiBody.variable} ${satoshiDisplay.variable} ${satoshiUI.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
