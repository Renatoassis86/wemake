import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PropostaView from '@/app/proposta/[token]/PropostaView'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

// Exportação em PDF pro controle interno do time comercial — reaproveita a
// mesma PropostaView do link público (imagens/layout idênticos), mas
// acessada via sessão logada do painel (protegida pelo middleware normal,
// fora da rota pública com PIN) e sem contar como visualização real da
// escola (esse contador vive só em /proposta/[token]/page.tsx).
export default async function PropostaPdf({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: proposta } = await admin.from('propostas').select('*').eq('id', id).single()
  if (!proposta) notFound()

  // Exportação é pro controle interno — precisa do conteúdo completo mesmo
  // depois da validade vencer, então isExpired é sempre false aqui (só o
  // link público em /proposta/[token] deve mostrar a tela de "expirada").
  return <PropostaView proposta={proposta} isExpired={false} imprimir />
}
