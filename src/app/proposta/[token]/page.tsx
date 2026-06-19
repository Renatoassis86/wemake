import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PropostaView from './PropostaView'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ token: string }> }

export default async function PropostaPage({ params }: Props) {
  const { token } = await params

  const admin = createAdminClient()

  const { data: proposta } = await admin
    .from('propostas')
    .select('*')
    .eq('token', token)
    .single()

  if (!proposta) notFound()

  // Increment view count (non-blocking)
  admin.from('propostas').update({
    visualizacoes: (proposta.visualizacoes ?? 0) + 1,
    visualizado_em: proposta.visualizado_em ?? new Date().toISOString(),
  }).eq('token', token).then(() => {})

  const isExpired =
    proposta.status === 'expirada' ||
    (proposta.validade && new Date(proposta.validade) < new Date())

  return <PropostaView proposta={proposta} isExpired={isExpired} />
}
