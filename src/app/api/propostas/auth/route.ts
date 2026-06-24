import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function anonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// POST — public endpoint: valida email + PIN e retorna o token da proposta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, pin } = body

    if (!email || !pin) {
      return NextResponse.json(
        { error: 'E-mail e PIN são obrigatórios.' },
        { status: 400 },
      )
    }

    const supabase = anonClient()

    const { data, error } = await supabase
      .from('propostas')
      .select('token')
      .eq('escola_email', email.toLowerCase().trim())
      .eq('escola_pin', String(pin).trim())
      .eq('status', 'ativa')
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'E-mail ou código inválidos, ou proposta não está ativa.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ token: data.token })
  } catch (err: unknown) {
    console.error('[propostas/auth POST]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
