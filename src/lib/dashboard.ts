/**
 * dashboard.ts — agregação para o Dashboard Comercial (/comercial). Fonte
 * única: getFunilContratacao() (reunioes/propostas/minutas/contratos por
 * escola, já testado em metas/page.tsx e funil-contratacao/page.tsx) mais
 * duas buscas leves extras (registros com meio_contato para o canal de
 * contato, e form_precadastro_wemake cruzado contra propostas para a taxa de
 * conversão de formulário). Nenhum número aqui é constante manual — tudo é
 * calculado a partir do estado atual do banco a cada requisição
 * (export const dynamic = 'force-dynamic' na página).
 */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarNomeEscola, diasDesdeData } from '@/lib/utils'
import { getFunilContratacao, FASE_FUNIL_ORDEM, FASE_LABELS, type EscolaFunil, type FaseFunil, type Quadrante } from '@/lib/funil-contratacao'
import { LABEL, ORIGEM_OPTIONS } from '@/types/database'
import type { FunilVisualEstagio } from '@/components/comercial/FunilVisual'

// Uma proposta enviada sem nenhum contato novo registrado há mais desse
// número de dias entra em "Propostas Paradas" — mesmo diagnóstico que a
// reunião de 25/08 levantou manualmente ("18 escolas sem retorno"), agora
// como regra viva sobre os dados reais (o número resultante pode divergir do
// que foi citado na reunião, e está correto fazer isso).
const DIAS_PARADA = 15

// Janela de "vencendo em breve" para o alerta de urgência de validade.
const DIAS_URGENCIA_VALIDADE = 15

const UF_REGIAO: Record<string, string> = {
  SP: 'Sudeste', RJ: 'Sudeste', MG: 'Sudeste', ES: 'Sudeste',
  PR: 'Sul', SC: 'Sul', RS: 'Sul',
  GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste', DF: 'Centro-Oeste',
  BA: 'Nordeste', PE: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste',
  RN: 'Nordeste', AL: 'Nordeste', SE: 'Nordeste', PI: 'Nordeste',
  PA: 'Norte', AM: 'Norte', RO: 'Norte', RR: 'Norte', AC: 'Norte', AP: 'Norte', TO: 'Norte',
}

export interface DashboardFiltros {
  estado?: string
  cidade?: string
  bairro?: string
  fase?: FaseFunil
  periodo?: '30d'
}

function valorPotencial(l: EscolaFunil): number {
  if (l.contrato_assinado) return l.contrato_valor_total
  if (l.proposta_valor_aluno_ano && l.alunos_proposta) return l.proposta_valor_aluno_ano * l.alunos_proposta
  return l.negociacao_valor_estimado ?? 0
}

function bucketPorte(alunos: number): 'Pequena (até 150)' | 'Média (150 a 400)' | 'Grande (400+)' {
  if (alunos < 150) return 'Pequena (até 150)'
  if (alunos < 400) return 'Média (150 a 400)'
  return 'Grande (400+)'
}

export interface DashboardData {
  filtrosDisponiveis: {
    estados: { uf: string; count: number }[]
    cidades: { key: string; label: string; count: number }[]
    bairros: { key: string; label: string; count: number }[]
  }
  kpis: {
    reunioesUnicas: number
    propostasEnviadas: number
    minutasEnviadas: number
    contratosAssinados: number
    alunosPipeline: number
    ticketMedioPipeline: number
    pipelineValor: number
    taxaConversaoContrato: number // contratos assinados / propostas enviadas, ao vivo
  }
  funilEstagios: FunilVisualEstagio[]
  porEstadoMapa: Record<string, number>
  regional: { regiao: string; qtd: number; alunos: number; ticket: number }[]
  porEstado: { uf: string; qtd: number; alunos: number; ticket: number }[]
  porPorte: { bucket: string; qtd: number; ticket: number }[]
  rankingPorte: { escola_nome: string; alunos: number; estado: string | null }[]
  rankingValor: { escola_nome: string; valor: number; estado: string | null }[]
  perfilPedagogico: { label: string; count: number }[]
  segmentos: { label: string; count: number }[]
  origemLead: { label: string; count: number }[]
  meioContato: { label: string; count: number }[]
  propostasParadas: { escola_nome: string; estado: string | null; dias: number | null }[]
  urgencia: { escola_nome: string; estado: string | null; diasValidade: number }[]
  matrizQuadrante: { escola_nome: string; quadrante: Quadrante }[]
  formularios: {
    total: number
    convertidos: number
    pendentes: { nome: string; cidade: string | null; estado: string | null; dataFormulario: string; dias: number | null }[]
  }
}

