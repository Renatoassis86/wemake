import { MARCOS } from '@/lib/academia'

/* ═══════════════════ Listas oficiais (aba "Listas" do Painel Mestre) ═══════════════════ */

export const STATUS = ['Não iniciado', 'Em andamento', 'Aguardando escola', 'Aguardando We Make', 'Concluído', 'Bloqueado'] as const
export const RISCOS = ['Baixo', 'Médio', 'Alto', 'Crítico'] as const
export const PRIORIDADES = ['Normal', 'Alta', 'Crítica'] as const

export type Status = (typeof STATUS)[number]
export type Risco = (typeof RISCOS)[number]
export type Prioridade = (typeof PRIORIDADES)[number]
export type MarcoNome = (typeof MARCOS)[number]

/** Quando usar cada status (aba "Como usar"). */
export const STATUS_AJUDA: Record<Status, string> = {
  'Não iniciado': 'A etapa ainda não começou.',
  'Em andamento': 'A equipe está executando a etapa.',
  'Aguardando escola': 'A We Make depende de uma ação, informação, compra ou aprovação da escola.',
  'Aguardando We Make': 'A escola já entregou o necessário e a próxima ação é interna.',
  'Concluído': 'A etapa terminou e o seu gate foi atendido.',
  'Bloqueado': 'Existe um impedimento que impede o avanço da implantação.',
}

export const RISCO_AJUDA: Record<Risco, string> = {
  Baixo: 'A implantação segue dentro do fluxo esperado. Acompanhamento normal.',
  Médio: 'Existe pendência, mas sem ameaça imediata ao cronograma. Monitorar e definir prazo.',
  Alto: 'Há risco real de atraso, perda de qualidade ou impacto no Go-Live. Escalar internamente e criar ação de correção.',
  Crítico: 'O início ou a continuidade da implantação está seriamente comprometido. Intervenção imediata da liderança.',
}

/* ═══════════════════════════════════ Tipos ═══════════════════════════════════ */

export interface Implantacao {
  id: string
  escola_id: string | null
  escola_nome: string
  cidade_uf: string | null
  responsavel: string | null
  prioridade: Prioridade
  marcos: Record<string, Status>
  /** etapas cujo status o gestor definiu à mão (não seguem mais o cálculo pelas tarefas) */
  marcos_manuais?: Record<string, boolean>
  proxima_acao: string | null
  responsavel_acao: string | null
  prazo: string | null
  risco: Risco
  motivo_bloqueio: string | null
  data_assinatura: string | null
  data_onboarding: string | null
  data_inicio_aulas: string | null
  arquivada: boolean
  updated_at: string
}

export interface Tarefa {
  id: string
  implantacao_id: string | null
  lista: string
  marco: number | null
  titulo: string
  descricao: string | null
  status: Status
  prioridade: Prioridade
  responsavel: string | null
  prazo: string | null
  ordem: number
}

export interface Evento {
  id: string
  implantacao_id: string | null
  titulo: string
  tipo: string
  inicio: string
  fim: string | null
  local: string | null
  responsavel: string | null
  notas: string | null
}

export const TIPOS_EVENTO = ['Reunião', 'Formação', 'Onboarding', 'Kickoff', 'Visita', 'Rito de governança', 'Outro'] as const

/* ═══════════════════════════ Cálculos do Painel Mestre ═══════════════════════════ */

export const hojeISO = () => new Date().toISOString().slice(0, 10)

/** % Implantação: etapas concluídas ÷ 9 (não se preenche à mão). */
export function percentual(i: Pick<Implantacao, 'marcos'>) {
  const done = MARCOS.filter(m => i.marcos?.[m] === 'Concluído').length
  return done / MARCOS.length
}

export function marcoAtual(i: Pick<Implantacao, 'marcos'>): MarcoNome | null {
  return MARCOS.find(m => i.marcos?.[m] !== 'Concluído') ?? null
}

export function prazoVencido(i: Pick<Implantacao, 'prazo' | 'marcos'>) {
  return !!i.prazo && i.prazo < hojeISO() && percentual(i) < 1
}

/** Quantas tarefas abertas e vencidas cada escola tem. */
export function tarefasVencidas(tarefas: Pick<Tarefa, 'implantacao_id' | 'prazo' | 'status'>[]) {
  const hoje = hojeISO()
  const porEscola = new Map<string, number>()
  for (const t of tarefas) {
    if (t.implantacao_id && t.prazo && t.prazo < hoje && t.status !== 'Concluído') {
      porEscola.set(t.implantacao_id, (porEscola.get(t.implantacao_id) ?? 0) + 1)
    }
  }
  return porEscola
}

export function temBloqueio(i: Pick<Implantacao, 'marcos'>) {
  return MARCOS.some(m => i.marcos?.[m] === 'Bloqueado')
}

/** Regra da planilha: motivo/bloqueio é obrigatório se risco Alto/Crítico ou alguma etapa Bloqueada. */
export function exigeMotivo(i: Pick<Implantacao, 'risco' | 'marcos'>) {
  return i.risco === 'Alto' || i.risco === 'Crítico' || temBloqueio(i)
}

export function exigeAtencao(i: Implantacao) {
  return i.risco === 'Alto' || i.risco === 'Crítico' || temBloqueio(i) || prazoVencido(i)
}

export function resumo(impls: Implantacao[], tarefas: Pick<Tarefa, 'implantacao_id' | 'prazo' | 'status'>[] = []) {
  const ativas = impls.filter(i => !i.arquivada)
  const comTarefaVencida = tarefasVencidas(tarefas)
  const porEtapa = MARCOS.map(m => {
    const concluidas = ativas.filter(i => i.marcos?.[m] === 'Concluído').length
    return { nome: m, concluidas, total: ativas.length, pct: ativas.length ? concluidas / ativas.length : 0 }
  })
  const porRisco = RISCOS.map(r => {
    const n = ativas.filter(i => i.risco === r).length
    return { risco: r, escolas: n, pct: ativas.length ? n / ativas.length : 0 }
  })
  return {
    escolas: ativas.length,
    goLive: ativas.filter(i => i.marcos?.['Go-Live'] === 'Concluído').length,
    riscoAlto: ativas.filter(i => i.risco === 'Alto' || i.risco === 'Crítico').length,
    // prazo da escola vencido OU tarefa aberta e vencida
    vencidos: ativas.filter(i => prazoVencido(i) || comTarefaVencida.has(i.id)).length,
    porEtapa,
    porRisco,
    atencao: ativas.filter(i => exigeAtencao(i) || comTarefaVencida.has(i.id)),
  }
}

/* ═══════════════════════════════════ Datas ═══════════════════════════════════ */

export function addDias(iso: string, dias: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Soma dias úteis (sem sábados e domingos; feriados não são considerados). */
export function addDiasUteis(iso: string, dias: number) {
  const d = new Date(iso + 'T12:00:00')
  const passo = dias < 0 ? -1 : 1
  let falta = Math.abs(dias)
  while (falta > 0) {
    d.setDate(d.getDate() + passo)
    const w = d.getDay()
    if (w !== 0 && w !== 6) falta--
  }
  return d.toISOString().slice(0, 10)
}

export function fmtData(iso: string | null | undefined) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}
