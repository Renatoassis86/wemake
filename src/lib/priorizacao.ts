/**
 * priorizacao.ts — Lógica de negócio para a Fila de Priorização Comercial.
 *
 * Critérios de priorização (v1):
 *  - Escolas sem negociação ativa em fechamento/ganho/perdido → "Fila de Abordagem"
 *  - Ordenação: total_alunos DESC (maior porte primeiro)
 *  - Escolas com total_alunos <= 0 → "Completar Cadastro"
 *  - Escolas com contrato assinado → "Parceiras Ativas"
 *  - Ação urgente: stage 'fechamento' ou contrato_enviado sem contrato_assinado
 */

import { createClient } from '@/lib/supabase/server'
import { LABEL } from '@/types/database'
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
}

export interface FilaPriorizacaoResult {
  elegiveis: EscolaFila[]           // Fila de Abordagem (com total_alunos > 0, sem deal fechado)
  filaCompletarCadastro: EscolaFila[] // Sem dados de porte
  clientesAtivos: EscolaFila[]      // Parceiras ativas (contrato assinado)
  acaoUrgente: number               // Contagem de ações urgentes
  distribuicaoPorEstado: { estado: string; count: number }[]
  distribuicaoPorEstagio: { stage: string; label: string; count: number }[]
  distribuicaoPorPerfil: { perfil: string; label: string; count: number }[]
  distribuicaoPorConfessionalidade: { valor: string; count: number }[]
  totalRespostasPesquisa: number
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

  // Busca paralela: escolas ativas + negociações ativas + contratos + perfil da pesquisa comercial
  const [escolasRes, negociacoesRes, contratosRes, perfilRes] = await Promise.all([
    supabase
      .from('escolas_resumo')
      .select('*')
      .eq('ativa', true)
      .order('total_alunos', { ascending: false }),

    supabase
      .from('negociacoes')
      .select('id, escola_id, stage, ativa')
      .eq('ativa', true),

    supabase
      .from('contratos')
      .select('escola_id, contrato_assinado, contrato_enviado'),

    supabase
      .from('leads_perfil_escola')
      .select('escola_id, confessionalidade, csi, nps, interesse_solucao'),
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

    return {
      ...escola,
      negociacao_stage: negStage,
      negociacao_id: negId,
      contrato_assinado: contratoAssinado,
      acaoUrgente,
      whatsapp_url,
      perfilPesquisa,
    }
  })

  // Separação em listas
  const clientesAtivos = todasEscolasEnriquecidas.filter(e => e.contrato_assinado)
  const clientesAtivosIds = new Set(clientesAtivos.map(e => e.id))

  const elegiveisETodos = todasEscolasEnriquecidas.filter(e => !clientesAtivosIds.has(e.id))

  // Escolas sem stage ganho/perdido que têm total_alunos > 0
  const elegiveis = elegiveisETodos
    .filter(e => e.total_alunos > 0 && e.negociacao_stage !== 'ganho' && e.negociacao_stage !== 'perdido')
    .sort((a, b) => b.total_alunos - a.total_alunos)

  const filaCompletarCadastro = elegiveisETodos
    .filter(e => e.total_alunos <= 0 && e.negociacao_stage !== 'ganho' && e.negociacao_stage !== 'perdido')
    .sort((a, b) => a.nome.localeCompare(b.nome))

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

  // Distribuição por perfil pedagógico (dado real do cadastro da escola)
  const perfilMap = new Map<string, number>()
  for (const e of elegiveis) {
    const key = e.perfil_pedagogico ?? 'nao_informado'
    perfilMap.set(key, (perfilMap.get(key) ?? 0) + 1)
  }
  const distribuicaoPorPerfil = [...perfilMap.entries()]
    .map(([perfil, count]) => ({
      perfil,
      label: perfil === 'nao_informado' ? 'Não informado' : (LABEL.perfil_pedagogico[perfil] ?? perfil),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // Distribuição por confessionalidade — resposta real da pesquisa comercial (leads_perfil_escola)
  const confessMap = new Map<string, number>()
  for (const p of perfis) {
    if (!p.confessionalidade) continue
    const bucket = bucketConfessionalidade(p.confessionalidade)
    confessMap.set(bucket, (confessMap.get(bucket) ?? 0) + 1)
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
    distribuicaoPorPerfil,
    distribuicaoPorConfessionalidade,
    totalRespostasPesquisa,
  }
}
