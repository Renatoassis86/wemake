import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET  — lista escolas do pipeline do usuário atual
// POST — adiciona escola ao pipeline
// PATCH — atualiza stage/tags/nota
// DELETE — remove escola do pipeline

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data } = await supabase
    .from('usuario_escolas_pipeline')
    .select('*, escola:escolas(id, nome, cidade, estado, total_alunos, classificacao_atual, ultimo_contato)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { escola_id, stage = 'prospeccao' } = body

  if (!escola_id) return NextResponse.json({ error: 'escola_id obrigatório' }, { status: 400 })

  // Upsert — adiciona ou atualiza se já existia
  const { data, error } = await supabase
    .from('usuario_escolas_pipeline')
    .upsert({ user_id: user.id, escola_id, stage }, { onConflict: 'user_id,escola_id' })
    .select('*, escola:escolas(id, nome, cidade, estado, total_alunos)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { id, stage, tags, nota } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const update: any = {}
  if (stage !== undefined) update.stage = stage
  if (tags  !== undefined) update.tags  = tags
  if (nota  !== undefined) update.nota  = nota

  const { data, error } = await supabase
    .from('usuario_escolas_pipeline')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('usuario_escolas_pipeline')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
