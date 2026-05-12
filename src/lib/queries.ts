/**
 * queries.ts — Funções server-side reutilizáveis para todas as queries do app.
 *
 * REGRAS:
 *  - Todas as funções são async e retornam tipos explícitos.
 *  - Nunca lançam exceção: retornam { data, error } ou arrays vazios em caso de falha.
 *  - Cada função cria seu próprio client (compatível com Server Components e Server Actions).
 *  - As funções de dashboard usam Promise.all para paralelismo máximo.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  Escola,
  EscolaResumo,
  Negociacao,
  Registro,
  Tarefa,
  NotaEscola,
  Contrato,
  Profile,
  ClassificacaoLead,
  StageNegociacao,
} from '@/types/database'

// ─── Tipos de retorno especializados ──────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  totalPages: number
}

export interface QueryError {
  message: string
  code?: string
}

export interface QueryResult<T> {
  data: T | null
  error: QueryError | null
}

/** KPI do Dashboard — retorno da getDashboardStats */
export interface DashboardStats {
  totalEscolas: number
  leadsQuentes: number
  leadsMornos: number
  leadsFrios: number
  registros30Dias: number
  potencialTotal: number
  contratosFechados: number
  tarefasVencidas: number
  top5EscolasPotencial: Top5Escola[]
  distribuicaoClassificacao: DistribuicaoClassificacao[]
  registrosPorMes: RegistrosMes[]
  pipelinePorStage: PipelineStage[]
  registrosRecentes: RegistroComEscola[]
  tarefasVencidasDetalhes: TarefaComEscola[]
  escolasSemContatoRecente: EscolaSemContato[]
}

export interface Top5Escola {
  id: string
  nome: string
  cidade: string | null
  estado: string | null
  potencial_financeiro: number
  total_alunos: number
  classificacao_atual: ClassificacaoLead | null
}

export interface DistribuicaoClassificacao {
  classificacao: ClassificacaoLead
  quantidade: number
  percentual: number
}

export interface RegistrosMes {
  mes: string          // formato 'YYYY-MM'
  label: string        // formato 'MMM/YY' para exibição
  quantidade: number
  potencial_medio: number
}

export interface PipelineStage {
  stage: StageNegociacao
  label: string
  quantidade: number
  valor_estimado_total: number
}

export interface RegistroComEscola extends Omit<Registro, 'escola' | 'responsavel'> {
  escola: Pick<Escola, 'id' | 'nome'> | null
  responsavel: Pick<Profile, 'id' | 'full_name'> | null
}

export interface TarefaComEscola extends Omit<Tarefa, 'escola'> {
  escola: Pick<Escola, 'id' | 'nome'> | null
}

export interface EscolaSemContato {
  id: string
  nome: string
  cidade: string | null
  estado: string | null
  updated_at: string
}

/** Parâmetros de filtro para escolas */
export interface EscolasFiltro {
  q?: string
  estado?: string
  classificacao?: ClassificacaoLead
  responsavel_id?: string
  page?: number
  perPage?: number
}

/** Parâmetros de filtro para registros */
export interface RegistrosFiltro {
  escola_id?: string
  negociacao_id?: string
  responsavel_id?: string
  classificacao?: ClassificacaoLead
  dataInicio?: string
  dataFim?: string
  page?: number
  perPage?: number
}

// ─── ESCOLAS ──────────────────────────────────────────────────────────────────

/**
 * Lista paginada de escolas usando a view `escolas_resumo`.
 * Suporta busca por nome, filtro por estado/classificação/responsável.
 */
export async function getEscolas(
  filtro: EscolasFiltro = {}
): Promise<PaginatedResult<EscolaResumo>> {
  const supabase = await createClient()
  const { q = '', estado = '', page = 1, perPage = 25, responsavel_id } = filtro

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('escolas_resumo')
    .select('*', { count: 'exact' })
    .eq('ativa', true)
    .range(from, to)
    .order('nome')

  if (q)             query = query.ilike('nome', `%${q}%`)
  if (estado)        query = query.eq('estado', estado)
  if (responsavel_id) query = query.eq('responsavel_id', responsavel_id)

  const { data, count, error } = await query

  if (error) {
    console.error('[getEscolas]', error.message)
    return { data: [], count: 0, page, totalPages: 0 }
  }

  const totalPages = Math.ceil((count ?? 0) / perPage)
  return { data: (data ?? []) as EscolaResumo[], count: count ?? 0, page, totalPages }
}

