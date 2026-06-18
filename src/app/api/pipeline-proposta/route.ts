import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET — lista cards do pipeline proposta (leads com fonte formulario_wemake)
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('leads_universal')
    .select('id, escola_nome, cidade, estado, dados_extras, created_at')
    .eq('fonte', 'formulario_wemake')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data ?? [])
}
