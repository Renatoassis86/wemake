import type { Metadata } from 'next'
import { BrandLoginStyles } from '@/components/brand/BrandLoginStyles'

export const metadata: Metadata = {
  title: 'Contatos comerciais · We Make',
  description: 'Escola parceira: quem deve receber o treinamento de ativação comercial e o manual de marca da We Make.',
  robots: { index: false, follow: false },
}

export default function ContatosComerciaisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrandLoginStyles />
      {children}
    </>
  )
}
