import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meu diagnóstico · We Make',
  description: 'Portal da escola parceira: devolutiva do Diagnóstico do Espaço Maker.',
  robots: { index: false, follow: false },
}

export default function MeuDiagnosticoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,600&family=Geist:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
