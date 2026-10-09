'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { moduloPermitido } from '@/lib/modulos'
import { auditar } from '@/lib/auditoria'
import { STATUS_TAGS, STATUS_EXECUCAO, type Resultado, type Momento, type StatusTag, type StatusExecucao } from './tipos'

export type { Resultado, Momento, StatusTag, StatusExecucao }

async function autorizado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && moduloPermitido('academia', user.email) ? user : null
}

const txt = (v: unknown, max = 2000) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s ? s.slice(0, max) : ''
}

function refresh() {
  revalidatePath('/academia/ciclo-anual', 'layout')
}

export async function criarCartao(fd: FormData): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }

  const momento = txt(fd.get('momento'), 20) as Momento
  const titulo = txt(fd.get('titulo'), 200)
  if (!['conhecer', 'explorar', 'criar'].includes(momento) || !titulo) {
    return { ok: false, erro: 'Informe o momento e o título do cartão.' }
  }

  const db = createAdminClient()
  const { data: max } = await db
    .from('academia_cronograma_cards')
    .select('ordem')
    .eq('momento', momento)
    .eq('ativo', true)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: novo, error } = await db.from('academia_cronograma_cards').insert({
    momento,
    ordem: (max?.ordem ?? -1) + 1,
    titulo,
    data_label: txt(fd.get('data_label'), 80),
    status_tag: (['dado', 'sugerido', 'decidido'] as const).includes(txt(fd.get('status_tag')) as StatusTag)
      ? txt(fd.get('status_tag'))
      : 'sugerido',
    descricao: txt(fd.get('descricao'), 2000),
    fonte: txt(fd.get('fonte'), 300) || null,
    marco: txt(fd.get('marco'), 60) || null,
    created_by: user.id,
  }).select('id').single()

  if (error) return { ok: false, erro: error.message }

  await auditar(user, 'INSERT', 'academia_cronograma_cards', novo?.id ?? null, { momento, titulo })
  refresh()
  return { ok: true, id: novo?.id }
}

export async function atualizarCartao(id: string, patch: Record<string, unknown>): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }

  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('titulo' in patch) upd.titulo = txt(patch.titulo, 200)
  if ('data_label' in patch) upd.data_label = txt(patch.data_label, 80)
  if ('status_tag' in patch && STATUS_TAGS.includes(patch.status_tag as StatusTag)) upd.status_tag = patch.status_tag
  if ('descricao' in patch) upd.descricao = txt(patch.descricao, 2000)
  if ('fonte' in patch) upd.fonte = txt(patch.fonte, 300) || null
  if ('marco' in patch) upd.marco = txt(patch.marco, 60) || null
  // status_padrao vale pra TODAS as escolas que não têm uma exceção própria
  // em academia_cronograma_status — é o jeito de marcar uma etapa feita pra
  // todo mundo de uma vez, sem entrar escola por escola.
  if ('status_padrao' in patch && STATUS_EXECUCAO.includes(patch.status_padrao as StatusExecucao)) upd.status_padrao = patch.status_padrao

  const db = createAdminClient()
  const { data: antes } = await db.from('academia_cronograma_cards').select('titulo, data_label, status_tag, descricao, fonte, marco, status_padrao').eq('id', id).maybeSingle()
  const { error } = await db.from('academia_cronograma_cards').update(upd).eq('id', id)
  if (error) return { ok: false, erro: error.message }

  if (antes) await auditar(user, 'UPDATE', 'academia_cronograma_cards', id, upd, antes)
  refresh()
  return { ok: true }
}

export async function excluirCartao(id: string): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }

  const db = createAdminClient()
  const { error } = await db.from('academia_cronograma_cards').update({ ativo: false }).eq('id', id)
  if (error) return { ok: false, erro: error.message }

  await auditar(user, 'DELETE', 'academia_cronograma_cards', id, { ativo: false })
  refresh()
  return { ok: true }
}

/** Cria ou atualiza o status de UM cartão PARA UMA escola — status de execução,
 * prazo (pode variar por escola) e anotações. Upsert: a linha só passa a
 * existir quando alguém mexe no cartão pela primeira vez para aquela escola. */
export async function salvarStatusCartao(cardId: string, escolaId: string, patch: { status?: string; prazo_data?: string | null; anotacoes?: string }): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  if (!escolaId) return { ok: false, erro: 'Selecione uma escola primeiro.' }

  const upd: Record<string, unknown> = { card_id: cardId, escola_id: escolaId, updated_by: user.id, updated_at: new Date().toISOString() }
  if (patch.status !== undefined) {
    if (!STATUS_EXECUCAO.includes(patch.status as StatusExecucao)) return { ok: false, erro: 'Status inválido.' }
    upd.status = patch.status
  }
  if (patch.prazo_data !== undefined) upd.prazo_data = patch.prazo_data || null
  if (patch.anotacoes !== undefined) upd.anotacoes = txt(patch.anotacoes, 4000)

  const db = createAdminClient()
  const { data: antes } = await db.from('academia_cronograma_status').select('status, prazo_data, anotacoes').eq('card_id', cardId).eq('escola_id', escolaId).maybeSingle()
  const { error } = await db.from('academia_cronograma_status').upsert(upd, { onConflict: 'card_id,escola_id' })
  if (error) return { ok: false, erro: error.message }

  await auditar(user, antes ? 'UPDATE' : 'INSERT', 'academia_cronograma_status', cardId, patch, antes ?? undefined)
  refresh()
  return { ok: true }
}

/** Troca a ordem de dois cartões vizinhos do mesmo momento (mover para cima/baixo). */
export async function reordenarCartao(id: string, direcao: 'cima' | 'baixo'): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }

  const db = createAdminClient()
  const { data: atual } = await db.from('academia_cronograma_cards').select('id, momento, ordem').eq('id', id).maybeSingle()
  if (!atual) return { ok: false, erro: 'Cartão não encontrado.' }

  let query = db
    .from('academia_cronograma_cards')
    .select('id, ordem')
    .eq('momento', atual.momento)
    .eq('ativo', true)
  query = direcao === 'cima'
    ? query.lt('ordem', atual.ordem).order('ordem', { ascending: false })
    : query.gt('ordem', atual.ordem).order('ordem', { ascending: true })
  const { data: vizinho } = await query.limit(1).maybeSingle()

  if (!vizinho) return { ok: true } // já está na ponta

  await db.from('academia_cronograma_cards').update({ ordem: vizinho.ordem }).eq('id', atual.id)
  await db.from('academia_cronograma_cards').update({ ordem: atual.ordem }).eq('id', vizinho.id)

  refresh()
  return { ok: true }
}
