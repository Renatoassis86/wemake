import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET — busca card completo com membros, comentários e profile
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const [neg, mems, coments] = await Promise.all([
    supabase.from('negociacoes')
      .select('id, escola_id, titulo, stage, valor_estimado, probabilidade, previsao_fechamento, descricao, tags, due_date, due_alerta_min, checklist, agenda_evento_id, responsavel_id, created_at, updated_at')
      .eq('id', id).single(),
    supabase.from('negociacao_membros')
      .select('profile_id')
      .eq('negociacao_id', id),
    supabase.from('negociacao_comentarios')
      .select('id, texto, created_at, autor_id')
      .eq('negociacao_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (neg.error) return NextResponse.json({ error: neg.error.message }, { status: 400 })

  // Lookup user names from usuarios table
  const memberIds = (mems.data ?? []).map((m: any) => m.profile_id)
  const autorIds = (coments.data ?? []).map((c: any) => c.autor_id)
  const allIds = [...new Set([...memberIds, ...autorIds])].filter(Boolean)

  let userMap: Record<string, any> = {}
  if (allIds.length > 0) {
    const { data: usuariosData } = await supabase.from('usuarios').select('id, nome_completo, role').in('id', allIds)
    userMap = Object.fromEntries((usuariosData ?? []).map((u: any) => [u.id, u]))
  }

  return NextResponse.json({
    negociacao: neg.data,
    membros: memberIds.map((pid: string) => userMap[pid] ? { id: pid, nome_completo: userMap[pid].nome_completo, role: userMap[pid].role } : null).filter(Boolean),
    comentarios: (coments.data ?? []).map((c: any) => ({
      ...c,
      profiles: userMap[c.autor_id] ? { id: c.autor_id, nome_completo: userMap[c.autor_id].nome_completo } : null,
    })),
  })
}

// PATCH — atualiza campos do card (titulo, descricao, tags, due_date, valor, stage, etc.)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const ALLOWED = [
    'titulo','descricao','stage','valor_estimado','probabilidade',
    'previsao_fechamento','tags','due_date','due_alerta_min','checklist',
    'responsavel_id','ativa','motivo_perda','observacoes',
  ] as const

  const patch: Record<string, any> = {}
  for (const k of ALLOWED) {
    if (k in body) patch[k] = body[k]
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido enviado' }, { status: 400 })
  }
  patch.updated_at = new Date().toISOString()

  // — Sincroniza evento da agenda quando due_date muda —
  let agendaEventoId: string | null | undefined
  if ('due_date' in body) {
    const { data: atual } = await supabase
      .from('negociacoes')
      .select('agenda_evento_id, titulo, escola_id, escola:escolas(nome)')
      .eq('id', id).single()

    const oldEvId = atual?.agenda_evento_id ?? null

    if (!body.due_date) {
      if (oldEvId) await supabase.from('agenda_eventos').delete().eq('id', oldEvId)
      agendaEventoId = null
    } else {
      const escolaNome = (atual as any)?.escola?.nome ?? ''
      const titEv = `📋 ${atual?.titulo ?? escolaNome ?? 'Negociação'}`
      const dt = new Date(body.due_date)
      const dtFim = new Date(dt.getTime() + 30 * 60_000).toISOString()

      if (oldEvId) {
        await supabase.from('agenda_eventos').update({
          titulo: titEv,
          data_inicio: dt.toISOString(),
          data_fim: dtFim,
        }).eq('id', oldEvId)
        agendaEventoId = oldEvId
      } else {
        const { data: ev } = await supabase.from('agenda_eventos').insert({
          titulo: titEv,
          tipo: 'reuniao',
          cor: '#f59e0b',
          data_inicio: dt.toISOString(),
          data_fim: dtFim,
          dia_inteiro: false,
          escola_id: atual?.escola_id ?? null,
          criado_por: user.id,
        }).select('id').single()
        agendaEventoId = ev?.id ?? null
        if (agendaEventoId) {
          await supabase.from('agenda_participantes').insert({
            evento_id: agendaEventoId,
            profile_id: user.id,
            email: user.email ?? '',
            status: 'aceito',
          })
        }
      }
    }
    if (agendaEventoId !== undefined) patch.agenda_evento_id = agendaEventoId
  }

  const { data, error } = await supabase
    .from('negociacoes')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message, detail: error.details }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE — exclui negociação
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Limpa evento da agenda se houver
  const { data: neg } = await supabase
    .from('negociacoes').select('agenda_evento_id').eq('id', id).single()
  if (neg?.agenda_evento_id) {
    await supabase.from('agenda_eventos').delete().eq('id', neg.agenda_evento_id)
  }

  const { error } = await supabase.from('negociacoes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
