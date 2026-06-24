import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function anonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || String(pin).trim().length === 0) {
      return NextResponse.json({ error: 'PIN obrigatório.' }, { status: 400 })
    }

    const supabase = anonClient()
    const { data, error } = await supabase
      .from('propostas')
      .select('token, escola_nome')
      .eq('escola_pin', String(pin).trim())
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'PIN inválido ou proposta não encontrada.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ token: data.token, escola_nome: data.escola_nome })
  } catch (err) {
    console.error('[propostas/pin POST]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
