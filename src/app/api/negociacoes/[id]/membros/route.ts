import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST { profile_id } — adiciona membro
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { profile_id } = await req.json()
  if (!profile_id) return NextResponse.json({ error: 'profile_id obrigatório' }, { status: 400 })

  const { error } = await supabase.from('negociacao_membros').upsert({
    negociacao_id: id,
    profile_id,
    added_by: user.id,
  }, { onConflict: 'negociacao_id,profile_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// DELETE ?profile_id=... — remove membro
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const profile_id = searchParams.get('profile_id')
  if (!profile_id) return NextResponse.json({ error: 'profile_id obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('negociacao_membros')
    .delete()
    .eq('negociacao_id', id)
    .eq('profile_id', profile_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
