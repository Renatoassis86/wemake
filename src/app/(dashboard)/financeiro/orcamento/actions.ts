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

export async function criarLinhaReceita(fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const ano = Number(fd.get('ano'))
  const nome = String(fd.get('nome') ?? '').trim().slice(0, 200)
  const contratoId = (fd.get('contrato_id') as string) || null
  if (!ano || !nome) return { success: false, error: 'Informe o nome da escola.' }

  const db = createAdminClient()
  const { count } = await db.from('orcamentos_linhas').select('id', { count: 'exact', head: true }).eq('ano', ano).eq('tipo', 'receita')
  const { data, error } = await db.from('orcamentos_linhas').insert({
    ano, tipo: 'receita', contrato_id: contratoId, nome, ordem: (count ?? 0) + 1,
  }).select('id').single()
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true, id: data.id }
}

export async function excluirLinhaReceita(id: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO

  const db = createAdminClient()
  const { error } = await db.from('orcamentos_linhas').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  refresh()
  return { success: true }
}
