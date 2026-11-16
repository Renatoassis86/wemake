import { createAdminClient } from '@/lib/supabase/admin'

export const MESES_LABEL = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export interface Remanejamento {
  id: string
  origemLinhaId: string | null
  destinoLinhaId: string | null
  valor: number
  justificativa: string
  criadoPor: string | null
  createdAt: string
}

export interface LinhaOrcamento {
  id: string
  grupoId: string | null
  nome: string
  observacao: string | null
  contratoId: string | null
  meses: number[]
  executadoMeses: number[]
  total: number
  executadoTotal: number
  /** soma dos remanejamentos ligados a essa linha: +valor quando é destino, -valor quando é origem */
  remanejamentoLiquido: number
  previsaoAtualizada: number
  percentualExecucao: number | null
  ordem: number
}

export interface Grupo {
  id: string
  parentId: string | null
  nivel: number
  nome: string
  ordem: number
  filhos: Grupo[]
  linhas: LinhaOrcamento[]
  previsaoPorMes: number[]
  previsaoTotal: number
  executadoPorMes: number[]
  executadoTotal: number
  previsaoAtualizada: number
  percentualExecucao: number | null
}

export interface Orcamento {
  ano: number
  tipo: 'receita' | 'despesa'
  arvore: Grupo[]
  /** linhas com grupo_id nulo — sempre existe, é onde as linhas antigas (criadas antes da hierarquia) continuam aparecendo */
  semCategoria: LinhaOrcamento[]
  remanejamentos: Remanejamento[]
  totalPorMes: number[]
  totalAnual: number
  executadoTotalPorMes: number[]
  executadoTotalAnual: number
  previsaoAtualizadaTotal: number
  percentualExecucaoTotal: number | null
}

export function somarArrays(a: number[], b: number[]) {
  return a.map((v, i) => v + (b[i] ?? 0))
}

export function pct(executado: number, previsaoAtualizada: number): number | null {
  return previsaoAtualizada > 0 ? (executado / previsaoAtualizada) * 100 : null
}

/**
 * Quantos meses de `ano` já passaram, a partir de hoje — 0 se o ano ainda nem
 * começou, 12 se já acabou. Base pro "executado até agora" do Acompanhamento,
 * que nunca deve somar mês que ainda não aconteceu.
 */
export function mesesDecorridos(ano: number): number {
  const agora = new Date()
  const anoAtual = agora.getFullYear()
  if (ano < anoAtual) return 12
  if (ano > anoAtual) return 0
  return agora.getMonth() + 1
}

export function somarAte(meses: number[], ateMes: number): number {
  return meses.slice(0, ateMes).reduce((s, v) => s + v, 0)
}

/** Recalcula os subtotais de um grupo a partir das linhas diretas + filhos já atualizados (puro, sem rede). */
export function recalcularGrupo(g: Grupo): Grupo {
  let previsaoPorMes = Array(12).fill(0)
  let executadoPorMes = Array(12).fill(0)
  let previsaoAtualizada = 0
  let executadoTotal = 0
  for (const l of g.linhas) {
    previsaoPorMes = somarArrays(previsaoPorMes, l.meses)
    executadoPorMes = somarArrays(executadoPorMes, l.executadoMeses)
    previsaoAtualizada += l.previsaoAtualizada
    executadoTotal += l.executadoTotal
  }
  for (const f of g.filhos) {
    previsaoPorMes = somarArrays(previsaoPorMes, f.previsaoPorMes)
    executadoPorMes = somarArrays(executadoPorMes, f.executadoPorMes)
    previsaoAtualizada += f.previsaoAtualizada
    executadoTotal += f.executadoTotal
  }
  return {
    ...g, previsaoPorMes, previsaoTotal: previsaoPorMes.reduce((s, v) => s + v, 0),
    executadoPorMes, executadoTotal, previsaoAtualizada, percentualExecucao: pct(executadoTotal, previsaoAtualizada),
  }
}

/** Recalcula os totais gerais do orçamento a partir da árvore + "sem categoria" já atualizadas. */
export function recalcularTotais(o: Orcamento): Orcamento {
  let totalPorMes = Array(12).fill(0)
  let executadoTotalPorMes = Array(12).fill(0)
  let previsaoAtualizadaTotal = 0
  let executadoTotalAnual = 0
  for (const no of o.arvore) {
    totalPorMes = somarArrays(totalPorMes, no.previsaoPorMes)
    executadoTotalPorMes = somarArrays(executadoTotalPorMes, no.executadoPorMes)
    previsaoAtualizadaTotal += no.previsaoAtualizada
    executadoTotalAnual += no.executadoTotal
  }
  for (const l of o.semCategoria) {
    totalPorMes = somarArrays(totalPorMes, l.meses)
    executadoTotalPorMes = somarArrays(executadoTotalPorMes, l.executadoMeses)
    previsaoAtualizadaTotal += l.previsaoAtualizada
    executadoTotalAnual += l.executadoTotal
  }
  return {
    ...o, totalPorMes, totalAnual: totalPorMes.reduce((s, v) => s + v, 0),
    executadoTotalPorMes, executadoTotalAnual, previsaoAtualizadaTotal,
    percentualExecucaoTotal: pct(executadoTotalAnual, previsaoAtualizadaTotal),
  }
}

