import { createAdminClient } from '@/lib/supabase/admin'
import { calcTotalAlunosContrato, calcValorTotalContrato } from '@/lib/contratos'

const MODELO_LABEL: Record<string, string> = { mensalidade: 'Mensalidade', kit_we_make: 'Kit We Make' }

// Palavras genéricas de tipo de instituição ("Colégio", "Escola", "Instituto"...) e os conectores que
// costumam vir logo depois ("Cristão", "de", "Educacional"...) — removidas em cadeia do início do nome
// pra sobrar só o nome fantasia, evitando estouro de texto nas tabelas de receita.
const PALAVRAS_GENERICAS_ESCOLA = [
  'colegio', 'escola', 'instituto', 'centro',
  'cristao', 'crista', 'educacional', 'cultural', 'educacao',
  'de', 'da', 'do', 'das', 'dos', 'e',
]

function semAcento(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function nomeFantasiaEscola(nome: string): string {
  const palavras = nome.trim().split(/\s+/)
  let inicio = 0
  while (inicio < palavras.length - 1 && PALAVRAS_GENERICAS_ESCOLA.includes(semAcento(palavras[inicio]).toLowerCase())) {
    inicio++
  }
  return palavras.slice(inicio).join(' ') || nome
}

export interface LinhaReceita {
  id: string
  escola: string
  uf: string
  alunos: number
  anual: number
  mensal: number
  /** valores reais de 2027 mês a mês, do Orçamento — null quando a escola não tem linha lá (usa anual/12) */
  mesesReais: number[] | null
  /** valor de cada ano de vigência (a partir do 1º ano com cobrança), quando o contrato declara escalonamento — null repete o anual */
  valoresPorAno: number[] | null
  /** Valor total projetado pra toda a vigência do contrato (real quando o
   *  documento declara, estimado — anual × anos, sem reajuste — quando o
   *  contrato só declara o valor do 1º ano). */
  totalContrato: number
  anos: number | null
  vigenciaInicio: string | null
  vigenciaFim: string | null
  modelo: string | null
  veterana: boolean
  assinado: boolean
  enviado: boolean
  declinou: boolean
}

export interface ResumoReceita {
  erro?: string
  linhas: LinhaReceita[]
  assinados: LinhaReceita[]
  receitaAnual: number
  receitaMensal: number
  /** Soma do valor total projetado (toda a vigência) dos contratos assinados. */
  receitaTotalContratada: number
  alunos: number
  ticketAluno: number
  pipelineAnual: number
  /** contratos assinados cujo valor anual ainda não foi registrado (nem o
   *  real, nem o calculado por segmento) */
  semValor: number
}

/**
 * Receita contratada — mesma fonte usada no módulo de Contratos
 * (contratos.valor_anual / contratos.valor_total, preenchidos a partir dos
 * documentos assinados reais): valor anual é o 1º ano de vigência (mensalidade
 * × 12, ou valor do Kit do ano 1); valor total é a projeção pra toda a
 * vigência. O cálculo antigo por segmento (calcValorTotalContrato) só entra
 * como fallback pra contratos que nunca tiveram esses campos preenchidos —
 * não serve pros contratos reais auditados, que não precificam por série.
 * Contratos declinados ficam de fora.
 */
export async function carregarReceita(): Promise<ResumoReceita> {
  const db = createAdminClient()
  const { data, error } = await db.from('contratos').select('*').order('updated_at', { ascending: false })
  if (error) return { erro: error.message, linhas: [], assinados: [], receitaAnual: 0, receitaMensal: 0, receitaTotalContratada: 0, alunos: 0, ticketAluno: 0, pipelineAnual: 0, semValor: 0 }

  // nomes das escolas em consulta separada (o PostgREST não enxerga a relação contratos → escolas)
  const ids = [...new Set((data ?? []).map((c: { escola_id: string }) => c.escola_id).filter(Boolean))]
  const nomes = new Map<string, { nome: string; estado: string | null }>()
  if (ids.length) {
    const { data: escolas } = await db.from('escolas').select('id, nome, estado').in('id', ids)
    ;(escolas ?? []).forEach((e: { id: string; nome: string; estado: string | null }) => nomes.set(e.id, { nome: e.nome, estado: e.estado }))
  }

  // Meses reais de 2027, do módulo de Orçamento — mesma fonte que a grade
  // editável usa, bem mais precisa que repetir anual/12 (que ignora início
  // de vigência no meio do ano, gratuidade, rescisão etc).
  const contratoIds = [...new Set((data ?? []).map((c: { id: string }) => c.id))]
  const mesesPorContrato = new Map<string, number[]>()
  if (contratoIds.length) {
    const { data: linhasOrc } = await db.from('orcamentos_linhas').select('id, contrato_id').eq('ano', 2027).eq('tipo', 'receita').in('contrato_id', contratoIds)
    const linhaIdParaContrato = new Map((linhasOrc ?? []).map((l: { id: string; contrato_id: string }) => [l.id, l.contrato_id]))
    const linhaIds = [...linhaIdParaContrato.keys()]
    if (linhaIds.length) {
      const { data: valoresOrc } = await db.from('orcamentos_valores').select('linha_id, mes, valor').in('linha_id', linhaIds)
      for (const l of linhaIds) mesesPorContrato.set(linhaIdParaContrato.get(l)!, Array(12).fill(0))
      for (const v of valoresOrc ?? []) {
        const contratoId = linhaIdParaContrato.get(v.linha_id)
        if (contratoId) mesesPorContrato.get(contratoId)![v.mes - 1] = Number(v.valor)
      }
    }
  }

  const linhas: LinhaReceita[] = (data ?? [])
    .filter((c: { declinou?: boolean }) => !c.declinou)
    .map((c: any) => {
      const anual = c.valor_anual ?? calcValorTotalContrato(c)
      const totalContrato = c.valor_total ?? calcValorTotalContrato(c)
      const ini = c.vigencia_inicio ? new Date(c.vigencia_inicio + 'T00:00:00') : null
      const fim = c.vigencia_fim ? new Date(c.vigencia_fim + 'T00:00:00') : null
      const anos = ini && fim ? ((fim.getFullYear() - ini.getFullYear()) * 12 + (fim.getMonth() - ini.getMonth()) + 1) / 12 : (c.tempo_contrato ?? null)
      return {
        id: c.id as string,
        escola: nomeFantasiaEscola(nomes.get(c.escola_id)?.nome ?? 'Escola sem cadastro'),
        uf: nomes.get(c.escola_id)?.estado ?? '',
        alunos: calcTotalAlunosContrato(c),
        anual,
        mensal: anual / 12,
        mesesReais: mesesPorContrato.get(c.id) ?? null,
        valoresPorAno: Array.isArray(c.valores_por_ano) ? c.valores_por_ano : null,
        totalContrato,
        anos,
        vigenciaInicio: c.vigencia_inicio ?? null,
        vigenciaFim: c.vigencia_fim ?? null,
        modelo: MODELO_LABEL[c.modelo_comercial as string] ?? null,
        veterana: !!c.marcado_veterana,
        assinado: !!c.contrato_assinado,
        enviado: !!c.contrato_enviado,
        declinou: !!c.declinou,
      }
    })
    .filter(l => l.anual > 0 || l.totalContrato > 0 || l.alunos > 0)

  const assinados = linhas.filter(l => l.assinado).sort((a, b) => b.anual - a.anual)
  const receitaAnual = assinados.reduce((s, l) => s + l.anual, 0)
  const alunos = assinados.reduce((s, l) => s + l.alunos, 0)
  return {
    linhas,
    assinados,
    receitaAnual,
    receitaMensal: receitaAnual / 12,
    receitaTotalContratada: assinados.reduce((s, l) => s + l.totalContrato, 0),
    alunos,
    ticketAluno: alunos ? receitaAnual / alunos : 0,
    pipelineAnual: linhas.filter(l => !l.assinado).reduce((s, l) => s + l.anual, 0),
    semValor: assinados.filter(l => l.anual === 0 && l.totalContrato === 0).length,
  }
}
