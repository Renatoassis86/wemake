import { createAdminClient } from '@/lib/supabase/admin'
import { calcTotalAlunosContrato, calcValorTotalContrato } from '@/lib/contratos'

export interface LinhaReceita {
  id: string
  escola: string
  uf: string
  alunos: number
  anual: number
  mensal: number
  anos: number | null
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
  alunos: number
  ticketAluno: number
  pipelineAnual: number
  /** contratos assinados cujo valor por aluno ainda não foi registrado */
  semValor: number
}

/**
 * Receita contratada: valor anual = soma de (alunos × valor por aluno/ano) de cada série,
 * o mesmo cálculo da Jornada Contratual. O equivalente mensal é o valor anual ÷ 12.
 * Contratos declinados ficam de fora.
 */
export async function carregarReceita(): Promise<ResumoReceita> {
  const db = createAdminClient()
  const { data, error } = await db.from('contratos').select('*').order('updated_at', { ascending: false })
  if (error) return { erro: error.message, linhas: [], assinados: [], receitaAnual: 0, receitaMensal: 0, alunos: 0, ticketAluno: 0, pipelineAnual: 0, semValor: 0 }

  // nomes das escolas em consulta separada (o PostgREST não enxerga a relação contratos → escolas)
  const ids = [...new Set((data ?? []).map((c: { escola_id: string }) => c.escola_id).filter(Boolean))]
  const nomes = new Map<string, { nome: string; estado: string | null }>()
  if (ids.length) {
    const { data: escolas } = await db.from('escolas').select('id, nome, estado').in('id', ids)
    ;(escolas ?? []).forEach((e: { id: string; nome: string; estado: string | null }) => nomes.set(e.id, { nome: e.nome, estado: e.estado }))
  }

  const linhas: LinhaReceita[] = (data ?? [])
    .filter((c: { declinou?: boolean }) => !c.declinou)
    .map((c: any) => {
      const anual = calcValorTotalContrato(c)
      return {
        id: c.id as string,
        escola: nomes.get(c.escola_id)?.nome ?? 'Escola sem cadastro',
        uf: nomes.get(c.escola_id)?.estado ?? '',
        alunos: calcTotalAlunosContrato(c),
        anual,
        mensal: anual / 12,
        anos: (c.tempo_contrato as number | null) ?? null,
        assinado: !!c.contrato_assinado,
        enviado: !!c.contrato_enviado,
        declinou: !!c.declinou,
      }
    })
    .filter(l => l.anual > 0 || l.alunos > 0)

  const assinados = linhas.filter(l => l.assinado).sort((a, b) => b.anual - a.anual)
  const receitaAnual = assinados.reduce((s, l) => s + l.anual, 0)
  const alunos = assinados.reduce((s, l) => s + l.alunos, 0)
  return {
    linhas,
    assinados,
    receitaAnual,
    receitaMensal: receitaAnual / 12,
    alunos,
    ticketAluno: alunos ? receitaAnual / alunos : 0,
    pipelineAnual: linhas.filter(l => !l.assinado).reduce((s, l) => s + l.anual, 0),
    semValor: assinados.filter(l => l.anual === 0).length,
  }
}