export async function getDashboardData(filtros: DashboardFiltros): Promise<DashboardData> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const [funil, registrosRes, formulariosRes, escolasCnpjRes, propostasNomeRes] = await Promise.all([
    getFunilContratacao(),
    admin.from('registros').select('escola_id, meio_contato, data_contato'),
    admin.from('form_precadastro_wemake')
      .select('nome_fantasia, razao_social, cnpj, cidade, estado, created_at')
      .neq('status', 'descartado')
      .order('created_at', { ascending: false }),
    admin.from('escolas').select('id, nome, cnpj'),
    admin.from('propostas').select('escola_id, escola_nome'),
  ])

  const registros = (registrosRes.data ?? []) as { escola_id: string; meio_contato: string; data_contato: string }[]
  const formularios = (formulariosRes.data ?? []) as { nome_fantasia: string; razao_social: string | null; cnpj: string | null; cidade: string | null; estado: string | null; created_at: string }[]
  const escolasCnpj = (escolasCnpjRes.data ?? []) as { id: string; nome: string; cnpj: string | null }[]
  const propostasNome = (propostasNomeRes.data ?? []) as { escola_id: string | null; escola_nome: string | null }[]

  // ── Filtro geográfico / fase / período sobre as linhas do funil ──────────
  const cidadeKey = normalizarNomeEscola(filtros.cidade)
  const bairroKey = normalizarNomeEscola(filtros.bairro)
  const agora = Date.now()
  const JANELA_30D = 30 * 86_400_000

  const linhasFiltradas = funil.linhas.filter(l => {
    if (filtros.estado && l.estado !== filtros.estado) return false
    if (cidadeKey && normalizarNomeEscola(l.cidade) !== cidadeKey) return false
    if (bairroKey && normalizarNomeEscola(l.bairro) !== bairroKey) return false
    if (filtros.fase && l.fase_funil !== filtros.fase) return false
    return true
  })
  const idsFiltrados = new Set(linhasFiltradas.map(l => l.escola_id))

  // ── Filtros disponíveis (cascata Estado → Cidade → Bairro) ────────────────
  const porEstadoTodos = new Map<string, number>()
  for (const l of funil.linhas) porEstadoTodos.set(l.estado ?? 'N/I', (porEstadoTodos.get(l.estado ?? 'N/I') ?? 0) + 1)
  const estados = [...porEstadoTodos.entries()].map(([uf, count]) => ({ uf, count })).sort((a, b) => b.count - a.count)

  const linhasPorEstado = filtros.estado ? funil.linhas.filter(l => l.estado === filtros.estado) : funil.linhas
  const porCidade = new Map<string, { label: string; count: number }>()
  for (const l of linhasPorEstado) {
    if (!l.cidade) continue
    const key = normalizarNomeEscola(l.cidade)
    const atual = porCidade.get(key) ?? { label: l.cidade, count: 0 }
    atual.count++
    porCidade.set(key, atual)
  }
  const cidades = [...porCidade.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.count - a.count)

  const linhasPorCidade = cidadeKey ? linhasPorEstado.filter(l => normalizarNomeEscola(l.cidade) === cidadeKey) : linhasPorEstado
  const porBairro = new Map<string, { label: string; count: number }>()
  for (const l of linhasPorCidade) {
    if (!l.bairro) continue
    const key = normalizarNomeEscola(l.bairro)
    const atual = porBairro.get(key) ?? { label: l.bairro, count: 0 }
    atual.count++
    porBairro.set(key, atual)
  }
  const bairros = [...porBairro.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.count - a.count)

  // ── KPIs ───────────────────────────────────────────────────────────────
  const propostasComValor = linhasFiltradas.filter(l => l.proposta_id && l.proposta_valor_aluno_ano)
  const propostasEnviadas = linhasFiltradas.filter(l => l.proposta_id !== null).length
  const contratosAssinados = linhasFiltradas.filter(l => l.contrato_assinado).length

  const kpis = {
    reunioesUnicas: linhasFiltradas.filter(l => l.reunioes_total > 0).length,
    propostasEnviadas,
    minutasEnviadas: linhasFiltradas.filter(l => l.minuta_enviada).length,
    contratosAssinados,
    alunosPipeline: linhasFiltradas.reduce((s, l) => s + (l.alunos_proposta ?? 0), 0),
    ticketMedioPipeline: propostasComValor.length > 0
      ? Math.round(propostasComValor.reduce((s, l) => s + (l.proposta_valor_aluno_ano ?? 0), 0) / propostasComValor.length)
      : 0,
    pipelineValor: linhasFiltradas.reduce((s, l) => s + valorPotencial(l), 0),
    taxaConversaoContrato: propostasEnviadas > 0 ? Math.round((contratosAssinados / propostasEnviadas) * 100) : 0,
  }

  // ── Funil completo (cumulativo, mesma convenção de FunilVisual) ──────────
  const FASE_ORDER_IDX = new Map(FASE_FUNIL_ORDEM.map((f, i) => [f, i]))
  const funilEstagios: FunilVisualEstagio[] = FASE_FUNIL_ORDEM.map(fase => {
    const nestaOuAlem = linhasFiltradas.filter(l => (FASE_ORDER_IDX.get(l.fase_funil) ?? 0) >= (FASE_ORDER_IDX.get(fase) ?? 0))
    return {
      fase,
      label: FASE_LABELS[fase],
      total: nestaOuAlem.length,
      quente: nestaOuAlem.filter(l => l.lead_temperatura === 'quente').length,
      morno: nestaOuAlem.filter(l => l.lead_temperatura === 'morno').length,
      frio: nestaOuAlem.filter(l => l.lead_temperatura === 'frio').length,
    }
  })

  // ── Geografia ──────────────────────────────────────────────────────────
  const porEstadoMapa: Record<string, number> = {}
  for (const l of linhasFiltradas) {
    if (!l.estado) continue
    porEstadoMapa[l.estado] = (porEstadoMapa[l.estado] ?? 0) + 1
  }

  const regiaoAgg = new Map<string, { qtd: number; alunos: number; somaTicket: number; nTicket: number }>()
  const estadoAgg = new Map<string, { qtd: number; alunos: number; somaTicket: number; nTicket: number }>()
  for (const l of linhasFiltradas) {
    const uf = l.estado ?? 'N/I'
    const reg = UF_REGIAO[uf] ?? 'Não informado'
    const temTicket = l.proposta_valor_aluno_ano != null
    for (const [map, key] of [[regiaoAgg, reg], [estadoAgg, uf]] as const) {
      const atual = map.get(key) ?? { qtd: 0, alunos: 0, somaTicket: 0, nTicket: 0 }
      atual.qtd++
      atual.alunos += l.alunos_proposta ?? 0
      if (temTicket) { atual.somaTicket += l.proposta_valor_aluno_ano!; atual.nTicket++ }
      map.set(key, atual)
    }
  }
  const regional = [...regiaoAgg.entries()]
    .map(([regiao, v]) => ({ regiao, qtd: v.qtd, alunos: v.alunos, ticket: v.nTicket ? Math.round(v.somaTicket / v.nTicket) : 0 }))
    .sort((a, b) => b.qtd - a.qtd)
  const porEstado = [...estadoAgg.entries()]
    .map(([uf, v]) => ({ uf, qtd: v.qtd, alunos: v.alunos, ticket: v.nTicket ? Math.round(v.somaTicket / v.nTicket) : 0 }))
    .sort((a, b) => b.qtd - a.qtd)

  // ── Porte ──────────────────────────────────────────────────────────────
  const porteAgg = new Map<string, { qtd: number; somaTicket: number; nTicket: number }>()
  for (const l of linhasFiltradas) {
    const b = bucketPorte(l.alunos_cadastro)
    const atual = porteAgg.get(b) ?? { qtd: 0, somaTicket: 0, nTicket: 0 }
    atual.qtd++
    if (l.proposta_valor_aluno_ano != null) { atual.somaTicket += l.proposta_valor_aluno_ano; atual.nTicket++ }
    porteAgg.set(b, atual)
  }
  const porPorte = ['Pequena (até 150)', 'Média (150 a 400)', 'Grande (400+)']
    .map(bucket => {
      const v = porteAgg.get(bucket) ?? { qtd: 0, somaTicket: 0, nTicket: 0 }
      return { bucket, qtd: v.qtd, ticket: v.nTicket ? Math.round(v.somaTicket / v.nTicket) : 0 }
    })

  const rankingPorte = [...linhasFiltradas]
    .sort((a, b) => b.alunos_cadastro - a.alunos_cadastro)
    .slice(0, 10)
    .map(l => ({ escola_nome: l.escola_nome, alunos: l.alunos_cadastro, estado: l.estado }))

  const rankingValor = [...linhasFiltradas]
    .map(l => ({ escola_nome: l.escola_nome, valor: valorPotencial(l), estado: l.estado }))
    .filter(r => r.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)

  // ── Distribuições ──────────────────────────────────────────────────────
  const perfilAgg = new Map<string, number>()
  for (const l of linhasFiltradas) {
    const label = l.perfil_pedagogico ? (LABEL.perfil_pedagogico[l.perfil_pedagogico] ?? l.perfil_pedagogico) : 'Não informado'
    perfilAgg.set(label, (perfilAgg.get(label) ?? 0) + 1)
  }
  const perfilPedagogico = [...perfilAgg.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  const segAgg = new Map<string, number>()
  for (const l of linhasFiltradas) for (const s of l.segmentos_ativos) segAgg.set(s, (segAgg.get(s) ?? 0) + 1)
  const segmentos = ['Infantil', 'Fund. I', 'Fund. II', 'Médio'].map(label => ({ label, count: segAgg.get(label) ?? 0 }))

  const origemLabel = Object.fromEntries(ORIGEM_OPTIONS.map(o => [o.value, o.label]))
  const origemAgg = new Map<string, number>()
  for (const l of linhasFiltradas) {
    const label = l.origem_lead ? (origemLabel[l.origem_lead] ?? l.origem_lead) : 'Não informado'
    origemAgg.set(label, (origemAgg.get(label) ?? 0) + 1)
  }
  const origemLead = [...origemAgg.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  // Canal de contato vem de registros (dado por-interação real, não por-escola) — restrito às
  // escolas do recorte atual e, quando o filtro de período está ativo, à janela de 30 dias.
  const registrosFiltrados = registros.filter(r => {
    if (!idsFiltrados.has(r.escola_id)) return false
    if (filtros.periodo === '30d' && agora - new Date(r.data_contato).getTime() > JANELA_30D) return false
    return true
  })
  const meioLabel = LABEL.meio_contato
  const meioAgg = new Map<string, number>()
  for (const r of registrosFiltrados) {
    const label = meioLabel[r.meio_contato] ?? r.meio_contato
    meioAgg.set(label, (meioAgg.get(label) ?? 0) + 1)
  }
  const meioContato = [...meioAgg.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  // Quando o período está filtrado, "reuniões" passa a refletir só a janela
  // (contagem de escolas distintas com registro nos últimos 30 dias) em vez
  // do total histórico calculado acima.
  if (filtros.periodo === '30d') {
    kpis.reunioesUnicas = new Set(registrosFiltrados.map(r => r.escola_id)).size
  }

  // ── Propostas paradas (proposta enviada, sem avanço, sem contato recente) ─
  const propostasParadas = linhasFiltradas
    .filter(l => l.fase_funil === 'proposta_enviada')
    .map(l => ({ escola_nome: l.escola_nome, estado: l.estado, dias: diasDesdeData(l.ultima_interacao) }))
    .filter(l => l.dias === null || l.dias > DIAS_PARADA)
    .sort((a, b) => (b.dias ?? 9999) - (a.dias ?? 9999))

  // ── Urgência de validade ──────────────────────────────────────────────
  const hojeStr = new Date().toISOString().slice(0, 10)
  const urgencia = linhasFiltradas
    .filter(l => l.proposta_id && l.proposta_validade)
    .map(l => {
      const diasValidade = Math.round((new Date(l.proposta_validade! + 'T00:00:00').getTime() - new Date(hojeStr + 'T00:00:00').getTime()) / 86_400_000)
      return { escola_nome: l.escola_nome, estado: l.estado, diasValidade }
    })
    .filter(l => l.diasValidade <= DIAS_URGENCIA_VALIDADE)
    .sort((a, b) => a.diasValidade - b.diasValidade)

  // ── Matriz Fit × Engajamento ───────────────────────────────────────────
  const matrizQuadrante = linhasFiltradas.map(l => ({ escola_nome: l.escola_nome, quadrante: l.quadrante }))

  // ── Formulários × Conversão em Proposta ────────────────────────────────
  const cnpjParaEscolaId = new Map<string, string>()
  for (const e of escolasCnpj) if (e.cnpj) cnpjParaEscolaId.set(e.cnpj.replace(/\D/g, ''), e.id)
  const nomeParaEscolaId = new Map<string, string>()
  for (const e of escolasCnpj) nomeParaEscolaId.set(normalizarNomeEscola(e.nome), e.id)

  const escolaIdsComProposta = new Set<string>()
  const nomesComProposta = new Set<string>()
  for (const p of propostasNome) {
    if (p.escola_id) escolaIdsComProposta.add(p.escola_id)
    else if (p.escola_nome) nomesComProposta.add(normalizarNomeEscola(p.escola_nome))
  }

  let formsConvertidos = 0
  const formsPendentes: DashboardData['formularios']['pendentes'] = []
  for (const f of formularios) {
    const cnpjNorm = f.cnpj?.replace(/\D/g, '')
    const escolaId = cnpjNorm ? cnpjParaEscolaId.get(cnpjNorm) : undefined
    const nomeKey = normalizarNomeEscola(f.nome_fantasia)
    const razaoKey = normalizarNomeEscola(f.razao_social)
    const escolaIdPorNome = nomeParaEscolaId.get(nomeKey) ?? nomeParaEscolaId.get(razaoKey)

    const convertido =
      (escolaId != null && escolaIdsComProposta.has(escolaId)) ||
      (escolaIdPorNome != null && escolaIdsComProposta.has(escolaIdPorNome)) ||
      nomesComProposta.has(nomeKey) || nomesComProposta.has(razaoKey)

    if (convertido) {
      formsConvertidos++
    } else {
      formsPendentes.push({
        nome: f.nome_fantasia.trim(),
        cidade: f.cidade,
        estado: f.estado,
        dataFormulario: f.created_at,
        dias: diasDesdeData(f.created_at),
      })
    }
  }
  formsPendentes.sort((a, b) => (b.dias ?? 0) - (a.dias ?? 0))

  return {
    filtrosDisponiveis: { estados, cidades, bairros },
    kpis,
    funilEstagios,
    porEstadoMapa,
    regional,
    porEstado,
    porPorte,
    rankingPorte,
    rankingValor,
    perfilPedagogico,
    segmentos,
    origemLead,
    meioContato,
    propostasParadas,
    urgencia,
    matrizQuadrante,
    formularios: {
      total: formularios.length,
      convertidos: formsConvertidos,
      pendentes: formsPendentes,
    },
  }
}
