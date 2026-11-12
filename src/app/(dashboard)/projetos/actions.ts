'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { moduloPermitido } from '@/lib/modulos'
import { PRIORIDADES } from '@/lib/projetos'

export interface ActionResult { success: boolean; error?: string; id?: string }

async function autorizado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && moduloPermitido('projetos', user.email) ? user : null
}

const txt = (v: FormDataEntryValue | null, max = 2000) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s ? s.slice(0, max) : null
}

function refresh() {
  revalidatePath('/projetos')
}

// ─── Tarefas ────────────────────────────────────────────────────────────────

export async function criarTarefa(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada. Entre novamente.' }

  const colunaId = fd.get('coluna_id') as string
  const titulo = txt(fd.get('titulo'), 300)
  if (!colunaId || !titulo) return { success: false, error: 'Informe o título da tarefa.' }

  const db = createAdminClient()
  const { data: max } = await db.from('projetos_tarefas').select('ordem').eq('coluna_id', colunaId).order('ordem', { ascending: false }).limit(1).maybeSingle()

  const prioridade = txt(fd.get('prioridade'))
  const { data, error } = await db.from('projetos_tarefas').insert({
    coluna_id: colunaId,
    titulo,
    descricao: txt(fd.get('descricao'), 4000),
    responsavel: txt(fd.get('responsavel'), 200),
    prioridade: prioridade && (PRIORIDADES as readonly string[]).includes(prioridade) ? prioridade : null,
    data_vencimento: txt(fd.get('data_vencimento')),
    ordem: (max?.ordem ?? -1) + 1,
    created_by: user.id,
  }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function atualizarTarefa(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada. Entre novamente.' }

  const id = fd.get('id') as string
  const titulo = txt(fd.get('titulo'), 300)
  if (!id || !titulo) return { success: false, error: 'Informe o título da tarefa.' }

  const prioridade = txt(fd.get('prioridade'))
  const db = createAdminClient()
  const { error } = await db.from('projetos_tarefas').update({
    titulo,
    descricao: txt(fd.get('descricao'), 4000),
    responsavel: txt(fd.get('responsavel'), 200),
    prioridade: prioridade && (PRIORIDADES as readonly string[]).includes(prioridade) ? prioridade : null,
    data_vencimento: txt(fd.get('data_vencimento')),
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id }
}

/**
 * Chamado a cada drag do kanban (dentro da mesma coluna ou entre colunas): recebe
 * a ordem final de cartões de cada coluna afetada (1 coluna se foi só reordenar,
 * 2 se mudou de coluna) e grava a ordem (índice) e a coluna de cada tarefa.
 * Também liga/desliga `concluida` conforme a coluna de destino fechar tarefa ou não.
 */
export async function reordenarColunas(afetadas: { colunaId: string; tarefaIds: string[] }[]): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const db = createAdminClient()
  const { data: colunas } = await db.from('colunas').select('id, fecha_tarefa').in('id', afetadas.map(a => a.colunaId))
  const fechaPorColuna = new Map((colunas ?? []).map(c => [c.id, c.fecha_tarefa]))

  for (const { colunaId, tarefaIds } of afetadas) {
    const fecha = !!fechaPorColuna.get(colunaId)
    for (let i = 0; i < tarefaIds.length; i++) {
      const { error } = await db.from('projetos_tarefas').update({
        coluna_id: colunaId, ordem: i, concluida: fecha, updated_at: new Date().toISOString(),
      }).eq('id', tarefaIds[i])
      if (error) return { success: false, error: error.message }
    }
  }

  refresh()
  return { success: true }
}

export async function excluirTarefa(id: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const db = createAdminClient()
  const { error } = await db.from('projetos_tarefas').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

export async function definirTagsDaTarefa(tarefaId: string, tagIds: string[]): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const db = createAdminClient()
  await db.from('tarefas_tags').delete().eq('tarefa_id', tarefaId)
  if (tagIds.length) {
    const { error } = await db.from('tarefas_tags').insert(tagIds.map(tag_id => ({ tarefa_id: tarefaId, tag_id })))
    if (error) return { success: false, error: error.message }
  }

  refresh()
  return { success: true }
}

// ─── Subtarefas ─────────────────────────────────────────────────────────────

export async function criarSubtarefa(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const tarefaId = fd.get('tarefa_id') as string
  const titulo = txt(fd.get('titulo'), 300)
  if (!tarefaId || !titulo) return { success: false, error: 'Informe o título.' }

  const db = createAdminClient()
  const { data: max } = await db.from('subtarefas').select('ordem').eq('tarefa_id', tarefaId).order('ordem', { ascending: false }).limit(1).maybeSingle()
  const { data, error } = await db.from('subtarefas').insert({ tarefa_id: tarefaId, titulo, ordem: (max?.ordem ?? -1) + 1 }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function alternarSubtarefa(id: string, concluida: boolean): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const db = createAdminClient()
  const { error } = await db.from('subtarefas').update({ concluida }).eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

export async function excluirSubtarefa(id: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const db = createAdminClient()
  const { error } = await db.from('subtarefas').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

// ─── Colunas ────────────────────────────────────────────────────────────────

export async function criarColuna(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const quadroId = fd.get('quadro_id') as string
  const nome = txt(fd.get('nome'), 80)
  if (!quadroId || !nome) return { success: false, error: 'Informe o nome da coluna.' }

  const db = createAdminClient()
  const { data: max } = await db.from('colunas').select('ordem').eq('quadro_id', quadroId).order('ordem', { ascending: false }).limit(1).maybeSingle()
  const { data, error } = await db.from('colunas').insert({
    quadro_id: quadroId, nome, cor: txt(fd.get('cor')) ?? '#64748b', ordem: (max?.ordem ?? -1) + 1,
  }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function renomearColuna(id: string, nome: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }
  if (!nome.trim()) return { success: false, error: 'Nome não pode ficar vazio.' }

  const db = createAdminClient()
  const { error } = await db.from('colunas').update({ nome: nome.trim().slice(0, 80) }).eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

export async function excluirColuna(id: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const db = createAdminClient()
  const { error } = await db.from('colunas').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export async function criarTag(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const quadroId = fd.get('quadro_id') as string
  const nome = txt(fd.get('nome'), 40)
  if (!quadroId || !nome) return { success: false, error: 'Informe o nome da tag.' }

  const db = createAdminClient()
  const { data, error } = await db.from('tags').insert({
    quadro_id: quadroId, nome, cor: txt(fd.get('cor')) ?? '#00889e',
  }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function excluirTag(id: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return { success: false, error: 'Sessão expirada.' }

  const db = createAdminClient()
  const { error } = await db.from('tags').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}
