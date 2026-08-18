/**
 * funil-contratacao.ts — agrega, por escola, todo o funil de contratação:
 * negociação → reuniões (registros) → proposta enviada → minuta → contrato
 * enviado/assinado/arquivado → implantação.
 *
 * Mesmo padrão de `priorizacao.ts`: Promise.all + Maps de índice +
 * createAdminClient() para negociacoes/contratos/registros (sem policy de
 * SELECT liberada para authenticated). Não estende getFilaPriorizacao —
 * propósito diferente (fila de abordagem vs. funil já iniciado).
 */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buscarUsuariosPorId } from '@/lib/queries'
import { normalizarNomeEscola } from '@/lib/utils'
import { calcValorTotalContrato } from '@/lib/contratos'
import type { Escola, Negociacao, Contrato, StageNegociacao } from '@/types/database'

// Preço de tabela por aluno/ano (teto padrão da Calculadora) — usado só para
// derivar o "desconto" mostrado no painel a partir do valor efetivamente
// enviado na proposta. Não é uma coluna de banco.
const VALOR_TABELA_ALUNO_ANO = 420

// ─── Modelo de Lead Scoring (Hot/Warm/Cold) ────────────────────────────────
// Padrão de mercado de CRM (mesma taxonomia já usada em registros.classificacao
// e nos KPIs do dashboard comercial). Score 0-100 combinando só sinais que já
// existem no CRM — nenhum dado novo precisa ser coletado:
//   40% probabilidade da negociação (negociacoes.probabilidade)
//   25% engajamento (nº de reuniões registradas, saturando em 5)
//   20% recência (dias desde o último contato — decai a 0 depois de 60 dias)
//   15% sinal de compra (proposta enviada)
export type LeadTemperatura = 'quente' | 'morno' | 'frio'

const RECENCIA_JANELA_DIAS = 60
const ENGAJAMENTO_TETO_REUNIOES = 5

function calcularLeadScore(params: {
  probabilidade: number | null
  reunioesTotal: number
  ultimaInteracao: string | null
  temProposta: boolean
}): { score: number; temperatura: LeadTemperatura } {
  const probPct = Math.max(0, Math.min(100, params.probabilidade ?? 0))

  const engajamentoPct = Math.min(1, params.reunioesTotal / ENGAJAMENTO_TETO_REUNIOES) * 100

  let recenciaPct = 0
  if (params.ultimaInteracao) {
    const dias = (Date.now() - new Date(params.ultimaInteracao).getTime()) / 86_400_000
    recenciaPct = Math.max(0, 100 - (dias / RECENCIA_JANELA_DIAS) * 100)
  }

  const sinalCompraPct = params.temProposta ? 100 : 0

  const score = Math.round(
    0.40 * probPct + 0.25 * engajamentoPct + 0.20 * recenciaPct + 0.15 * sinalCompraPct
  )

  const temperatura: LeadTemperatura = score >= 66 ? 'quente' : score >= 33 ? 'morno' : 'frio'

  return { score, temperatura }
}

export type FaseFunil =
  | 'negociacao' | 'proposta_enviada' | 'minuta'
  | 'contrato_enviado' | 'contrato_assinado' | 'implantacao' | 'parceiro_ativo'

// Ordem do menos para o mais avançado — usada para desenhar o funil visual
// (cada etapa soma as escolas que estão nela OU em qualquer etapa mais avançada,
// convenção padrão de gráfico de funil de vendas).
export const FASE_FUNIL_ORDEM: FaseFunil[] = [
  'negociacao', 'proposta_enviada', 'minuta', 'contrato_enviado',
  'contrato_assinado', 'implantacao', 'parceiro_ativo',
]

export const FASE_LABELS: Record<FaseFunil, string> = {
  negociacao:        'Negociação',
  proposta_enviada:  'Proposta Enviada',
  minuta:            'Minuta',
  contrato_enviado:  'Contrato Enviado',
  contrato_assinado: 'Contrato Assinado',
  implantacao:       'Implantação',
  parceiro_ativo:    'Parceiro Ativo',
}

