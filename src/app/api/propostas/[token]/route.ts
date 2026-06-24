import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function anonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// GET — busca proposta pelo token (público, sem autenticação)
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })
    }

    const supabase = anonClient()

    const { data: proposta, error } = await supabase
      .from('propostas')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !proposta) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    // Incrementa visualizações (fire-and-forget — falha silenciosa se anon não tiver update policy)
    const updatePayload: Record<string, unknown> = {
      visualizacoes: (proposta.visualizacoes ?? 0) + 1,
    }
    if (!proposta.visualizado_em) {
      updatePayload.visualizado_em = new Date().toISOString()
    }

    supabase
      .from('propostas')
      .update(updatePayload)
      .eq('token', token)
      .then(({ error: updateErr }) => {
        if (updateErr) {
          console.warn('[propostas/[token] GET] view count update skipped:', updateErr.message)
        }
      })

    return NextResponse.json(proposta)
  } catch (err: unknown) {
    console.error('[propostas/[token] GET] unexpected:', err)
    return NextResponse.json({ error: 'Erro interno', detail: String(err) }, { status: 500 })
  }
}
