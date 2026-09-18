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
    : await admin.from('contratos').insert({ escola_id: escolaId, ...payload })
  if (r.error && /livro_qtds/.test(r.error.message)) {
    const { livro_qtds, ...semLivroQtds } = payload
    r = existing
      ? await admin.from('contratos').update(semLivroQtds).eq('id', existing.id)
      : await admin.from('contratos').insert({ escola_id: escolaId, ...semLivroQtds })
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
    : await admin.from('contratos').insert({ escola_id: escolaId, ...payload })
  if (r.error && /livro_qtds/.test(r.error.message)) {
    const { livro_qtds, ...semLivroQtds } = payload
    r = existing
      ? await admin.from('contratos').update(semLivroQtds).eq('id', existing.id)
      : await admin.from('contratos').insert({ escola_id: escolaId, ...semLivroQtds })
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
 * é parceira mas nunca passou pelo funil de venda 2027 neste sistema). Cria
 * a linha em `contratos` marcada só como veterana, com tudo zerado — o time
 * comercial preenche as quantidades por série em seguida.
 *
 * IMPORTANTE: nunca marca contrato_assinado (nem nenhum outro checklist do
 * funil) aqui — esse campo é o que faz a escola aparecer no Funil de
 * Contratação como negócio fechado. Marcar isso pra uma escola veterana
 * mistura headcount histórico com o funil de vendas real (bug já visto:
 * Legatum aparecendo como "Contrato assinado" sem nunca ter sido marcado).
 */
export async function adicionarEscolaManual(escolaId: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: existing } = await admin.from('contratos').select('id').eq('escola_id', escolaId).maybeSingle()

  const { error } = existing
    ? await admin.from('contratos').update({ marcado_veterana: true }).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, marcado_veterana: true })

  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Cadastra uma escola nova do zero (não existe em `escolas` ainda) e já
 * adiciona ela à lista da tela, marcada como veterana. Ver nota em
 * adicionarEscolaManual sobre nunca marcar contrato_assinado aqui.
 */
export async function criarEscolaVeterana(nome: string, estado: string | null): Promise<ActionResult & { escolaId?: string }> {
  const nomeLimpo = nome.trim()
  if (nomeLimpo.length < 2) return { success: false, error: 'Nome inválido' }
  const estadoLimpo = estado?.trim().toUpperCase().slice(0, 2) || null

  const admin = createAdminClient()
  const { data: novaEscola, error: errEscola } = await admin
    .from('escolas').insert({ nome: nomeLimpo, estado: estadoLimpo, ativa: true }).select('id').single()
  if (errEscola) return { success: false, error: errEscola.message }

  const { error } = await admin.from('contratos').insert({ escola_id: novaEscola.id, marcado_veterana: true })
  if (error) return { success: false, error: error.message }

  revalidarTudo(novaEscola.id)
  return { success: true, escolaId: novaEscola.id }
}

/**
 * Remove uma escola da lista (não apaga o cadastro dela, só desmarca
 * marcado_veterana). Recusa se a escola não estiver marcada como veterana —
 * nesse caso ela está na lista por ter minuta enviada de verdade, e não deve
 * sair por aqui.
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

  const { error } = await admin.from('contratos').update({ marcado_veterana: false }).eq('id', contrato.id)
  if (error) return { success: false, error: error.message }
  revalidarTudo(escolaId)
  return { success: true }
}

/**
 * Alterna manualmente a tag Veterana/Nova de uma escola — a classificação é
 * derivada automaticamente (planilha/adição manual = Veterana, minuta
 * enviada de verdade = Nova), mas o time comercial pode corrigir a mão.
 * Nunca mexe em contrato_assinado nem em nenhum outro checklist do funil.
 */
export async function atualizarMarcadoVeterana(escolaId: string, valor: boolean): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: existing } = await admin.from('contratos').select('id').eq('escola_id', escolaId).maybeSingle()

  const { error } = existing
    ? await admin.from('contratos').update({ marcado_veterana: valor }).eq('id', existing.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, marcado_veterana: valor })

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