export interface EscolaFunil {
  escola_id: string
  escola_nome: string
  cidade: string | null
  estado: string | null
  contato_nome: string | null
  responsavel_id: string | null
  responsavel_nome: string | null
  alunos_cadastro: number
  alunos_proposta: number | null
  segmentos_ativos: string[]

  negociacao_id: string | null
  negociacao_stage: StageNegociacao | null
  negociacao_valor_estimado: number | null
  negociacao_observacoes: string | null

  reunioes_total: number
  ultima_interacao: string | null
  primeiro_contato: string | null
  primeiro_contato_resumo: string | null

  proposta_id: string | null
  proposta_valor_aluno_ano: number | null
  proposta_status: string | null
  proposta_validade: string | null
  proposta_desconto_pct: number | null

  contrato_id: string | null
  formulario_enviado: boolean
  formulario_recebido: boolean
  minuta_enviada: boolean
  retorno_minuta: boolean
  minuta_atualizada: boolean
  contrato_enviado: boolean
  contrato_assinado: boolean
  contrato_arquivado: boolean
  contrato_valor_total: number
  implantacao_status: 'nao_iniciada' | 'em_andamento' | 'concluida' | null
  implantacao_iniciada_em: string | null

  fase_funil: FaseFunil
  lead_score: number
  lead_temperatura: LeadTemperatura
}

export interface FunilContratacaoResult {
  linhas: EscolaFunil[]
  kpis: {
    totalEscolasEmFunil: number
    porFase: Record<FaseFunil, number>
    porFaseTemperatura: Record<FaseFunil, Record<LeadTemperatura, number>>
    porTemperatura: Record<LeadTemperatura, number>
    valorPipelineTotal: number
    valorContratadoTotal: number
    emImplantacao: number
  }
}

const STAGE_ORDER: StageNegociacao[] = [
  'prospeccao', 'qualificacao', 'apresentacao', 'proposta', 'negociacao', 'fechamento', 'ganho', 'perdido',
]

function segmentosAtivos(e: Pick<Escola, 'qtd_infantil' | 'qtd_fund1' | 'qtd_fund2' | 'qtd_medio'>): string[] {
  const segs: string[] = []
  if (e.qtd_infantil > 0) segs.push('Infantil')
  if (e.qtd_fund1 > 0)    segs.push('Fund. I')
  if (e.qtd_fund2 > 0)    segs.push('Fund. II')
  if (e.qtd_medio > 0)    segs.push('Médio')
  return segs
}

function derivarFase(params: {
  contrato_arquivado: boolean
  implantacao_status: string | null
  contrato_assinado: boolean
  contrato_enviado: boolean
  minuta_enviada: boolean
  proposta_id: string | null
}): FaseFunil {
  if (params.contrato_arquivado && params.implantacao_status === 'concluida') return 'parceiro_ativo'
  if (params.contrato_arquivado) return 'implantacao'
  if (params.contrato_assinado) return 'contrato_assinado'
  if (params.contrato_enviado) return 'contrato_enviado'
  if (params.minuta_enviada) return 'minuta'
  if (params.proposta_id) return 'proposta_enviada'
  return 'negociacao'
}

