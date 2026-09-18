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
import { createAdminClient } from '@/lib/supabase/admin'
import { buscarUsuariosPorId } from '@/lib/queries'
import { normalizarNomeEscola } from '@/lib/utils'
import { calcValorTotalContrato } from '@/lib/contratos'
import type { Escola, Negociacao, Contrato, StageNegociacao } from '@/types/database'

// Preço de tabela por aluno/ano (teto padrão da Calculadora) — usado só para
// derivar o "desconto" mostrado no painel a partir do valor efetivamente
// enviado na proposta. Não é uma coluna de banco.
const VALOR_TABELA_ALUNO_ANO = 420

// ─── Modelo Fit × Engajamento ───────────────────────────────────────────────
// Padrão de mercado para qualificação de conta em CRM B2B (o mesmo usado por
// HubSpot/Salesforce para MQL/SQL): dois eixos independentes em vez de um
// score único. Misturar "essa conta é um bom encaixe" com "estão engajados
// agora" no mesmo número apaga a diferença entre uma escola grande e alinhada
// mas fria e uma escola pequena mas super engajada — decisões comerciais
// diferentes para cada caso.
//
// A versão anterior (score único) usava negociacoes.probabilidade com peso de
// 40% — mas esse campo foi gravado com um valor fixo (40) na importação em
// massa do Excel, então não carrega nenhum sinal real; todo mundo ficava
// empilhado em "morno". Substituído por um Fit Score calculado só de sinais
// objetivos que já existem no cadastro (porte, amplitude de segmentos, perfil
// pedagógico) — nenhum dado novo precisa ser coletado, e não depende de
// nenhum campo digitado à mão que hoje está com valor fictício.
//
// Quando o time começar a registrar negociacoes.probabilidade com julgamento
// real (não mais o default da importação), dá pra treinar um modelo preditivo
// de verdade (regressão logística sobre o histórico de ganho/perdido) — hoje
// isso não é viável: só há um punhado de negociações "perdido" registradas e
// nenhum "ganho" ainda, amostra pequena demais pra treinar sem overfit.
export type LeadTemperatura = 'quente' | 'morno' | 'frio'
export type Quadrante = 'prioritario' | 'cultivar' | 'oportunista' | 'baixa_prioridade'

export const QUADRANTE_LABELS: Record<Quadrante, string> = {
  prioritario:      'Prioritário',
  cultivar:         'Cultivar',
  oportunista:      'Oportunista',
  baixa_prioridade: 'Baixa Prioridade',
}

const RECENCIA_JANELA_DIAS = 60
const PORTE_ALUNOS_TETO = 500 // alunos — a partir daqui, fit de porte máximo

const FIT_PERFIL_PEDAGOGICO: Record<string, number> = {
  crista_classica: 100, // ICP da We Make (currículo cristão clássico)
  crista_catolica: 70,
  por_principio:   70,
  evangelica:      60,
  convencional:    30,
  outro:           20,
}

// Fit Score (0-100) — "essa conta é um bom encaixe pro nosso ICP?"
function calcularFit(params: {
  totalAlunos: number
  segmentosCount: number
  perfilPedagogico: string | null
}): number {
  const portePct     = Math.min(1, Math.max(0, params.totalAlunos) / PORTE_ALUNOS_TETO) * 100
  const amplitudePct = (params.segmentosCount / 4) * 100
  const perfilPct    = FIT_PERFIL_PEDAGOGICO[params.perfilPedagogico ?? ''] ?? 20

  return Math.round(0.40 * portePct + 0.30 * amplitudePct + 0.30 * perfilPct)
}

