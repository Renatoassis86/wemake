'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { SEGMENTOS_CONTRATO } from '@/lib/contratos'

type ActionResult = { success: boolean; error?: string }

const CAMPOS_QTD = new Set(SEGMENTOS_CONTRATO.map(([qtdKey]) => qtdKey))

function revalidarTudo(escolaId: string) {
  revalidatePath('/comercial/quantidade-alunos', 'layout')
  revalidatePath('/comercial/metas', 'layout')
  revalidatePath('/comercial/funil-contratacao', 'layout')
  revalidatePath(`/comercial/escolas/${escolaId}`, 'layout')
}

/**
 * Atualiza a quantidade de alunos de uma série específica (uma das 16 colunas
 * de SEGMENTOS_CONTRATO). Cria a linha em `contratos` se a escola ainda não
 * tiver uma (caso de escola veterana adicionada manualmente nesta tela).
 */
export async function atualizarQtdSerie(escolaId: string, campo: string, valor: number): Promise<ActionResult> {
  if (!CAMPOS_QTD.has(campo)) return { success: false, error: 'Campo inválido' }
  if (!Number.isFinite(valor) || valor < 0) return { success: false, error: 'Valor inválido' }

  const admin = createAdminClient()
  const { data: existing } = await admin.from('contratos').select('id').eq('escola_id', escolaId).maybeSingle()

  const { error } = existing
    ? await admin.from('contratos').update({ [campo]: valor }).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true, [campo]: valor })

  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/** Marca/desmarca a tag "Livro" (pedido de livro impresso pra gráfica). */
export async function atualizarLivroImpresso(escolaId: string, valor: boolean): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: existing } = await admin.from('contratos').select('id').eq('escola_id', escolaId).maybeSingle()

  const { error } = existing
    ? await admin.from('contratos').update({ livro_impresso: valor }).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true, livro_impresso: valor })

  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Adiciona uma escola parceira "veterana" à lista manualmente (escola que já
 * é parceira mas nunca passou pelo funil de minuta/contrato neste sistema).
 * Cria a linha em `contratos` marcada como assinada, com tudo zerado — o
 * time comercial preenche as quantidades por série em seguida.
 */
export async function adicionarEscolaManual(escolaId: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: existing } = await admin.from('contratos').select('id, contrato_assinado').eq('escola_id', escolaId).maybeSingle()

  const { error } = existing
    ? await admin.from('contratos').update({ contrato_assinado: true }).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true })

  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Cadastra uma escola nova do zero (não existe em `escolas` ainda) e já
 * adiciona ela à lista da tela, marcada como parceira assinada.
 */
export async function criarEscolaVeterana(nome: string, estado: string | null): Promise<ActionResult & { escolaId?: string }> {
  const nomeLimpo = nome.trim()
  if (nomeLimpo.length < 2) return { success: false, error: 'Nome inválido' }
  const estadoLimpo = estado?.trim().toUpperCase().slice(0, 2) || null

  const admin = createAdminClient()
  const { data: novaEscola, error: errEscola } = await admin
    .from('escolas').insert({ nome: nomeLimpo, estado: estadoLimpo, ativa: true }).select('id').single()
  if (errEscola) return { success: false, error: errEscola.message }

  const { error } = await admin.from('contratos').insert({ escola_id: novaEscola.id, contrato_assinado: true })
  if (error) return { success: false, error: error.message }

  revalidarTudo(novaEscola.id)
  return { success: true, escolaId: novaEscola.id }
}

/** Atualiza o estado (UF) de uma escola — editável direto na grade. */
export async function atualizarEstadoEscola(escolaId: string, estado: string | null): Promise<ActionResult> {
  const estadoLimpo = estado?.trim().toUpperCase().slice(0, 2) || null
  const admin = createAdminClient()
  const { error } = await admin.from('escolas').update({ estado: estadoLimpo }).eq('id', escolaId)
  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}