/**
 * Busca uma escola por ID com dados do responsável.
 */
export async function getEscolaById(id: string): Promise<QueryResult<Escola & { responsavel: Profile | null }>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('escolas')
    .select('*, responsavel:profiles!responsavel_id(*)')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: { message: error.message, code: error.code } }
  return { data: data as Escola & { responsavel: Profile | null }, error: null }
}

/**
 * Lista simplificada de escolas ativas para selects/dropdowns.
 */
export async function getEscolasSelect(): Promise<Pick<Escola, 'id' | 'nome'>[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('escolas')
    .select('id, nome')
    .eq('ativa', true)
    .order('nome')

  if (error) {
    console.error('[getEscolasSelect]', error.message)
    return []
  }
  return (data ?? []) as Pick<Escola, 'id' | 'nome'>[]
}

/**
 * Lista os estados únicos das escolas ativas (para filtros).
 */
export async function getEstadosEscolas(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('escolas')
    .select('estado')
    .eq('ativa', true)
    .not('estado', 'is', null)

  if (error) return []
  return [...new Set((data ?? []).map((e: { estado: string | null }) => e.estado).filter(Boolean) as string[])].sort()
}

// ─── REGISTROS ────────────────────────────────────────────────────────────────

/**
 * Lista paginada de registros com dados de escola e responsável.
 */
export async function getRegistros(
  filtro: RegistrosFiltro = {}
): Promise<PaginatedResult<RegistroComEscola>> {
  const supabase = await createClient()
  const {
    escola_id, negociacao_id, responsavel_id, classificacao,
    dataInicio, dataFim,
    page = 1, perPage = 20,
  } = filtro

  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('registros')
    .select(
      '*, escola:escolas(id, nome), responsavel:profiles!responsavel_id(id, full_name)',
      { count: 'exact' }
    )
    .order('data_contato', { ascending: false })
    .order('created_at',   { ascending: false })
    .range(from, to)

  if (escola_id)     query = query.eq('escola_id', escola_id)
  if (negociacao_id) query = query.eq('negociacao_id', negociacao_id)
  if (responsavel_id) query = query.eq('responsavel_id', responsavel_id)
  if (classificacao) query = query.eq('classificacao', classificacao)
  if (dataInicio)    query = query.gte('data_contato', dataInicio)
  if (dataFim)       query = query.lte('data_contato', dataFim)

  const { data, count, error } = await query

  if (error) {
    console.error('[getRegistros]', error.message)
    return { data: [], count: 0, page, totalPages: 0 }
  }

  const totalPages = Math.ceil((count ?? 0) / perPage)
  return { data: (data ?? []) as RegistroComEscola[], count: count ?? 0, page, totalPages }
}

/**
 * Busca um registro individual com escola e responsável.
 */
export async function getRegistroById(id: string): Promise<QueryResult<RegistroComEscola>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registros')
    .select('*, escola:escolas(id, nome), responsavel:profiles!responsavel_id(id, full_name)')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: { message: error.message, code: error.code } }
  return { data: data as RegistroComEscola, error: null }
}

/**
 * Registros de uma escola específica, ordenados por data decrescente.
 */
export async function getRegistrosByEscola(
  escola_id: string,
  limit = 20
): Promise<RegistroComEscola[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registros')
    .select('*, escola:escolas(id, nome), responsavel:profiles!responsavel_id(id, full_name)')
    .eq('escola_id', escola_id)
    .order('data_contato', { ascending: false })
    .order('created_at',   { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getRegistrosByEscola]', error.message)
    return []
  }
  return (data ?? []) as RegistroComEscola[]
}

// ─── NEGOCIAÇÕES ──────────────────────────────────────────────────────────────

/**
 * Busca negociações ativas de uma escola.
 */
export async function getNegociacoesByEscola(escola_id: string): Promise<Negociacao[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('negociacoes')
    .select('*, responsavel:profiles!responsavel_id(id, full_name)')
    .eq('escola_id', escola_id)
    .eq('ativa', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getNegociacoesByEscola]', error.message)
    return []
  }
  return (data ?? []) as Negociacao[]
}

/**
 * Busca uma negociação por ID com escola e responsável.
 */
export async function getNegociacaoById(
  id: string
): Promise<QueryResult<Negociacao & { escola: Escola | null }>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('negociacoes')
    .select('*, escola:escolas(*), responsavel:profiles!responsavel_id(*)')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: { message: error.message, code: error.code } }
  return { data: data as Negociacao & { escola: Escola | null }, error: null }
}

