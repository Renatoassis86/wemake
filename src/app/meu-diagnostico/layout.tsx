import type { Metadata } from 'next'
import { BrandLoginStyles } from '@/components/brand/BrandLoginStyles'

export const metadata: Metadata = {
  title: 'Meu diagnóstico · We Make',
  description: 'Portal da escola parceira: devolutiva do Diagnóstico do Espaço Maker.',
  robots: { index: false, follow: false },
}

export default function MeuDiagnosticoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrandLoginStyles />
      {children}
    </>
  )
}
