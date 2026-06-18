import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH { precadastro_id, stage? | comentario? | remover_comentario? }
// O [id] aqui é o leads_universal.id (pode ser 'new' para criação sob demanda)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { precadastro_id, escola_nome, ...updates } = body

  if (!precadastro_id) return NextResponse.json({ error: 'precadastro_id obrigatório' }, { status: 400 })

  // Busca lead existente pelo precadastro_id em dados_extras
  let { data: existente } = await supabase
    .from('leads_universal')
    .select('id, dados_extras')
    .eq('fonte', 'formulario_wemake')
    .contains('dados_extras', { precadastro_id })
    .maybeSingle()

  let leadId = existente?.id
  let extraAtual: Record<string, any> = (existente?.dados_extras as any) ?? { precadastro_id }

  // Se não existe, cria o registro
  if (!leadId) {
    const { data: novo, error: insErr } = await supabase
      .from('leads_universal')
      .insert({
        escola_nome: escola_nome ?? precadastro_id,
        fonte: 'formulario_wemake',
        status: 'ativo',
        dados_extras: { precadastro_id },
      })
      .select('id, dados_extras')
      .single()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })
    leadId = novo.id
    extraAtual = (novo.dados_extras as any) ?? { precadastro_id }
  }

  // Aplicar as mudanças
  if ('stage' in updates) {
    extraAtual.pipeline_stage = updates.stage
  }

  if ('comentario' in updates && updates.comentario?.trim()) {
    const comentarios: any[] = extraAtual.pipeline_comentarios ?? []
    comentarios.unshift({
      id: crypto.randomUUID(),
      texto: updates.comentario.trim(),
      autor_id: user.id,
      criado_em: new Date().toISOString(),
    })
    extraAtual.pipeline_comentarios = comentarios
  }

  if ('remover_comentario' in updates) {
    const comentarios: any[] = extraAtual.pipeline_comentarios ?? []
    extraAtual.pipeline_comentarios = comentarios.filter((c: any) => c.id !== updates.remover_comentario)
  }

  const { error } = await supabase
    .from('leads_universal')
    .update({ dados_extras: extraAtual })
    .eq('id', leadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, lead_id: leadId, dados_extras: extraAtual })
}
