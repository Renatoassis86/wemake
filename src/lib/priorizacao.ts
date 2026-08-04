/**
 * priorizacao.ts — Lógica de negócio para a Fila de Priorização Comercial.
 *
 * Critérios de priorização (v1):
 *  - Escolas sem negociação ativa em fechamento/ganho/perdido → "Fila de Abordagem"
 *  - Ordenação: alunosEfetivo DESC (maior porte primeiro; usa estimativa de leads_escola quando o cadastro está vazio)
 *  - Escolas sem porte (nem cadastro nem estimativa) → "Completar Cadastro"
 *  - Escolas com contrato assinado → "Parceiras Ativas"
 *  - Ação urgente: stage 'fechamento' ou contrato_enviado sem contrato_assinado
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarNomeEscola } from '@/lib/utils'
import type { EscolaResumo, Negociacao, Contrato, StageNegociacao } from '@/types/database'

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export interface PerfilPesquisa {
  confessionalidade: string | null
  csi: string | null
  nps: number | null
  interesseSolucao: string | null
}

export interface EscolaFila extends EscolaResumo {
  negociacao_stage: StageNegociacao | null
  negociacao_id: string | null
  contrato_assinado: boolean
  acaoUrgente: boolean
  whatsapp_url: string | null
  perfilPesquisa: PerfilPesquisa | null // dado real da pesquisa comercial (leads_perfil_escola), vinculado por escola_id
  alunosEfetivo: number      // total_alunos do cadastro; se 0/vazio, cai para a estimativa de leads_escola
  alunosEstimado: boolean    // true quando alunosEfetivo veio da estimativa (cadastro ainda não preenchido)
  propostaEnviada: boolean   // true quando existe registro em `propostas` para esta escola
}

export interface FilaPriorizacaoResult {
  elegiveis: EscolaFila[]           // Fila de Abordagem (com alunosEfetivo > 0, sem deal fechado)
  filaCompletarCadastro: EscolaFila[] // Sem dados de porte (nem cadastro nem estimativa)
  clientesAtivos: EscolaFila[]      // Parceiras ativas (contrato assinado)
  acaoUrgente: number               // Contagem de ações urgentes
  distribuicaoPorEstado: { estado: string; count: number }[]
  distribuicaoPorEstagio: { stage: string; label: string; count: number }[]
  distribuicaoPorConfessionalidade: { valor: string; count: number }[]
  totalRespostasPesquisa: number
  totalComAlunosCadastrados: number  // escolas com total_alunos > 0 confirmado no cadastro
  totalSemAlunosCadastrados: number  // escolas sem dado de porte confirmado (mesmo que tenham estimativa)
}

// Agrupa as variações de texto da resposta de confessionalidade (mudou de redação entre
// levas de pesquisa) nas mesmas 4 categorias de negócio.
export function bucketConfessionalidade(valor: string): string {
  const v = valor.toLowerCase()
  if (v.includes('transição')) return 'Em transição'
  if (v.includes('estudo') || v.includes('avaliar')) return 'Em estudo'
  if (v.includes('não é uma direção') || v.includes('nao e uma direcao')) return 'Não considera'
  if (v.includes('confessional')) return 'Confessional'
  return valor
}

const STAGE_LABELS: Record<StageNegociacao, string> = {
  prospeccao:  'Prospecção',
  qualificacao: 'Qualificação',
  apresentacao: 'Apresentação',
  proposta:    'Proposta',
  negociacao:  'Negociação',
  fechamento:  'Fechamento',
  ganho:       'Ganho',
  perdido:     'Perdido',
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function getFilaPriorizacao(): Promise<FilaPriorizacaoResult> {
  const supabase = await createClient()
  // leads_escola e leads_perfil_escola não têm policy de SELECT para o role
  // authenticated (confirmado: também bloqueadas para anon) — usa a service role
  // para essas duas, mesmo padrão já usado no projeto para tabelas de leads
  // (ver upsertEscola/enviarFormularioPublico em actions.ts).
  const admin = createAdminClient()

  // Busca paralela: escolas ativas + todas as negociações (inclusive inativas — o histórico
  // não pode desaparecer da Situação Comercial só porque foi arquivado) + contratos + perfil
  // da pesquisa comercial + porte estimado (leads_escola) + propostas já geradas na calculadora
  const [escolasRes, negociacoesRes, contratosRes, perfilRes, leadsEscolaRes, propostasRes] = await Promise.all([
    supabase
      .from('escolas_resumo')
      .select('*')
      .eq('ativa', true)
      .order('total_alunos', { ascending: false }),

    supabase
      .from('negociacoes')
      .select('id, escola_id, stage, ativa'),

    supabase
      .from('contratos')
      .select('escola_id, contrato_assinado, contrato_enviado'),

    admin
      .from('leads_perfil_escola')
      .select('escola_id, confessionalidade, csi, nps, interesse_solucao'),

    admin
      .from('leads_escola')
      .select('escola_crm_id, qtd_alunos')
      .not('escola_crm_id', 'is', null),

    supabase
      .from('propostas')
      .select('escola_id, escola_nome'),
  ])

  const escolas = (escolasRes.data ?? []) as EscolaResumo[]
  const negociacoes = (negociacoesRes.data ?? []) as Pick<Negociacao, 'id' | 'escola_id' | 'stage' | 'ativa'>[]
  const contratos = (contratosRes.data ?? []) as Pick<Contrato, 'escola_id' | 'contrato_assinado' | 'contrato_enviado'>[]
  const perfis = (perfilRes.data ?? []) as {
    escola_id: string
    confessionalidade: string | null
    csi: string | null
    nps: number | null
    interesse_solucao: string | null
  }[]
  const leadsEscola = (leadsEscolaRes.data ?? []) as { escola_crm_id: string; qtd_alunos: number | null }[]
  const propostas = (propostasRes.data ?? []) as { escola_id: string | null; escola_nome: string | null }[]

  // Vínculo exato por escola_id (dado real importado do banco de leads/pesquisa comercial)
  const perfilPorEscola = new Map<string, PerfilPesquisa>()
  for (const p of perfis) {
    perfilPorEscola.set(p.escola_id, {
      confessionalidade: p.confessionalidade,
      csi: p.csi,
      nps: p.nps,
      interesseSolucao: p.interesse_solucao,
    })
  }

  // Estimativa de porte (leads_escola.qtd_alunos) — usada só quando o cadastro ainda está vazio
  const alunosEstimadoPorEscola = new Map<string, number>()
  for (const l of leadsEscola) {
    if (l.qtd_alunos != null && l.qtd_alunos > 0) {
      alunosEstimadoPorEscola.set(l.escola_crm_id, l.qtd_alunos)
    }
  }

  // Propostas: prioriza vínculo por escola_id (quando a calculadora salvar isso corretamente);
  // usa nome normalizado como fallback para as propostas antigas sem vínculo.
  const propostaPorEscolaId = new Set<string>()
  const propostaPorNome = new Set<string>()
  for (const p of propostas) {
    if (p.escola_id) propostaPorEscolaId.add(p.escola_id)
    else if (p.escola_nome) propostaPorNome.add(normalizarNomeEscola(p.escola_nome))
  }

  // Índices para acesso rápido
  const negPorEscola = new Map<string, Pick<Negociacao, 'id' | 'escola_id' | 'stage' | 'ativa'>>()
  for (const neg of negociacoes) {
    // Mantém a negociação mais avançada por escola
    const existing = negPorEscola.get(neg.escola_id)
    if (!existing) {
      negPorEscola.set(neg.escola_id, neg)
    } else {
      const stageOrder: StageNegociacao[] = ['prospeccao','qualificacao','apresentacao','proposta','negociacao','fechamento','ganho','perdido']
      if (stageOrder.indexOf(neg.stage) > stageOrder.indexOf(existing.stage)) {
        negPorEscola.set(neg.escola_id, neg)
      }
    }
  }

  const contratoPorEscola = new Map<string, Pick<Contrato, 'escola_id' | 'contrato_assinado' | 'contrato_enviado'>>()
  for (const c of contratos) {
    contratoPorEscola.set(c.escola_id, c)
  }

  // Monta a lista enriquecida
  const todasEscolasEnriquecidas: EscolaFila[] = escolas.map(escola => {
    const neg = negPorEscola.get(escola.id) ?? null
    const contrato = contratoPorEscola.get(escola.id) ?? null

    const negStage = neg?.stage ?? null
    const negId = neg?.id ?? null
    const contratoAssinado = contrato?.contrato_assinado ?? false
    const contratoEnviado = contrato?.contrato_enviado ?? false

    // Urgente: fechamento ativo ou contrato enviado mas não assinado
    const acaoUrgente =
      (negStage === 'fechamento') ||
      (contratoEnviado && !contratoAssinado)

    // Monta WhatsApp URL
    const telefone = escola.telefone?.replace(/\D/g, '') ?? null
    const whatsapp_url = telefone
      ? `https://wa.me/55${telefone}?text=Olá, estou entrando em contato com a ${escola.nome}...`
      : null

    const perfilPesquisa = perfilPorEscola.get(escola.id) ?? null

    const alunosEstimado = escola.total_alunos <= 0 && alunosEstimadoPorEscola.has(escola.id)
    const alunosEfetivo = escola.total_alunos > 0
      ? escola.total_alunos
      : (alunosEstimadoPorEscola.get(escola.id) ?? 0)

    const propostaEnviada = propostaPorEscolaId.has(escola.id) || propostaPorNome.has(normalizarNomeEscola(escola.nome))

    return {
      ...escola,
      negociacao_stage: negStage,
      negociacao_id: negId,
      contrato_assinado: contratoAssinado,
      acaoUrgente,
      whatsapp_url,
      perfilPesquisa,
      alunosEfetivo,
      alunosEstimado,
      propostaEnviada,
    }
  })

  // Separação em listas
  const clientesAtivos = todasEscolasEnriquecidas.filter(e => e.contrato_assinado)
  const clientesAtivosIds = new Set(clientesAtivos.map(e => e.id))

  const elegiveisETodos = todasEscolasEnriquecidas.filter(e => !clientesAtivosIds.has(e.id))

  // Escolas sem stage ganho/perdido que têm porte conhecido (cadastro ou estimativa)
  const elegiveis = elegiveisETodos
    .filter(e => e.alunosEfetivo > 0 && e.negociacao_stage !== 'ganho' && e.negociacao_stage !== 'perdido')
    .sort((a, b) => b.alunosEfetivo - a.alunosEfetivo)

  const filaCompletarCadastro = elegiveisETodos
    .filter(e => e.alunosEfetivo <= 0 && e.negociacao_stage !== 'ganho' && e.negociacao_stage !== 'perdido')
    .sort((a, b) => a.nome.localeCompare(b.nome))

  // Contagem real de cadastro preenchido (independente de estimativa) — para acompanhamento de qualidade de dados
  const totalComAlunosCadastrados = elegiveisETodos.filter(e => e.total_alunos > 0).length
  const totalSemAlunosCadastrados = elegiveisETodos.filter(e => e.total_alunos <= 0).length

  // Distribuição por estado (apenas elegiveis)
  const estadoMap = new Map<string, number>()
  for (const e of elegiveis) {
    const uf = e.estado ?? 'N/A'
    estadoMap.set(uf, (estadoMap.get(uf) ?? 0) + 1)
  }
  const distribuicaoPorEstado = [...estadoMap.entries()]
    .map(([estado, count]) => ({ estado, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Distribuição por estágio — inclui as escolas sem negociação ativa (funil completo)
  const stagioMap = new Map<string, number>()
  for (const e of elegiveis) {
    const key = e.negociacao_stage ?? 'sem_negociacao'
    stagioMap.set(key, (stagioMap.get(key) ?? 0) + 1)
  }
  const distribuicaoPorEstagio = [...stagioMap.entries()]
    .map(([stage, count]) => ({
      stage,
      label: stage === 'sem_negociacao' ? 'Sem negociação ativa' : (STAGE_LABELS[stage as StageNegociacao] ?? stage),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // Distribuição por confessionalidade — resposta LITERAL do questionário (sem agrupar),
  // para bater exatamente com as opções que a escola viu na pesquisa.
  const confessMap = new Map<string, number>()
  for (const p of perfis) {
    if (!p.confessionalidade) continue
    confessMap.set(p.confessionalidade, (confessMap.get(p.confessionalidade) ?? 0) + 1)
  }
  const distribuicaoPorConfessionalidade = [...confessMap.entries()]
    .map(([valor, count]) => ({ valor, count }))
    .sort((a, b) => b.count - a.count)
  const totalRespostasPesquisa = perfis.filter(p => p.confessionalidade).length

  const acaoUrgente = elegiveis.filter(e => e.acaoUrgente).length

  return {
    elegiveis,
    filaCompletarCadastro,
    clientesAtivos,
    acaoUrgente,
    distribuicaoPorEstado,
    distribuicaoPorEstagio,
    distribuicaoPorConfessionalidade,
    totalRespostasPesquisa,
    totalComAlunosCadastrados,
    totalSemAlunosCadastrados,
  }
}
