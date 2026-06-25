import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import PropostaView from './PropostaView'

export const dynamic = 'force-dynamic'

function anonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

interface Props { params: Promise<{ token: string }> }

export default async function PropostaPage({ params }: Props) {
  const { token } = await params

  // Acesso direto sem PIN → redireciona para tela de acesso
  const cookieStore = await cookies()
  const authToken = cookieStore.get('proposta_auth')?.value
  if (authToken !== token) {
    redirect('/proposta/acesso')
  }

  const supabase = anonClient()

  const { data: proposta } = await supabase
    .from('propostas')
    .select('*')
    .eq('token', token)
    .single()

  if (!proposta) notFound()

  // Increment view count (fire-and-forget, falha silenciosamente se anon não puder update)
  supabase.from('propostas').update({
    visualizacoes: (proposta.visualizacoes ?? 0) + 1,
    visualizado_em: proposta.visualizado_em ?? new Date().toISOString(),
  }).eq('token', token).then(() => {})

  const isExpired =
    proposta.status === 'expirada' ||
    (proposta.validade && new Date(proposta.validade) < new Date())

  return <PropostaView proposta={proposta} isExpired={isExpired} />
}
