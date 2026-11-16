'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { moduloPermitido } from '@/lib/modulos'

export interface ActionResult { success: boolean; error?: string; id?: string }

async function autorizado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && moduloPermitido('financeiro', user.email) ? user : null
}

const SEM_PERMISSAO = { success: false as const, error: 'Você não tem permissão para editar o orçamento.' }
const refresh = () => revalidatePath('/financeiro/orcamento')

export async function atualizarValorMensal(linhaId: string, mes: number, valor: number): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  if (mes < 1 || mes > 12) return { success: false, error: 'Mês inválido.' }

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_valores').upsert({ linha_id: linhaId, mes, valor: valor || 0 }, { onConflict: 'linha_id,mes' })
  if (error) return { success: false, error: error.message }
  await db.from('orcamentos_linhas').update({ updated_at: new Date().toISOString() }).eq('id', linhaId)

  refresh()
  return { success: true }
}

export async function atualizarExecutadoMensal(linhaId: string, mes: number, valor: number): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  if (mes < 1 || mes > 12) return { success: false, error: 'Mês inválido.' }

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_valores').upsert({ linha_id: linhaId, mes, executado: valor || 0 }, { onConflict: 'linha_id,mes' })
  if (error) return { success: false, error: error.message }
  await db.from('orcamentos_linhas').update({ updated_at: new Date().toISOString() }).eq('id', linhaId)

  refresh()
  return { success: true }
}

export async function atualizarObservacao(linhaId: string, texto: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_linhas').update({ observacao: texto.trim() || null, updated_at: new Date().toISOString() }).eq('id', linhaId)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

export async function vincularContrato(linhaId: string, contratoId: string | null): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_linhas').update({ contrato_id: contratoId, updated_at: new Date().toISOString() }).eq('id', linhaId)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

export async function vincularGrupo(linhaId: string, grupoId: string | null): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_linhas').update({ grupo_id: grupoId, updated_at: new Date().toISOString() }).eq('id', linhaId)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

export async function criarLinhaReceita(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const ano = Number(fd.get('ano'))
  const nome = String(fd.get('nome') ?? '').trim().slice(0, 200)
  const contratoId = (fd.get('contrato_id') as string) || null
  const grupoId = (fd.get('grupo_id') as string) || null
  if (!ano || !nome) return { success: false, error: 'Informe o nome da escola.' }

  const db = createAdminClient()
  const { count } = await db.from('orcamentos_linhas').select('id', { count: 'exact', head: true }).eq('ano', ano).eq('tipo', 'receita')
  const { data, error } = await db.from('orcamentos_linhas').insert({
    ano, tipo: 'receita', contrato_id: contratoId, grupo_id: grupoId, nome, ordem: (count ?? 0) + 1,
  }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function criarLinhaDespesa(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const ano = Number(fd.get('ano'))
  const nome = String(fd.get('nome') ?? '').trim().slice(0, 200)
  const grupoId = (fd.get('grupo_id') as string) || null
  if (!ano || !nome) return { success: false, error: 'Informe o nome da despesa.' }

  const db = createAdminClient()
  const { count } = await db.from('orcamentos_linhas').select('id', { count: 'exact', head: true }).eq('ano', ano).eq('tipo', 'despesa')
  const { data, error } = await db.from('orcamentos_linhas').insert({
    ano, tipo: 'despesa', grupo_id: grupoId, nome, ordem: (count ?? 0) + 1,
  }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function excluirLinha(id: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_linhas').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

export async function criarGrupo(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const ano = Number(fd.get('ano'))
  const tipo = String(fd.get('tipo') ?? '')
  const nome = String(fd.get('nome') ?? '').trim().slice(0, 200)
  const parentId = (fd.get('parent_id') as string) || null
  if (!ano || (tipo !== 'receita' && tipo !== 'despesa') || !nome) return { success: false, error: 'Preencha o nome da categoria.' }

  const db = createAdminClient()
  let nivel = 1
  if (parentId) {
    const { data: pai, error: errPai } = await db.from('orcamentos_grupos').select('nivel').eq('id', parentId).single()
    if (errPai || !pai) return { success: false, error: 'Categoria pai não encontrada.' }
    nivel = pai.nivel + 1
    if (nivel > 6) return { success: false, error: 'Limite de 6 níveis de categoria atingido.' }
  }

  const { count } = await db.from('orcamentos_grupos').select('id', { count: 'exact', head: true }).eq('ano', ano).eq('tipo', tipo)
  const { data, error } = await db.from('orcamentos_grupos').insert({ ano, tipo, nome, parent_id: parentId, nivel, ordem: (count ?? 0) + 1 }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function excluirGrupo(id: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_grupos').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}

export async function criarRemanejamento(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const ano = Number(fd.get('ano'))
  const tipo = String(fd.get('tipo') ?? '')
  const origemLinhaId = (fd.get('origem_linha_id') as string) || null
  const destinoLinhaId = (fd.get('destino_linha_id') as string) || null
  const valor = Number(fd.get('valor'))
  const justificativa = String(fd.get('justificativa') ?? '').trim()

  if (!ano || (tipo !== 'receita' && tipo !== 'despesa')) return { success: false, error: 'Dados inválidos.' }
  if (!origemLinhaId && !destinoLinhaId) return { success: false, error: 'Informe pelo menos a linha de origem ou de destino.' }
  if (!Number.isFinite(valor) || valor <= 0) return { success: false, error: 'Informe um valor maior que zero.' }
  if (!justificativa) return { success: false, error: 'Informe a justificativa do remanejamento.' }

  const db = createAdminClient()
  const { data, error } = await db.from('orcamentos_remanejamentos').insert({
    ano, tipo, origem_linha_id: origemLinhaId, destino_linha_id: destinoLinhaId,
    valor, justificativa, criado_por: user.email,
  }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function excluirRemanejamento(id: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_remanejamentos').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}
