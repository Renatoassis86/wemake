import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH — atualiza qualquer campo do card do pipeline proposta
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
  let extra: Record<string, any> = (existente?.dados_extras as any) ?? { precadastro_id }

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
    extra = (novo.dados_extras as any) ?? { precadastro_id }
  }

  // ── Aplicar as mudanças ──────────────────────────────────────────
  if ('stage' in updates)         extra.pipeline_stage        = updates.stage
  if ('tags' in updates)          extra.pipeline_tags         = updates.tags
  if ('responsaveis' in updates)  extra.pipeline_responsaveis = updates.responsaveis
  if ('due_date' in updates)      extra.pipeline_due_date     = updates.due_date

  if ('comentario' in updates && updates.comentario?.trim()) {
    const list: any[] = extra.pipeline_comentarios ?? []
    list.unshift({
      id: crypto.randomUUID(),
      texto: updates.comentario.trim(),
      autor_id: user.id,
      criado_em: new Date().toISOString(),
    })
    extra.pipeline_comentarios = list
  }

  if ('remover_comentario' in updates) {
    extra.pipeline_comentarios = (extra.pipeline_comentarios ?? [])
      .filter((c: any) => c.id !== updates.remover_comentario)
  }

  if ('add_anexo' in updates && updates.add_anexo) {
    const list: any[] = extra.pipeline_anexos ?? []
    list.push(updates.add_anexo)
    extra.pipeline_anexos = list
  }

  if ('remover_anexo' in updates) {
    extra.pipeline_anexos = (extra.pipeline_anexos ?? [])
      .filter((a: any) => a.path !== updates.remover_anexo)
  }

  const { error } = await supabase
    .from('leads_universal')
    .update({ dados_extras: extra })
    .eq('id', leadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, lead_id: leadId, dados_extras: extra })
}