// Engajamento Score (0-100) — "esse negócio está quente AGORA?"
//
// Versão anterior: 40% contagem de reuniões + 35% recência da última reunião
// + 25% "tem proposta? sim/não" (binário). Problema real observado no funil
// visual: uma escola em Contrato Assinado — negócio praticamente ganho —
// podia aparecer FRIA, porque o único jeito de "fase avançada" pesar no
// score era esse binário fraco, que não distingue proposta de minuta de
// contrato enviado de assinado. Reuniões também é um sinal ruidoso: registro
// é manual e inconsistente, silêncio não quer dizer "esfriou", pode só
// querer dizer "ninguém lançou o registro".
//
// A fase do funil (negociação < proposta < minuta < contrato enviado <
// assinado/implantação/parceiro ativo) já é o sinal mais objetivo e
// confiável que existe — é literalmente o estado real da negociação, não uma
// proxy. Passa a pesar 60% do score. Os 40% restantes ficam com a recência
// da ÚLTIMA atividade real de qualquer tipo (reunião, criação de proposta ou
// atualização do contrato — não só reunião), como um modificador: um negócio
// parado há muito tempo esfria um pouco, mesmo estando avançado, mas sem
// apagar o peso da fase.
const FASE_PESO_ENGAJAMENTO: Record<FaseFunil, number> = {
  negociacao:        15,
  proposta_enviada:  40,
  minuta:            65,
  contrato_enviado:  85,
  contrato_assinado: 100,
  implantacao:       100,
  parceiro_ativo:    100,
}

function calcularEngajamento(params: {
  faseFunil: FaseFunil
  ultimaAtividade: string | null
}): number {
  const stagePct = FASE_PESO_ENGAJAMENTO[params.faseFunil]

  let recenciaPct = 0
  if (params.ultimaAtividade) {
    const dias = (Date.now() - new Date(params.ultimaAtividade).getTime()) / 86_400_000
    recenciaPct = Math.max(0, 100 - (dias / RECENCIA_JANELA_DIAS) * 100)
  }

  return Math.round(0.60 * stagePct + 0.40 * recenciaPct)
}

