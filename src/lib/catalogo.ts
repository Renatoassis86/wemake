import { createAdminClient } from '@/lib/supabase/admin'
import type { Recurso } from '@/lib/diagnostico'

/* ═══════════ Catálogo mestre do Diagnóstico do Espaço Maker (academia_diag_itens) ═══════════
 * "Tabela mãe": nome, descrição, link de referência e preço valem pra toda escola. A
 * quantidade por escola (qtd_existente, parecer, compras) vive em tabelas separadas e
 * não é afetada por nada aqui — ver academia_diagnostico_portal.sql. */

export interface ItemCatalogo {
  key: string
  secao: 'reutilizavel' | 'consumivel'
  categoria: string | null
  item: string
  spec: string | null
  qtd: number | null
  unid: string | null
  ref: string | null
  valor: number | null
  ordem: number
  ativo: boolean
}

interface LinhaItemBanco {
  item_key: string; secao: string; categoria: string | null; titulo: string; especificacao: string | null
  qtd_recomendada: number | null; unidade: string | null; referencia: string | null; valor_ref: number | null
  ordem: number; ativo: boolean
}

const SECOES_PRODUTO = ['reutilizavel', 'consumivel'] as const

function paraRecurso(r: LinhaItemBanco): Recurso {
  return {
    key: r.item_key,
    categoria: r.categoria ?? '',
    item: r.titulo,
    spec: r.especificacao ?? '',
    qtd: r.qtd_recomendada ?? 0,
    unid: r.unidade ?? '',
    ref: r.referencia ?? '',
    valor: r.valor_ref ?? 0,
  }
}

function paraItemCatalogo(r: LinhaItemBanco): ItemCatalogo {
  return {
    key: r.item_key,
    secao: r.secao as 'reutilizavel' | 'consumivel',
    categoria: r.categoria,
    item: r.titulo,
    spec: r.especificacao,
    qtd: r.qtd_recomendada,
    unid: r.unidade,
    ref: r.referencia,
    valor: r.valor_ref,
    ordem: r.ordem,
    ativo: r.ativo,
  }
}

/** Catálogo ativo, pro formulário da escola, tela de análise e portal — nunca inclui itens arquivados. */
export async function carregarCatalogo(): Promise<{ reutilizaveis: Recurso[]; consumiveis: Recurso[] }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('academia_diag_itens')
    .select('item_key, secao, categoria, titulo, especificacao, qtd_recomendada, unidade, referencia, valor_ref, ordem, ativo')
    .in('secao', SECOES_PRODUTO)
    .eq('ativo', true)
    .order('ordem')
  if (error) throw new Error(`Falha ao carregar catálogo: ${error.message}`)
  const linhas = (data ?? []) as LinhaItemBanco[]
  return {
    reutilizaveis: linhas.filter(r => r.secao === 'reutilizavel').map(paraRecurso),
    consumiveis: linhas.filter(r => r.secao === 'consumivel').map(paraRecurso),
  }
}

/** Catálogo completo (inclusive arquivados) — só pra tela de gestão "Lista de produtos". */
export async function carregarCatalogoAdmin(): Promise<ItemCatalogo[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('academia_diag_itens')
    .select('item_key, secao, categoria, titulo, especificacao, qtd_recomendada, unidade, referencia, valor_ref, ordem, ativo')
    .in('secao', SECOES_PRODUTO)
    .order('ordem')
  if (error) throw new Error(`Falha ao carregar catálogo (admin): ${error.message}`)
  return ((data ?? []) as LinhaItemBanco[]).map(paraItemCatalogo)
}

/** Toda item_key de produto (reutilizável/consumível), ativo ou não — arquivar não deve
 *  invalidar uma resposta que uma escola já tinha gravado antes do arquivamento. */
export async function carregarChavesCatalogo(): Promise<Set<string>> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('academia_diag_itens').select('item_key').in('secao', SECOES_PRODUTO)
  if (error) throw new Error(`Falha ao carregar chaves do catálogo: ${error.message}`)
  return new Set((data ?? []).map(r => r.item_key as string))
}
