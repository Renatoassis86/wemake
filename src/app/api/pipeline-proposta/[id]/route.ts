import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH — move card de estágio ou adiciona comentário
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()

  // Busca registro atual para mesclar dados_extras
  const { data: lead } = await supabase
    .from('leads_universal')
    .select('dados_extras')
    .eq('id', id)
    .single()

  const extraAtual: Record<string, any> = (lead?.dados_extras as any) ?? {}

  if ('stage' in body) {
    extraAtual.pipeline_stage = body.stage
  }

  if ('comentario' in body && body.comentario?.trim()) {
    const comentarios: any[] = extraAtual.pipeline_comentarios ?? []
    comentarios.unshift({
      id: crypto.randomUUID(),
      texto: body.comentario.trim(),
      autor_id: user.id,
      criado_em: new Date().toISOString(),
    })
    extraAtual.pipeline_comentarios = comentarios
  }

  if ('remover_comentario' in body) {
    const comentarios: any[] = extraAtual.pipeline_comentarios ?? []
    extraAtual.pipeline_comentarios = comentarios.filter((c: any) => c.id !== body.remover_comentario)
  }

  const { error } = await supabase
    .from('leads_universal')
    .update({ dados_extras: extraAtual })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, dados_extras: extraAtual })
}