export function recalcularLinha(l: LinhaOrcamento): LinhaOrcamento {
  const total = l.meses.reduce((s, v) => s + v, 0)
  const executadoTotal = l.executadoMeses.reduce((s, v) => s + v, 0)
  const previsaoAtualizada = total + l.remanejamentoLiquido
  return { ...l, total, executadoTotal, previsaoAtualizada, percentualExecucao: pct(executadoTotal, previsaoAtualizada) }
}

export interface GrupoBase { id: string; parentId: string | null; nivel: number; nome: string; ordem: number }

/**
 * Monta a árvore de grupos + "sem categoria" + totais a partir de listas JÁ
 * carregadas (linhas com seus valores/execução/remanejamento já computados).
 * Puro, sem rede — reaproveitado tanto no carregamento do servidor quanto nas
 * atualizações otimistas do lado cliente (depois de editar/mover/criar algo).
 */
export function montarOrcamento(ano: number, tipo: 'receita' | 'despesa', gruposBase: GrupoBase[], linhas: LinhaOrcamento[], remanejamentos: Remanejamento[]): Orcamento {
  const linhasPorGrupo = new Map<string, LinhaOrcamento[]>()
  const semCategoria: LinhaOrcamento[] = []
  for (const l of linhas) {
    if (!l.grupoId) { semCategoria.push(l); continue }
    if (!linhasPorGrupo.has(l.grupoId)) linhasPorGrupo.set(l.grupoId, [])
    linhasPorGrupo.get(l.grupoId)!.push(l)
  }

  const filhosPorPai = new Map<string | null, GrupoBase[]>()
  for (const g of gruposBase) {
    if (!filhosPorPai.has(g.parentId)) filhosPorPai.set(g.parentId, [])
    filhosPorPai.get(g.parentId)!.push(g)
  }

  function montarNo(g: GrupoBase): Grupo {
    const filhos = (filhosPorPai.get(g.id) ?? []).map(montarNo)
    const linhasDiretas = linhasPorGrupo.get(g.id) ?? []
    return recalcularGrupo({
      id: g.id, parentId: g.parentId, nivel: g.nivel, nome: g.nome, ordem: g.ordem,
      filhos, linhas: linhasDiretas,
      previsaoPorMes: [], previsaoTotal: 0, executadoPorMes: [], executadoTotal: 0,
      previsaoAtualizada: 0, percentualExecucao: null,
    })
  }

  const arvore = (filhosPorPai.get(null) ?? []).map(montarNo)

  return recalcularTotais({
    ano, tipo, arvore, semCategoria, remanejamentos,
    totalPorMes: Array(12).fill(0), totalAnual: 0,
    executadoTotalPorMes: Array(12).fill(0), executadoTotalAnual: 0,
    previsaoAtualizadaTotal: 0, percentualExecucaoTotal: null,
  })
}

