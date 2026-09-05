import type { Metadata } from 'next'
import { PropostaEstilos } from '@/components/comercial/PropostaEstilos'

// Rota interna (fora do grupo (dashboard) de propósito — a PropostaView é uma
// landing full-viewport própria, incompatível com o wrapper de sidebar do
// painel). Protegida pelo middleware normal (não está na lista de rotas
// públicas), então exige sessão logada como qualquer página de /comercial.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Exportar Proposta — We Make',
}

export default function PropostasPdfLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PropostaEstilos />
      {children}
    </>
  )
}