export async function getFunilContratacao(): Promise<FunilContratacaoResult> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const [escolasRes, negociacoesRes, registrosRes, propostasRes, contratosRes] = await Promise.all([
    supabase.from('escolas').select('*').eq('ativa', true),
    admin.from('negociacoes').select('id, escola_id, stage, valor_estimado, observacoes, probabilidade'),
    admin.from('registros').select('escola_id, data_contato, resumo'),
    supabase.from('propostas').select('id, escola_id, escola_nome, valor_aluno_ano, num_alunos, status, validade, created_at')
      .is('arquivada_em', null)
      .order('created_at', { ascending: false }),
    admin.from('contratos').select('*'),
  ])

  const escolas = (escolasRes.data ?? []) as Escola[]
  const negociacoes = (negociacoesRes.data ?? []) as Pick<Negociacao, 'id' | 'escola_id' | 'stage' | 'valor_estimado' | 'observacoes' | 'probabilidade'>[]
  const registros = (registrosRes.data ?? []) as { escola_id: string; data_contato: string; resumo: string | null }[]
  const propostas = (propostasRes.data ?? []) as { id: string; escola_id: string | null; escola_nome: string | null; valor_aluno_ano: number | null; num_alunos: number | null; status: string | null; validade: string | null; created_at: string }[]
  const contratos = (contratosRes.data ?? []) as Contrato[]

  // Negociação mais avançada por escola
  const negPorEscola = new Map<string, typeof negociacoes[number]>()
  for (const n of negociacoes) {
    const atual = negPorEscola.get(n.escola_id)
    if (!atual || STAGE_ORDER.indexOf(n.stage) > STAGE_ORDER.indexOf(atual.stage)) {
      negPorEscola.set(n.escola_id, n)
    }
  }

  // Reuniões: contagem + primeira/última data por escola (primeiro contato =
  // resumo de como foi a abertura da negociação, pedido explícito de negócio)
  const reunioesPorEscola = new Map<string, {
    total: number
    ultima: string | null
    primeira: string | null
    primeiraResumo: string | null
  }>()
  for (const r of registros) {
    const atual = reunioesPorEscola.get(r.escola_id) ?? { total: 0, ultima: null, primeira: null, primeiraResumo: null }
    atual.total += 1
    if (!atual.ultima || r.data_contato > atual.ultima) atual.ultima = r.data_contato
    if (!atual.primeira || r.data_contato < atual.primeira) {
      atual.primeira = r.data_contato
      atual.primeiraResumo = r.resumo
    }
    reunioesPorEscola.set(r.escola_id, atual)
  }

  // Proposta mais recente por escola — vínculo por escola_id, com fallback por
  // nome normalizado para propostas antigas sem esse vínculo (mesmo padrão de priorizacao.ts)
  const propostaPorEscolaId = new Map<string, typeof propostas[number]>()
  const propostaPorNome = new Map<string, typeof propostas[number]>()
  for (const p of propostas) {
    if (p.escola_id && !propostaPorEscolaId.has(p.escola_id)) propostaPorEscolaId.set(p.escola_id, p)
    else if (!p.escola_id && p.escola_nome) {
      const chave = normalizarNomeEscola(p.escola_nome)
      if (!propostaPorNome.has(chave)) propostaPorNome.set(chave, p)
    }
  }

  const contratoPorEscola = new Map<string, Contrato>()
  for (const c of contratos) contratoPorEscola.set(c.escola_id, c)

  const usuarios = await buscarUsuariosPorId(supabase, escolas.map(e => e.responsavel_id))

  const linhasTodas: EscolaFunil[] = escolas.map(escola => {
    const neg = negPorEscola.get(escola.id) ?? null
    const reunioes = reunioesPorEscola.get(escola.id) ?? { total: 0, ultima: null, primeira: null, primeiraResumo: null }
    const proposta = propostaPorEscolaId.get(escola.id) ?? propostaPorNome.get(normalizarNomeEscola(escola.nome)) ?? null
    const contrato = contratoPorEscola.get(escola.id) ?? null

    const propostaDesconto = proposta?.valor_aluno_ano
      ? Math.round((1 - proposta.valor_aluno_ano / VALOR_TABELA_ALUNO_ANO) * 10000) / 100
      : null

    const fase = derivarFase({
      contrato_arquivado: !!contrato?.contrato_arquivado,
      implantacao_status: contrato?.implantacao_status ?? null,
      contrato_assinado: !!contrato?.contrato_assinado,
      contrato_enviado: !!contrato?.contrato_enviado,
      minuta_enviada: !!contrato?.minuta_enviada,
      proposta_id: proposta?.id ?? null,
    })

    const { score: lead_score, temperatura: lead_temperatura } = calcularLeadScore({
      probabilidade: neg?.probabilidade ?? null,
      reunioesTotal: reunioes.total,
      ultimaInteracao: reunioes.ultima,
      temProposta: !!proposta?.id,
    })

    return {
      escola_id: escola.id,
      escola_nome: escola.nome,
      cidade: escola.cidade,
      estado: escola.estado,
      contato_nome: escola.contato_nome ?? escola.diretor_nome,
      responsavel_id: escola.responsavel_id,
      responsavel_nome: escola.responsavel_id ? usuarios.get(escola.responsavel_id)?.full_name ?? null : null,
      // Prioriza o nº de alunos da proposta (Calculadora/planilha), que é o
      // número que embasou o valor negociado — o cadastro da escola pode ser
      // editado depois e divergir do que foi realmente proposto.
      alunos_cadastro: proposta?.num_alunos ?? escola.total_alunos,
      alunos_proposta: proposta?.num_alunos ?? null,
      segmentos_ativos: segmentosAtivos(escola),

      negociacao_id: neg?.id ?? null,
      negociacao_stage: neg?.stage ?? null,
      negociacao_valor_estimado: neg?.valor_estimado ?? null,
      negociacao_observacoes: neg?.observacoes ?? null,

      reunioes_total: reunioes.total,
      ultima_interacao: reunioes.ultima,
      primeiro_contato: reunioes.primeira,
      primeiro_contato_resumo: reunioes.primeiraResumo,

      proposta_id: proposta?.id ?? null,
      proposta_valor_aluno_ano: proposta?.valor_aluno_ano ?? null,
      proposta_status: proposta?.status ?? null,
      proposta_validade: proposta?.validade ?? null,
      proposta_desconto_pct: propostaDesconto,

      contrato_id: contrato?.id ?? null,
      formulario_enviado: !!contrato?.formulario_enviado,
      formulario_recebido: !!contrato?.formulario_recebido,
      minuta_enviada: !!contrato?.minuta_enviada,
      retorno_minuta: !!contrato?.retorno_minuta,
      minuta_atualizada: !!contrato?.minuta_atualizada,
      contrato_enviado: !!contrato?.contrato_enviado,
      contrato_assinado: !!contrato?.contrato_assinado,
      contrato_arquivado: !!contrato?.contrato_arquivado,
      contrato_valor_total: contrato ? calcValorTotalContrato(contrato) : 0,
      implantacao_status: contrato?.implantacao_status ?? null,
      implantacao_iniciada_em: contrato?.implantacao_iniciada_em ?? null,

      fase_funil: fase,
      lead_score,
      lead_temperatura,
    }
  })

  // Só entram no funil escolas com algum sinal comercial: negociação, proposta ou contrato.
  const FASE_ORDER: FaseFunil[] = [
    'parceiro_ativo', 'implantacao', 'contrato_assinado', 'contrato_enviado',
    'minuta', 'proposta_enviada', 'negociacao',
  ]
  const linhas = linhasTodas
    .filter(l => l.negociacao_id || l.proposta_id || l.contrato_id)
    .sort((a, b) =>
      FASE_ORDER.indexOf(a.fase_funil) - FASE_ORDER.indexOf(b.fase_funil)
      || b.contrato_valor_total - a.contrato_valor_total
      || (b.negociacao_valor_estimado ?? 0) - (a.negociacao_valor_estimado ?? 0)
    )

  const porFase = {
    negociacao: 0, proposta_enviada: 0, minuta: 0, contrato_enviado: 0,
    contrato_assinado: 0, implantacao: 0, parceiro_ativo: 0,
  } as Record<FaseFunil, number>
  const porFaseTemperatura = Object.fromEntries(
    (Object.keys(porFase) as FaseFunil[]).map(f => [f, { quente: 0, morno: 0, frio: 0 }])
  ) as Record<FaseFunil, Record<LeadTemperatura, number>>
  const porTemperatura: Record<LeadTemperatura, number> = { quente: 0, morno: 0, frio: 0 }
  let valorPipelineTotal = 0
  let valorContratadoTotal = 0
  let emImplantacao = 0

  for (const l of linhas) {
    porFase[l.fase_funil]++
    porFaseTemperatura[l.fase_funil][l.lead_temperatura]++
    porTemperatura[l.lead_temperatura]++
    if (l.fase_funil === 'implantacao') emImplantacao++
    if (l.contrato_assinado) {
      valorContratadoTotal += l.contrato_valor_total
    } else if (l.negociacao_valor_estimado) {
      valorPipelineTotal += l.negociacao_valor_estimado
    }
  }

  return {
    linhas,
    kpis: {
      totalEscolasEmFunil: linhas.length,
      porFase,
      porFaseTemperatura,
      porTemperatura,
      valorPipelineTotal,
      valorContratadoTotal,
      emImplantacao,
    },
  }
}
