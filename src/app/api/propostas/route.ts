import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET — lista propostas para usuários autenticados
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }

    return NextResponse.json(data ?? [])
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST — cria nova proposta
export async function POST(request: NextRequest) {
  try {
    // Auth check — usa o client com sessão do usuário (bypassa RLS via policy "authenticated manage propostas")
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado', detail: authError?.message }, { status: 401 })
    }

    const body = await request.json()
    const {
      escola_nome,
      escola_id,
      escola_logo_url,
      tipo,
      num_alunos,
      segmentos,
      valor_aluno_ano,
      num_parcelas,
      duracao_meses,
      comodato_pv,
      comodato_parcela,
      comodato_retorno_pct,
      comodato_tx_rate,
      comodato_notebooks,
      dados_calculo,
      validade,
      escola_email,
      texto_personalizado,
    } = body

    if (!escola_nome) {
      return NextResponse.json({ error: 'escola_nome é obrigatório' }, { status: 400 })
    }

    const insert: Record<string, unknown> = {
      escola_nome,
      tipo:               tipo ?? 'curriculo',
      num_alunos:         num_alunos ?? 100,
      segmentos:          segmentos ?? 2,
      valor_aluno_ano:    valor_aluno_ano ?? 0,
      num_parcelas:       num_parcelas ?? 12,
      duracao_meses:      duracao_meses ?? 48,
      criado_por:         user.id,
    }

    if (escola_id !== undefined)            insert.escola_id            = escola_id
    if (escola_logo_url !== undefined)      insert.escola_logo_url      = escola_logo_url
    if (escola_email !== undefined)         insert.escola_email         = escola_email
    if (texto_personalizado !== undefined)  insert.texto_personalizado  = texto_personalizado
    if (validade !== undefined)             insert.validade             = validade
    if (dados_calculo !== undefined)        insert.dados_calculo        = dados_calculo
    if (comodato_pv !== undefined)          insert.comodato_pv          = comodato_pv
    if (comodato_parcela !== undefined)     insert.comodato_parcela     = comodato_parcela
    if (comodato_retorno_pct !== undefined) insert.comodato_retorno_pct = comodato_retorno_pct
    if (comodato_tx_rate !== undefined)     insert.comodato_tx_rate     = comodato_tx_rate
    if (comodato_notebooks !== undefined)   insert.comodato_notebooks   = comodato_notebooks

    const { data, error } = await supabase
      .from('propostas')
      .insert(insert)
      .select('id, token, escola_pin')
      .single()

    if (error) {
      console.error('[propostas POST] error:', JSON.stringify(error))
      return NextResponse.json({
        error:  error.message,
        code:   error.code,
        detail: error.details,
        hint:   error.hint,
      }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    console.error('[propostas POST] unexpected:', err)
    return NextResponse.json({ error: 'Erro interno', detail: String(err) }, { status: 500 })
  }
}
