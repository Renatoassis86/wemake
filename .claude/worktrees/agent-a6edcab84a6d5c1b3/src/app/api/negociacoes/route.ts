import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET — lista todas as negociações ativas (diagnóstico + uso futuro)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('negociacoes')
      .select('id, stage, titulo, ativa, escola_id, escola:escolas(nome), created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    return NextResponse.json({ total: data?.length ?? 0, negociacoes: data })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado', detail: authError?.message }, { status: 401 })
    }

    const body = await request.json()
    const { escola_id, stage, titulo, responsavel_id, valor_estimado } = body

    if (!escola_id) {
      return NextResponse.json({ error: 'escola_id obrigatório' }, { status: 400 })
    }

    // Valida escola
    const { data: escola, error: escolaError } = await supabase
      .from('escolas')
      .select('id, nome')
      .eq('id', escola_id)
      .single()

    if (escolaError || !escola) {
      return NextResponse.json({
        error: `Escola não encontrada`,
        detail: escolaError?.message ?? 'id inválido'
      }, { status: 400 })
    }

    // Detecta duplicata ativa
    const { data: existente } = await supabase
      .from('negociacoes')
      .select('id, stage, titulo')
      .eq('escola_id', escola_id)
      .eq('ativa', true)
      .maybeSingle()

    if (existente) {
      return NextResponse.json({
        error: `"${escola.nome}" já está no pipeline (quadro: ${existente.stage}). Arraste o card existente para mudar de quadro.`
      }, { status: 409 })
    }

    const STAGES_VALIDOS = ['prospeccao','qualificacao','apresentacao','proposta','negociacao','fechamento']
    const stageFinal = STAGES_VALIDOS.includes(stage) ? stage : 'prospeccao'

    const { data, error } = await supabase
      .from('negociacoes')
      .insert({
        escola_id,
        stage:          stageFinal,
        titulo:         titulo || `${escola.nome} — ${stageFinal}`,
        responsavel_id: responsavel_id ?? user.id,
        valor_estimado: valor_estimado ?? null,
        probabilidade:  0,
        ativa:          true,
        created_by:     user.id,
      })
      .select('id, stage, titulo, escola_id')
      .single()

    if (error) {
      console.error('[negociacoes POST] error:', JSON.stringify(error))
      return NextResponse.json({
        error: error.message,
        code: error.code,
        detail: error.details,
        hint: error.hint,
      }, { status: 400 })
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      }
    })

  } catch (err: any) {
    console.error('[negociacoes POST] unexpected:', err)
    return NextResponse.json({ error: 'Erro interno', detail: String(err) }, { status: 500 })
  }
}