function derivarQuadrante(fit: number, engajamento: number): Quadrante {
  const altaFit = fit >= 50
  const altoEngajamento = engajamento >= 50
  if (altaFit && altoEngajamento) return 'prioritario'
  if (altaFit && !altoEngajamento) return 'cultivar'
  if (!altaFit && altoEngajamento) return 'oportunista'
  return 'baixa_prioridade'
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

// Classificação do Funil de Vendas (quente/morno/frio) — regra direta sobre o
// estado real da negociação, substituindo o cruzamento Fit×Engajamento (que
// continua existindo à parte, só para a Matriz Fit×Engajamento do dashboard —
// ver calcularFit/calcularEngajamento/Quadrante acima):
//   quente = já chegou em Minuta ou fase mais avançada
//   morno  = já recebeu o formulário preenchido E já teve proposta enviada
//            (Calculadora ou manual), mas ainda não chegou em Minuta
//   frio   = qualquer outro caso — inclusive quem só teve reunião, sem
//            formulário e sem proposta (é o "default" de tudo que não é
//            quente nem morno, não precisa de nenhuma interação registrada)
function derivarTemperaturaFunil(params: {
  faseFunil: FaseFunil
  formularioRecebido: boolean
  temProposta: boolean
}): LeadTemperatura {
  if (FASE_FUNIL_ORDEM.indexOf(params.faseFunil) >= FASE_FUNIL_ORDEM.indexOf('minuta')) return 'quente'
  if (params.formularioRecebido && params.temProposta) return 'morno'
  return 'frio'
}

export interface EscolaFunil {
  escola_id: string
  escola_nome: string
  cidade: string | null
  estado: string | null
  contato_nome: string | null
  telefone: string | null
  email: string | null
  responsavel_id: string | null
  responsavel_nome: string | null
  alunos_cadastro: number
  alunos_proposta: number | null
  segmentos_ativos: string[]
  bairro: string | null
  perfil_pedagogico: string | null
  origem_lead: string | null
  prioridade_manual: number | null

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
  proposta_tipo: string | null
  proposta_criada_em: string | null

  contrato_id: string | null
  formulario_enviado: boolean
  formulario_recebido: boolean
  proposta_enviada_manual: boolean
  minuta_enviada: boolean
  retorno_minuta: boolean
  minuta_atualizada: boolean
  contrato_enviado: boolean
  contrato_assinado: boolean
  contrato_arquivado: boolean
  declinou: boolean
  contrato_valor_total: number
  implantacao_status: 'nao_iniciada' | 'em_andamento' | 'concluida' | null
  implantacao_iniciada_em: string | null

  fase_funil: FaseFunil
  fit_score: number
  engajamento_score: number
  quadrante: Quadrante
  lead_temperatura: LeadTemperatura
}

export interface FunilContratacaoResult {
  linhas: EscolaFunil[]
  kpis: {
    totalEscolasEmFunil: number
    // Topo do funil — inclui quem ainda não tem nenhuma negociação/proposta/
    // contrato registrado, além de quem já está em algum estágio do funil.
    baseDeLeads: { total: number; quente: number; morno: number; frio: number }
    leadsSemInteracao: number
    totalReunioes: number
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

export function derivarFase(params: {
  contrato_arquivado: boolean
  implantacao_status: string | null
  contrato_assinado: boolean
  contrato_enviado: boolean
  minuta_enviada: boolean
  proposta_id: string | null
  proposta_enviada_manual: boolean
}): FaseFunil {
  if (params.contrato_arquivado && params.implantacao_status === 'concluida') return 'parceiro_ativo'
  if (params.contrato_arquivado) return 'implantacao'
  if (params.contrato_assinado) return 'contrato_assinado'
  if (params.contrato_enviado) return 'contrato_enviado'
  if (params.minuta_enviada) return 'minuta'
  // proposta_id existe só quando a proposta foi gerada pela Calculadora (ou
  // anexada em PDF); proposta_enviada_manual é o checkbox do checklist,
  // marcado à mão quando a proposta foi enviada por outro canal (e-mail,
  // WhatsApp) sem passar pela Calculadora. Os dois contam como "chegou nessa
  // fase" — sem isso, uma escola com o checkbox marcado mas sem proposta_id
  // ficava presa no quadro/fase de negociação mesmo já tendo proposta enviada.
  if (params.proposta_id || params.proposta_enviada_manual) return 'proposta_enviada'
  return 'negociacao'
}

export async function getFunilContratacao(): Promise<FunilContratacaoResult> {
  // escolas e propostas têm policy de SELECT restrita por responsável/role no
  // client comum (confirmado comparando este mesmo relatório logado como
  // gerente vs. usuario — os totais batiam diferente, cada um via só uma
  // fatia da base). Este funil é um KPI de empresa, precisa ser idêntico pra
  // qualquer usuário que abrir a tela — usa admin nas cinco tabelas, mesmo
  // padrão já usado aqui para negociacoes/registros/contratos.
  const admin = createAdminClient()

  const [escolasRes, negociacoesRes, registrosRes, propostasRes, contratosRes, alunosHistoricoRes] = await Promise.all([
    admin.from('escolas').select('*').eq('ativa', true),
    admin.from('negociacoes').select('id, escola_id, stage, valor_estimado, observacoes, probabilidade'),
    admin.from('registros').select('escola_id, data_contato, resumo'),
    admin.from('propostas').select('id, escola_id, escola_nome, valor_aluno_ano, num_alunos, status, validade, tipo, created_at')
      .is('arquivada_em', null)
      .order('created_at', { ascending: false }),
    admin.from('contratos').select('*'),
    admin.from('alunos_historico').select('escola_id, valor, created_at').order('created_at', { ascending: false }),
  ])

  const escolas = (escolasRes.data ?? []) as Escola[]
  const negociacoes = (negociacoesRes.data ?? []) as Pick<Negociacao, 'id' | 'escola_id' | 'stage' | 'valor_estimado' | 'observacoes' | 'probabilidade'>[]
  const registros = (registrosRes.data ?? []) as { escola_id: string; data_contato: string; resumo: string | null }[]
  const propostas = (propostasRes.data ?? []) as { id: string; escola_id: string | null; escola_nome: string | null; valor_aluno_ano: number | null; num_alunos: number | null; status: string | null; validade: string | null; tipo: string | null; created_at: string }[]
  const contratos = (contratosRes.data ?? []) as Contrato[]
  const alunosHistorico = (alunosHistoricoRes.data ?? []) as { escola_id: string; valor: number; created_at: string }[]

  // Último número de alunos registrado manualmente por escola (mais recente
  // primeiro na query) — representa a atualização mais fresca feita durante
  // a negociação, então tem prioridade até sobre o número da proposta.
  const alunosHistoricoPorEscola = new Map<string, number>()
  for (const h of alunosHistorico) {
    if (!alunosHistoricoPorEscola.has(h.escola_id)) alunosHistoricoPorEscola.set(h.escola_id, h.valor)
  }

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

  const usuarios = await buscarUsuariosPorId(admin, escolas.map(e => e.responsavel_id))

  const linhasTodas: EscolaFunil[] = escolas.map(escola => {
    const neg = negPorEscola.get(escola.id) ?? null
    const reunioes = reunioesPorEscola.get(escola.id) ?? { total: 0, ultima: null, primeira: null, primeiraResumo: null }
    const proposta = propostaPorEscolaId.get(escola.id) ?? propostaPorNome.get(normalizarNomeEscola(escola.nome)) ?? null
    const contrato = contratoPorEscola.get(escola.id) ?? null
    // Prioridade: última atualização manual (alunos_historico) > proposta > cadastro.
    const alunosAtual = alunosHistoricoPorEscola.get(escola.id) ?? proposta?.num_alunos ?? escola.total_alunos

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
      proposta_enviada_manual: !!contrato?.proposta_enviada,
    })

    const segmentosEscola = segmentosAtivos(escola)

    const fit_score = calcularFit({
      totalAlunos: alunosAtual ?? 0,
      segmentosCount: segmentosEscola.length,
      perfilPedagogico: escola.perfil_pedagogico ?? null,
    })
    // Última atividade REAL de qualquer tipo, não só reunião — proposta
    // criada e contrato atualizado (minuta/assinatura) também são sinal de
    // que o negócio está sendo trabalhado agora, e reunião sozinha é um
    // sinal ruidoso (depende de alguém lembrar de registrar).
    const ultimaAtividade = [reunioes.ultima, proposta?.created_at ?? null, contrato?.updated_at ?? null]
      .filter((d): d is string => !!d)
      .sort()
      .at(-1) ?? null
    const engajamento_score = calcularEngajamento({ faseFunil: fase, ultimaAtividade })
    const declinou = !!contrato?.declinou
    // Escola que declinou é negócio fechado (perdido) — não faz sentido
    // continuar classificando como quente/morno, mesmo que a fase ou a
    // atividade recente sugerisse isso. Sempre fria/baixa prioridade.
    const quadrante: Quadrante = declinou ? 'baixa_prioridade' : derivarQuadrante(fit_score, engajamento_score)
    const lead_temperatura = declinou ? 'frio' : derivarTemperaturaFunil({
      faseFunil: fase,
      formularioRecebido: !!contrato?.formulario_recebido,
      temProposta: !!proposta || !!contrato?.proposta_enviada,
    })

    return {
      escola_id: escola.id,
      escola_nome: escola.nome,
      cidade: escola.cidade,
      estado: escola.estado,
      contato_nome: escola.contato_nome ?? escola.diretor_nome,
      telefone: escola.telefone,
      email: escola.email,
      responsavel_id: escola.responsavel_id,
      responsavel_nome: escola.responsavel_id ? usuarios.get(escola.responsavel_id)?.full_name ?? null : null,
      // Prioriza a última atualização manual em alunos_historico (o número
      // pode variar durante a negociação — ver adicionarAlunosHistorico),
      // depois o nº de alunos da proposta (Calculadora/planilha), que é o
      // número que embasou o valor negociado, e só por último o cadastro da
      // escola, que pode ser editado depois e divergir do que foi negociado.
      alunos_cadastro: alunosAtual,
      alunos_proposta: proposta?.num_alunos ?? null,
      segmentos_ativos: segmentosEscola,
      bairro: escola.bairro,
      perfil_pedagogico: escola.perfil_pedagogico ?? null,
      origem_lead: escola.origem_lead ?? null,
      prioridade_manual: escola.prioridade_manual ?? null,

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
      proposta_tipo: proposta?.tipo ?? null,
      proposta_criada_em: proposta?.created_at ?? null,

      contrato_id: contrato?.id ?? null,
      formulario_enviado: !!contrato?.formulario_enviado,
      formulario_recebido: !!contrato?.formulario_recebido,
      proposta_enviada_manual: !!contrato?.proposta_enviada,
      minuta_enviada: !!contrato?.minuta_enviada,
      retorno_minuta: !!contrato?.retorno_minuta,
      minuta_atualizada: !!contrato?.minuta_atualizada,
      contrato_enviado: !!contrato?.contrato_enviado,
      contrato_assinado: !!contrato?.contrato_assinado,
      contrato_arquivado: !!contrato?.contrato_arquivado,
      declinou,
      contrato_valor_total: contrato ? calcValorTotalContrato(contrato) : 0,
      implantacao_status: contrato?.implantacao_status ?? null,
      implantacao_iniciada_em: contrato?.implantacao_iniciada_em ?? null,

      fase_funil: fase,
      fit_score,
      engajamento_score,
      quadrante,
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
      // Prioridade manual primeiro (menor número = mais prioritário; sem
      // prioridade definida vai para o fim) — sobrepõe o critério de fase,
      // é uma decisão explícita do time comercial sobre quem abordar antes.
      (a.prioridade_manual ?? Infinity) - (b.prioridade_manual ?? Infinity)
      || FASE_ORDER.indexOf(a.fase_funil) - FASE_ORDER.indexOf(b.fase_funil)
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

  // Escola que declinou é negócio fechado (perdido) — fica de fora do
  // gráfico de Funil de Vendas e dos totais de pipeline/temperatura (que
  // representam o funil ATIVO), mas continua em `linhas` pra aparecer no
  // quadro "Declinaram" da tabela.
  let escolasAtivasEmFunil = 0
  for (const l of linhas) {
    if (l.declinou) continue
    escolasAtivasEmFunil++
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

  // Base de Leads — topo do funil: TODA escola ativa e não recusada, esteja
  // ela já em alguma negociação/proposta/contrato OU sem nenhuma interação
  // ainda (essas últimas somem da tabela normal do funil, que só lista quem
  // já tem negociacao_id/proposta_id/contrato_id — mas continuam existindo
  // no nosso banco). Cumulativo por definição: é o universo inteiro, "nesta
  // etapa (sem interação) ou em qualquer etapa mais avançada".
  const baseDeLeads = { total: 0, quente: 0, morno: 0, frio: 0 }
  for (const l of linhasTodas) {
    if (l.declinou) continue
    baseDeLeads.total++
    baseDeLeads[l.lead_temperatura]++
  }
  const leadsSemInteracao = linhasTodas.filter(l => !l.declinou && !l.negociacao_id && !l.proposta_id && !l.contrato_id).length

  // Total de reuniões/contatos registrados — soma de TODAS as escolas ativas
  // (não só as que já entraram em negociação), sem deduplicar por escola. Vem
  // daqui (admin) em vez de uma query própria da página porque `registros`
  // tem RLS restritiva pro client autenticado comum.
  const totalReunioes = linhasTodas.reduce((soma, l) => soma + l.reunioes_total, 0)

  return {
    linhas,
    kpis: {
      totalEscolasEmFunil: escolasAtivasEmFunil,
      baseDeLeads,
      leadsSemInteracao,
      totalReunioes,
      porFase,
      porFaseTemperatura,
      porTemperatura,
      valorPipelineTotal,
      valorContratadoTotal,
      emImplantacao,
    },
  }
}
