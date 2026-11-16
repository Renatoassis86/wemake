import { createAdminClient } from '@/lib/supabase/admin'

export const MESES_LABEL = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export interface LinhaOrcamento {
  id: string
  nome: string
  observacao: string | null
  contratoId: string | null
  meses: number[]
  total: number
  ordem: number
}

export interface OrcamentoReceitas {
  ano: number
  linhas: LinhaOrcamento[]
  totalPorMes: number[]
  totalAnual: number
}

/**
 * Orçamento de receitas de um ano: uma linha por escola, com os 12 valores
 * mensais do orçamento (a projeção/premissa do ano, não recalculada ao vivo
 * do contrato real — contratoId só serve de referência/link pra escola).
 */
export async function carregarOrcamentoReceitas(ano: number): Promise<OrcamentoReceitas> {
  const db = createAdminClient()
  const { data: linhasRaw } = await db
    .from('orcamentos_linhas')
    .select('id, nome, observacao, contrato_id, ordem')
    .eq('ano', ano).eq('tipo', 'receita')
    .order('ordem', { ascending: true })
  const linhas = linhasRaw ?? []
  const ids = linhas.map(l => l.id)

  const { data: valoresRaw } = ids.length
    ? await db.from('orcamentos_valores').select('linha_id, mes, valor').in('linha_id', ids)
    : { data: [] as { linha_id: string; mes: number; valor: number }[] }

  const valoresPorLinha = new Map<string, number[]>()
  for (const l of linhas) valoresPorLinha.set(l.id, Array(12).fill(0))
  for (const v of valoresRaw ?? []) {
    const arr = valoresPorLinha.get(v.linha_id)
    if (arr) arr[v.mes - 1] = Number(v.valor)
  }

  const linhasFinal: LinhaOrcamento[] = linhas.map(l => {
    const meses = valoresPorLinha.get(l.id) ?? Array(12).fill(0)
    return {
      id: l.id, nome: l.nome, observacao: l.observacao, contratoId: l.contrato_id,
      meses, total: meses.reduce((s, v) => s + v, 0), ordem: l.ordem,
    }
  })

  const totalPorMes = Array(12).fill(0)
  for (const l of linhasFinal) l.meses.forEach((v, i) => { totalPorMes[i] += v })

  return { ano, linhas: linhasFinal, totalPorMes, totalAnual: totalPorMes.reduce((s, v) => s + v, 0) }
}
