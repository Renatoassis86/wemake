import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

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

    const admin = createAdminClient()

    // Fetch the proposta
    const { data: proposta, error } = await admin
      .from('propostas')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !proposta) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    // Build update payload: always increment visualizacoes; set visualizado_em on first view
    const updatePayload: Record<string, unknown> = {
      visualizacoes: (proposta.visualizacoes ?? 0) + 1,
    }
    if (!proposta.visualizado_em) {
      updatePayload.visualizado_em = new Date().toISOString()
    }

    // Fire-and-forget update (non-blocking)
    admin
      .from('propostas')
      .update(updatePayload)
      .eq('token', token)
      .then(({ error: updateErr }) => {
        if (updateErr) {
          console.error('[propostas/[token] GET] update error:', updateErr.message)
        }
      })

    return NextResponse.json(proposta)
  } catch (err: unknown) {
    console.error('[propostas/[token] GET] unexpected:', err)
    return NextResponse.json({ error: 'Erro interno', detail: String(err) }, { status: 500 })
  }
}