/**
 * Pipeline: negociações ativas agrupadas por stage.
 * Útil para a view Kanban.
 */
export async function getNegociacoesPipeline(): Promise<
  (Negociacao & { escola: Pick<Escola, 'id' | 'nome'> | null })[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('negociacoes')
    .select('*, escola:escolas(id, nome), responsavel:profiles!responsavel_id(id, full_name)')
    .eq('ativa', true)
    .not('stage', 'in', '("ganho","perdido")')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[getNegociacoesPipeline]', error.message)
    return []
  }
  return (data ?? []) as (Negociacao & { escola: Pick<Escola, 'id' | 'nome'> | null })[]
}

// ─── TAREFAS ──────────────────────────────────────────────────────────────────

/**
 * Tarefas de uma escola (pendentes por padrão).
 */
export async function getTarefasByEscola(
  escola_id: string,
  options: { status?: string; limit?: number } = {}
): Promise<TarefaComEscola[]> {
  const supabase = await createClient()
  const { status = 'pendente', limit = 50 } = options

  let query = supabase
    .from('tarefas')
    .select('*, escola:escolas(id, nome)')
    .eq('escola_id', escola_id)
    .order('vencimento', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    console.error('[getTarefasByEscola]', error.message)
    return []
  }
  return (data ?? []) as TarefaComEscola[]
}

/**
 * Tarefas vencidas (pendentes com vencimento < hoje).
 */
export async function getTarefasVencidas(limit = 10): Promise<TarefaComEscola[]> {
  const supabase = await createClient()
  const hoje = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('tarefas')
    .select('*, escola:escolas(id, nome)')
    .eq('status', 'pendente')
    .lt('vencimento', hoje)
    .order('vencimento', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[getTarefasVencidas]', error.message)
    return []
  }
  return (data ?? []) as TarefaComEscola[]
}

/**
 * Contagem de tarefas vencidas do usuário atual.
 */
export async function countTarefasVencidas(): Promise<number> {
  const supabase = await createClient()
  const hoje = new Date().toISOString().split('T')[0]

  const { count, error } = await supabase
    .from('tarefas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pendente')
    .lt('vencimento', hoje)

  if (error) return 0
  return count ?? 0
}

// ─── NOTAS ────────────────────────────────────────────────────────────────────

/**
 * Notas de uma escola, fixadas primeiro.
 */
export async function getNotasByEscola(escola_id: string): Promise<NotaEscola[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notas_escola')
    .select('*')
    .eq('escola_id', escola_id)
    .order('fixada',    { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getNotasByEscola]', error.message)
    return []
  }
  return (data ?? []) as NotaEscola[]
}

// ─── CONTRATOS ────────────────────────────────────────────────────────────────

/**
 * Contrato de uma escola (única por escola).
 */
export async function getContratoByEscola(escola_id: string): Promise<QueryResult<Contrato>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('escola_id', escola_id)
    .maybeSingle()

  if (error) return { data: null, error: { message: error.message, code: error.code } }
  return { data: data as Contrato | null, error: null }
}

/**
 * Lista contratos assinados (fechados).
 */
export async function getContratosFechados(): Promise<(Contrato & { escola: Pick<Escola, 'id' | 'nome'> | null })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contratos')
    .select('*, escola:escolas(id, nome)')
    .eq('contrato_assinado', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[getContratosFechados]', error.message)
    return []
  }
  return data as (Contrato & { escola: Pick<Escola, 'id' | 'nome'> | null })[]
}

// ─── PROFILES ─────────────────────────────────────────────────────────────────

/**
 * Lista de usuários ativos para selects/dropdowns.
 */
export async function getProfilesAtivos(): Promise<Pick<Profile, 'id' | 'full_name' | 'role'>[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    console.error('[getProfilesAtivos]', error.message)
    return []
  }
  return (data ?? []) as Pick<Profile, 'id' | 'full_name' | 'role'>[]
}

/**
 * Perfil do usuário autenticado atual.
 */
export async function getCurrentProfile(): Promise<QueryResult<Profile>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: { message: 'Não autenticado' } }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return { data: null, error: { message: error.message, code: error.code } }
  return { data: data as Profile, error: null }
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

