'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { moduloPermitido } from '@/lib/modulos'

export interface ActionResult { success: boolean; error?: string }

async function autorizado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && moduloPermitido('financeiro', user.email) ? user : null
}

const SEM_PERMISSAO = { success: false as const, error: 'Você não tem permissão para editar a receita.' }
const refresh = () => {
  revalidatePath('/financeiro/receita')
  revalidatePath('/financeiro/orcamento/receitas')
}

export async function atualizarValorAnualContrato(contratoId: string, valor: number): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const db = createAdminClient()
  const { error } = await db.from('contratos').update({ valor_anual: valor || 0 }).eq('id', contratoId)
  if (error) return { success: false, error: error.message }
  refresh()
  return { success: true }
}

export async function atualizarValorTotalContrato(contratoId: string, valor: number): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const db = createAdminClient()
  const { error } = await db.from('contratos').update({ valor_total: valor || 0 }).eq('id', contratoId)
  if (error) return { success: false, error: error.message }
  refresh()
  return { success: true }
}

/**
 * Grava a previsão mensal real de um contrato no Orçamento 2027 — cria a linha de
 * orçamento automaticamente na primeira edição, pra contratos que ainda não tinham
 * entrado na grade (ex.: contratos novos com só o valor anual preenchido). Mesma
 * tabela/ações que a página de Orçamento > Receitas usa, só que disparada daqui.
 */
export async function atualizarMesContrato(contratoId: string, ano: number, mes: number, valor: number): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  if (mes < 1 || mes > 12) return { success: false, error: 'Mês inválido.' }

  const db = createAdminClient()
  const { data: linhaExistente } = await db.from('orcamentos_linhas')
    .select('id').eq('ano', ano).eq('tipo', 'receita').eq('contrato_id', contratoId).maybeSingle()

  let linhaId = linhaExistente?.id as string | undefined
  if (!linhaId) {
    const { data: contrato } = await db.from('contratos').select('escola_id').eq('id', contratoId).single()
    const { data: escola } = contrato
      ? await db.from('escolas').select('nome').eq('id', contrato.escola_id).single()
      : { data: null }
    const { count } = await db.from('orcamentos_linhas').select('id', { count: 'exact', head: true }).eq('ano', ano).eq('tipo', 'receita')
    const { data: novaLinha, error: e1 } = await db.from('orcamentos_linhas').insert({
      ano, tipo: 'receita', contrato_id: contratoId, nome: escola?.nome ?? 'Escola', ordem: (count ?? 0) + 1,
    }).select('id').single()
    if (e1 || !novaLinha) return { success: false, error: e1?.message ?? 'Não foi possível criar a linha do orçamento.' }
    linhaId = novaLinha.id
  }

  const { error } = await db.from('orcamentos_valores').upsert({ linha_id: linhaId, mes, valor: valor || 0 }, { onConflict: 'linha_id,mes' })
  if (error) return { success: false, error: error.message }
  await db.from('orcamentos_linhas').update({ updated_at: new Date().toISOString() }).eq('id', linhaId)

  refresh()
  return { success: true }
}
