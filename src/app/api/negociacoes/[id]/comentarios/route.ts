import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { texto } = await req.json()
  if (!texto || !texto.trim()) {
    return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('negociacao_comentarios')
    .insert({ negociacao_id: id, autor_id: user.id, texto: texto.trim() })
    .select('id, texto, created_at, autor_id, profiles:autor_id(id, full_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