async function carregarOrcamento(ano: number, tipo: 'receita' | 'despesa'): Promise<Orcamento> {
  const db = createAdminClient()

  const [{ data: gruposRaw }, { data: linhasRaw }, { data: remanejamentosRaw }] = await Promise.all([
    db.from('orcamentos_grupos').select('id, parent_id, nivel, nome, ordem').eq('ano', ano).eq('tipo', tipo).order('nivel', { ascending: true }).order('ordem', { ascending: true }),
    db.from('orcamentos_linhas').select('id, grupo_id, nome, observacao, contrato_id, ordem').eq('ano', ano).eq('tipo', tipo).order('ordem', { ascending: true }),
    db.from('orcamentos_remanejamentos').select('id, origem_linha_id, destino_linha_id, valor, justificativa, criado_por, created_at').eq('ano', ano).eq('tipo', tipo).order('created_at', { ascending: false }),
  ])

  const linhasBase = linhasRaw ?? []
  const ids = linhasBase.map(l => l.id)

  // Busca em lotes de 50 linha_ids: o Supabase/PostgREST corta qualquer select em 1000 linhas por
  // padrão, e 50 linhas × 12 meses já passa disso em orçamentos grandes (despesa hoje tem 145 linhas,
  // 1740 valores) — sem isso, os meses das últimas linhas somem silenciosamente do total.
  const valoresRaw: { linha_id: string; mes: number; valor: number; executado: number }[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const lote = ids.slice(i, i + 50)
    const { data } = await db.from('orcamentos_valores').select('linha_id, mes, valor, executado').in('linha_id', lote)
    if (data) valoresRaw.push(...data)
  }

  const mesesPorLinha = new Map<string, number[]>()
  const executadoPorLinha = new Map<string, number[]>()
  for (const l of linhasBase) {
    mesesPorLinha.set(l.id, Array(12).fill(0))
    executadoPorLinha.set(l.id, Array(12).fill(0))
  }
  for (const v of valoresRaw ?? []) {
    mesesPorLinha.get(v.linha_id)?.splice(v.mes - 1, 1, Number(v.valor))
    executadoPorLinha.get(v.linha_id)?.splice(v.mes - 1, 1, Number(v.executado))
  }

  const remanejamentoLiquidoPorLinha = new Map<string, number>()
  const remanejamentos: Remanejamento[] = (remanejamentosRaw ?? []).map(r => {
    const valor = Number(r.valor)
    if (r.destino_linha_id) remanejamentoLiquidoPorLinha.set(r.destino_linha_id, (remanejamentoLiquidoPorLinha.get(r.destino_linha_id) ?? 0) + valor)
    if (r.origem_linha_id) remanejamentoLiquidoPorLinha.set(r.origem_linha_id, (remanejamentoLiquidoPorLinha.get(r.origem_linha_id) ?? 0) - valor)
    return {
      id: r.id, origemLinhaId: r.origem_linha_id, destinoLinhaId: r.destino_linha_id,
      valor, justificativa: r.justificativa, criadoPor: r.criado_por, createdAt: r.created_at,
    }
  })

  const linhas: LinhaOrcamento[] = linhasBase.map(l => {
    const meses = mesesPorLinha.get(l.id) ?? Array(12).fill(0)
    const executadoMeses = executadoPorLinha.get(l.id) ?? Array(12).fill(0)
    const total = meses.reduce((s, v) => s + v, 0)
    const executadoTotal = executadoMeses.reduce((s, v) => s + v, 0)
    const remanejamentoLiquido = remanejamentoLiquidoPorLinha.get(l.id) ?? 0
    const previsaoAtualizada = total + remanejamentoLiquido
    return {
      id: l.id, grupoId: l.grupo_id, nome: l.nome, observacao: l.observacao, contratoId: l.contrato_id,
      meses, executadoMeses, total, executadoTotal, remanejamentoLiquido, previsaoAtualizada,
      percentualExecucao: pct(executadoTotal, previsaoAtualizada), ordem: l.ordem,
    }
  })

  const gruposBase: GrupoBase[] = (gruposRaw ?? []).map(g => ({ id: g.id, parentId: g.parent_id, nivel: g.nivel, nome: g.nome, ordem: g.ordem }))

  return montarOrcamento(ano, tipo, gruposBase, linhas, remanejamentos)
}

/**
 * Orçamento de receitas de um ano: uma linha por escola (ou agrupada por
 * categoria, se categorizada), com os 12 valores mensais da previsão e, se
 * lançada, da execução real. contratoId só serve de referência/link pra escola.
 */
export async function carregarOrcamentoReceitas(ano: number): Promise<Orcamento> {
  return carregarOrcamento(ano, 'receita')
}

/** Orçamento de despesas de um ano, organizado em categorias de até 6 níveis. */
export async function carregarOrcamentoDespesas(ano: number): Promise<Orcamento> {
  return carregarOrcamento(ano, 'despesa')
}

export interface GrupoFlat { id: string; nome: string; nivel: number }

/** Lista achatada e ordenada (pra selects de "categoria pai" / "mover pra categoria") */
export function achatarGrupos(arvore: Grupo[]): GrupoFlat[] {
  const out: GrupoFlat[] = []
  function visitar(nos: Grupo[]) {
    for (const g of nos) {
      out.push({ id: g.id, nome: g.nome, nivel: g.nivel })
      visitar(g.filhos)
    }
  }
  visitar(arvore)
  return out
}

/**
 * Desmonta um `Orcamento` já carregado de volta pras listas planas (grupos +
 * linhas) que `montarOrcamento` espera — usado uma vez, ao inicializar o
 * estado do componente cliente, pra depois editar/mover/criar sem precisar
 * recarregar a árvore inteira do servidor a cada ação.
 */
export function achatarOrcamento(o: Orcamento): { gruposBase: GrupoBase[]; linhas: LinhaOrcamento[] } {
  const gruposBase: GrupoBase[] = []
  const linhas: LinhaOrcamento[] = [...o.semCategoria]
  function visitar(nos: Grupo[]) {
    for (const g of nos) {
      gruposBase.push({ id: g.id, parentId: g.parentId, nivel: g.nivel, nome: g.nome, ordem: g.ordem })
      linhas.push(...g.linhas)
      visitar(g.filhos)
    }
  }
  visitar(o.arvore)
  return { gruposBase, linhas }
}