/**
 * getDashboardStats — busca TODOS os KPIs do dashboard em paralelo.
 *
 * Dispara ~10 queries simultâneas via Promise.all, minimizando latência total.
 * Todas as queries são independentes entre si.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const hoje         = new Date().toISOString().split('T')[0]
  const trintaDias   = new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]
  const sesMesesAtras = new Date(Date.now() - 180 * 86400_000).toISOString().split('T')[0]

  // ── Dispara tudo em paralelo ───────────────────────────────────────────────
  const [
    totalEscolasRes,
    leadsQuentesRes,
    leadsMornosRes,
    leadsFriosRes,
    registros30DiasRes,
    potencialTotalRes,
    contratosFechadosRes,
    tarefasVencidasCountRes,
    top5EscolasRes,
    classificacaoDistRes,
    registrosPorMesRes,
    pipelineStagesRes,
    registrosRecentesRes,
    tarefasVencidasDetalheRes,
    escolasSemContatoRes,
  ] = await Promise.all([

    // 1. Total de escolas ativas
    supabase
      .from('escolas')
      .select('*', { count: 'exact', head: true })
      .eq('ativa', true),

    // 2. Leads quentes (por escola distinta — pega o registro mais recente)
    supabase
      .from('registros')
      .select('escola_id', { count: 'exact', head: true })
      .eq('classificacao', 'quente'),

    // 3. Leads mornos
    supabase
      .from('registros')
      .select('escola_id', { count: 'exact', head: true })
      .eq('classificacao', 'morno'),

    // 4. Leads frios
    supabase
      .from('registros')
      .select('escola_id', { count: 'exact', head: true })
      .eq('classificacao', 'frio'),

    // 5. Registros nos últimos 30 dias
    supabase
      .from('registros')
      .select('*', { count: 'exact', head: true })
      .gte('data_contato', trintaDias),

    // 6. Potencial total de todas escolas ativas (soma)
    supabase
      .from('escolas')
      .select('potencial_financeiro')
      .eq('ativa', true),

    // 7. Contratos assinados (fechados)
    supabase
      .from('contratos')
      .select('*', { count: 'exact', head: true })
      .eq('contrato_assinado', true),

    // 8. Tarefas vencidas (count)
    supabase
      .from('tarefas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .lt('vencimento', hoje),

    // 9. Top 5 escolas por potencial financeiro
    supabase
      .from('escolas_resumo')
      .select('id, nome, cidade, estado, potencial_financeiro, total_alunos, classificacao_atual')
      .eq('ativa', true)
      .order('potencial_financeiro', { ascending: false })
      .limit(5),

    // 10. Distribuição por classificação (registros mais recentes por escola)
    supabase
      .from('registros')
      .select('classificacao'),

    // 11. Registros por mês (últimos 6 meses) — data_contato >= 6 meses atrás
    supabase
      .from('registros')
      .select('data_contato, potencial_financeiro')
      .gte('data_contato', sesMesesAtras)
      .order('data_contato', { ascending: true }),

    // 12. Pipeline por stage — negociações ativas
    supabase
      .from('negociacoes')
      .select('stage, valor_estimado')
      .eq('ativa', true),

    // 13. Registros recentes (últimas 8 interações)
    supabase
      .from('registros')
      .select('*, escola:escolas(id, nome), responsavel:profiles!responsavel_id(id, full_name)')
      .order('data_contato', { ascending: false })
      .order('created_at',   { ascending: false })
      .limit(8),

    // 14. Detalhes das tarefas vencidas (top 5)
    supabase
      .from('tarefas')
      .select('*, escola:escolas(id, nome)')
      .eq('status', 'pendente')
      .lt('vencimento', hoje)
      .order('vencimento', { ascending: true })
      .limit(5),

    // 15. Escolas sem contato recente (ordenadas por updated_at mais antigo)
    supabase
      .from('escolas')
      .select('id, nome, cidade, estado, updated_at')
      .eq('ativa', true)
      .order('updated_at', { ascending: true })
      .limit(6),
  ])

  // ── Processar potencial total ──────────────────────────────────────────────
  const potencialTotal = (potencialTotalRes.data ?? []).reduce(
    (acc: number, e: { potencial_financeiro: number | null }) => acc + (e.potencial_financeiro ?? 0),
    0
  )

  // ── Processar top 5 escolas ────────────────────────────────────────────────
  const top5EscolasPotencial: Top5Escola[] = (top5EscolasRes.data ?? []).map((e: any) => ({
    id: e.id,
    nome: e.nome,
    cidade: e.cidade ?? null,
    estado: e.estado ?? null,
    potencial_financeiro: e.potencial_financeiro ?? 0,
    total_alunos: e.total_alunos ?? 0,
    classificacao_atual: e.classificacao_atual ?? null,
  }))

  // ── Processar distribuição por classificação ───────────────────────────────
  const allRegistros = classificacaoDistRes.data ?? []
  const totalRegistros = allRegistros.length

  const contagens: Record<string, number> = { quente: 0, morno: 0, frio: 0 }
  for (const r of allRegistros as { classificacao: string }[]) {
    if (r.classificacao in contagens) contagens[r.classificacao]++
  }

  const distribuicaoClassificacao: DistribuicaoClassificacao[] = (
    ['quente', 'morno', 'frio'] as ClassificacaoLead[]
  ).map(cls => ({
    classificacao: cls,
    quantidade: contagens[cls],
    percentual: totalRegistros > 0 ? Math.round((contagens[cls] / totalRegistros) * 100) : 0,
  }))

  // ── Processar registros por mês (últimos 6 meses) ─────────────────────────
  const mesesMap = new Map<string, { quantidade: number; somaPotenicial: number }>()

  // Pré-popula os 6 últimos meses para garantir todos apareçam (mesmo com 0)
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    mesesMap.set(key, { quantidade: 0, somaPotenicial: 0 })
  }

  for (const r of (registrosPorMesRes.data ?? []) as { data_contato: string; potencial_financeiro: number | null }[]) {
    const key = r.data_contato.substring(0, 7) // 'YYYY-MM'
    if (mesesMap.has(key)) {
      const entry = mesesMap.get(key)!
      entry.quantidade++
      entry.somaPotenicial += r.potencial_financeiro ?? 0
    }
  }

  const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const registrosPorMes: RegistrosMes[] = Array.from(mesesMap.entries()).map(([mes, v]) => {
    const [ano, mesNum] = mes.split('-')
    const label = `${MESES_PT[parseInt(mesNum) - 1]}/${ano.slice(2)}`
    return {
      mes,
      label,
      quantidade: v.quantidade,
      potencial_medio: v.quantidade > 0 ? Math.round(v.somaPotenicial / v.quantidade) : 0,
    }
  })

  // ── Processar pipeline por stage ──────────────────────────────────────────
  const STAGE_LABELS: Record<StageNegociacao, string> = {
    prospeccao:   'Prospecção',
    qualificacao: 'Qualificação',
    apresentacao: 'Apresentação',
    proposta:     'Proposta Enviada',
    negociacao:   'Em Negociação',
    fechamento:   'Fechamento',
    ganho:        'Ganho',
    perdido:      'Perdido',
  }

  const stageMap = new Map<string, { quantidade: number; valor: number }>()
  for (const n of (pipelineStagesRes.data ?? []) as { stage: string; valor_estimado: number | null }[]) {
    const entry = stageMap.get(n.stage) ?? { quantidade: 0, valor: 0 }
    entry.quantidade++
    entry.valor += n.valor_estimado ?? 0
    stageMap.set(n.stage, entry)
  }

  const pipelinePorStage: PipelineStage[] = (
    ['prospeccao', 'qualificacao', 'apresentacao', 'proposta', 'negociacao', 'fechamento'] as StageNegociacao[]
  ).map(stage => ({
    stage,
    label: STAGE_LABELS[stage],
    quantidade: stageMap.get(stage)?.quantidade ?? 0,
    valor_estimado_total: stageMap.get(stage)?.valor ?? 0,
  })).filter(s => s.quantidade > 0)

  // ── Montar resultado final ────────────────────────────────────────────────
  return {
    totalEscolas:        totalEscolasRes.count ?? 0,
    leadsQuentes:        leadsQuentesRes.count ?? 0,
    leadsMornos:         leadsMornosRes.count  ?? 0,
    leadsFrios:          leadsFriosRes.count   ?? 0,
    registros30Dias:     registros30DiasRes.count ?? 0,
    potencialTotal,
    contratosFechados:   contratosFechadosRes.count ?? 0,
    tarefasVencidas:     tarefasVencidasCountRes.count ?? 0,
    top5EscolasPotencial,
    distribuicaoClassificacao,
    registrosPorMes,
    pipelinePorStage,
    registrosRecentes:        (registrosRecentesRes.data ?? []) as RegistroComEscola[],
    tarefasVencidasDetalhes:  (tarefasVencidasDetalheRes.data ?? []) as TarefaComEscola[],
    escolasSemContatoRecente: (escolasSemContatoRes.data ?? []) as EscolaSemContato[],
  }
}
