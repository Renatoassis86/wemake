'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { SEGMENTOS_CONTRATO } from '@/lib/contratos'

type ActionResult = { success: boolean; error?: string }

const CAMPOS_QTD_LISTA = SEGMENTOS_CONTRATO.map(([qtdKey]) => qtdKey)
const CAMPOS_QTD = new Set(CAMPOS_QTD_LISTA)

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
  const { data: existing } = await admin.from('contratos').select('*').eq('escola_id', escolaId).maybeSingle()

  // O contrato sempre empurra a mudança pra tabela da gráfica quando a
  // escola está marcada com a tag Livro — o ajuste na gráfica em si (feito
  // por atualizarQtdLivroSerie) é que fica independente, não o contrário.
  const payload: Record<string, unknown> = { [campo]: valor }
  if (existing?.livro_impresso) {
    const livroQtds = { ...(existing.livro_qtds ?? {}), [campo]: valor }
    payload.livro_qtds = livroQtds
  }

  let r = existing
    ? await admin.from('contratos').update(payload).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true, ...payload })
  if (r.error && /livro_qtds/.test(r.error.message)) {
    const { livro_qtds, ...semLivroQtds } = payload
    r = existing
      ? await admin.from('contratos').update(semLivroQtds).eq('id', existing.id)
      : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true, ...semLivroQtds })
  }

  if (r.error) return { success: false, error: r.error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Marca/desmarca a tag "Livro" (pedido de livro impresso pra gráfica). Ao
 * marcar, tira uma foto dos números atuais do contrato pra dentro da
 * gráfica — dali em diante a gráfica pode ser ajustada à parte (ver
 * atualizarQtdLivroSerie). Ao desmarcar, a escola some da tabela da
 * gráfica (ela só lista quem está marcado).
 */
export async function atualizarLivroImpresso(escolaId: string, valor: boolean): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: existing } = await admin.from('contratos').select('*').eq('escola_id', escolaId).maybeSingle()

  const payload: Record<string, unknown> = { livro_impresso: valor }
  if (valor) {
    const livroQtds: Record<string, number> = {}
    for (const campo of CAMPOS_QTD_LISTA) livroQtds[campo] = existing?.[campo] ?? 0
    payload.livro_qtds = livroQtds
  }

  let r = existing
    ? await admin.from('contratos').update(payload).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true, ...payload })
  if (r.error && /livro_qtds/.test(r.error.message)) {
    const { livro_qtds, ...semLivroQtds } = payload
    r = existing
      ? await admin.from('contratos').update(semLivroQtds).eq('id', existing.id)
      : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true, ...semLivroQtds })
  }

  if (r.error) return { success: false, error: r.error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Ajusta a quantidade de livros de uma série na tabela da gráfica, sem
 * alterar a quantidade de alunos do contrato — independente da tabela de
 * cima (só o contrário não vale: editar o contrato sempre atualiza aqui).
 */
export async function atualizarQtdLivroSerie(escolaId: string, campo: string, valor: number): Promise<ActionResult> {
  if (!CAMPOS_QTD.has(campo)) return { success: false, error: 'Campo inválido' }
  if (!Number.isFinite(valor) || valor < 0) return { success: false, error: 'Valor inválido' }

  const admin = createAdminClient()
  const { data: existing, error: errFetch } = await admin.from('contratos').select('id, livro_qtds').eq('escola_id', escolaId).maybeSingle()
  if (errFetch) return { success: false, error: errFetch.message }
  if (!existing) return { success: false, error: 'Escola sem contrato ainda' }

  const livroQtds = { ...(existing.livro_qtds ?? {}), [campo]: valor }
  const { error } = await admin.from('contratos').update({ livro_qtds: livroQtds }).eq('id', existing.id)
  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Adiciona uma escola parceira "veterana" à lista manualmente (escola que já
 * é parceira mas nunca passou pelo funil de minuta/contrato neste sistema).
 * Cria a linha em `contratos` marcada como assinada + veterana, com tudo
 * zerado — o time comercial preenche as quantidades por série em seguida.
 */
export async function adicionarEscolaManual(escolaId: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: existing } = await admin.from('contratos').select('id, contrato_assinado').eq('escola_id', escolaId).maybeSingle()
  const payload = { contrato_assinado: true, marcado_veterana: true }

  let r = existing
    ? await admin.from('contratos').update(payload).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, ...payload })
  if (r.error && /marcado_veterana/.test(r.error.message)) {
    // migração add_contrato_marcado_veterana.sql ainda não rodou — grava sem a flag
    r = existing
      ? await admin.from('contratos').update({ contrato_assinado: true }).eq('id', existing.id)
      : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true })
  }

  if (r.error) return { success: false, error: r.error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Cadastra uma escola nova do zero (não existe em `escolas` ainda) e já
 * adiciona ela à lista da tela, marcada como parceira assinada + veterana.
 */
export async function criarEscolaVeterana(nome: string, estado: string | null): Promise<ActionResult & { escolaId?: string }> {
  const nomeLimpo = nome.trim()
  if (nomeLimpo.length < 2) return { success: false, error: 'Nome inválido' }
  const estadoLimpo = estado?.trim().toUpperCase().slice(0, 2) || null

  const admin = createAdminClient()
  const { data: novaEscola, error: errEscola } = await admin
    .from('escolas').insert({ nome: nomeLimpo, estado: estadoLimpo, ativa: true }).select('id').single()
  if (errEscola) return { success: false, error: errEscola.message }

  let r = await admin.from('contratos').insert({ escola_id: novaEscola.id, contrato_assinado: true, marcado_veterana: true })
  if (r.error && /marcado_veterana/.test(r.error.message)) {
    r = await admin.from('contratos').insert({ escola_id: novaEscola.id, contrato_assinado: true })
  }
  if (r.error) return { success: false, error: r.error.message }

  revalidarTudo(novaEscola.id)
  return { success: true, escolaId: novaEscola.id }
}

/**
 * Remove uma escola da lista (não apaga o cadastro dela, só desmarca
 * contrato_assinado). Recusa se a escola não estiver marcada como veterana
 * — nesse caso ela reflete o funil de verdade, não uma marcação manual, e
 * não deve sair por aqui.
 */
export async function removerEscolaDaLista(escolaId: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: contrato, error: errFetch } = await admin
    .from('contratos').select('*').eq('escola_id', escolaId).maybeSingle()
  if (errFetch) return { success: false, error: errFetch.message }
  if (!contrato) return { success: true }
  if (!contrato.marcado_veterana) {
    return { success: false, error: 'Essa escola está marcada como Nova (funil de verdade) — não pode ser removida por aqui.' }
  }

  const { error } = await admin.from('contratos').update({ contrato_assinado: false }).eq('id', contrato.id)
  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Alterna manualmente a tag Veterana/Nova de uma escola — a classificação é
 * derivada automaticamente (planilha/adição manual = Veterana, chegou pelo
 * funil = Nova), mas o time comercial pode corrigir a mão quando precisar.
 */
export async function atualizarMarcadoVeterana(escolaId: string, valor: boolean): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: existing } = await admin.from('contratos').select('id').eq('escola_id', escolaId).maybeSingle()

  const { error } = existing
    ? await admin.from('contratos').update({ marcado_veterana: valor }).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, contrato_assinado: true, marcado_veterana: valor })

  if (error) {
    if (/marcado_veterana/.test(error.message)) {
      return { success: false, error: 'Rode a migração add_contrato_marcado_veterana.sql no Supabase pra habilitar essa troca.' }
    }
    return { success: false, error: error.message }
  }
  revalidarTudo(escolaId)
  return { success: true }
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

/** Corrige o nome da escola direto na grade (ex.: erro de digitação). */
export async function atualizarNomeEscola(escolaId: string, nome: string): Promise<ActionResult> {
  const nomeLimpo = nome.trim()
  if (nomeLimpo.length < 2) return { success: false, error: 'Nome inválido' }
  const admin = createAdminClient()
  const { error } = await admin.from('escolas').update({ nome: nomeLimpo }).eq('id', escolaId)
  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}
