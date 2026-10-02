import documentoNormativo from '@/content/academia/documento-normativo.json'
import arquitetura from '@/content/academia/arquitetura-de-processos.json'
import manualOperacional from '@/content/academia/manual-operacional.json'
import handoff from '@/content/academia/handoff.json'
import procedimentoDiagnostico from '@/content/academia/procedimento-diagnostico.json'
import planilhaDiagnostico from '@/content/academia/planilha-diagnostico.json'
import registroAtivacao from '@/content/academia/registro-ativacao-comercial.json'
import manualFormador from '@/content/academia/manual-do-formador.json'
import materialMultiplicador from '@/content/academia/material-do-multiplicador.json'
import checklistPreOnboarding from '@/content/academia/checklist-pre-onboarding.json'
import processoOnboarding from '@/content/academia/processo-de-onboarding-2026.json'
import relatorioOnboarding from '@/content/academia/relatorio-onboarding.json'
import fichaGoLive from '@/content/academia/ficha-go-live.json'
import painelMestre from '@/content/academia/painel-mestre.json'

/* ─────────────────────────── Tipos do conteúdo ─────────────────────────── */

export interface Cell { b: Block[]; s?: number }
export type Block =
  | { t: 'sec'; x: string; n?: string; k?: string }
  | { t: 'sub'; x: string; n?: string; k?: string }
  | { t: 'minor'; x: string }
  | { t: 'p'; x: string; cls?: 'lead' | 'quote' | 'cite' | 'meta'; cite?: string }
  | { t: 'li'; x: string }
  | { t: 'check'; x: string }
  | { t: 'field'; x: string }
  | { t: 'lines' }
  | { t: 'img'; src: string }
  | { t: 'callout'; label: string; body: Block[] }
  | { t: 'table'; rows: Cell[][]; hdr?: boolean; kind?: string }

export interface DocContent {
  slug: string
  source: string
  lead?: string[]
  kicker?: string
  subtitle?: string
  titleText?: string
  trio?: { k: string; v: string }[]
  blocks: Block[]
}

/* ───────────────────────────── Jornada ─────────────────────────────────── */

/** Os nove marcos do Painel Mestre (Ecologia Formativa desdobrada em três). */
export const MARCOS = [
  'Handoff',
  'Diagnóstico',
  'Arquitetura',
  'Recursos',
  'Ativação Comercial',
  'Pré-Onboarding',
  'Onboarding',
  'Go-Live',
  'Transição para Academia',
] as const

/** As sete macroetapas do Manual Operacional. */
export const MACROETAPAS = [
  { n: 1, nome: 'Handoff Comercial', marcos: [0], gate: 'Ficha revisada pelo Comercial e aceita pela Implantação.' },
  { n: 2, nome: 'Ecologia Formativa', marcos: [1, 2, 3], gate: 'Diagnóstico, adequações e lista de recursos definidos.' },
  { n: 3, nome: 'Ativação Comercial', marcos: [4], gate: 'Equipe da escola apta a apresentar a proposta.' },
  { n: 4, nome: 'Pré-Onboarding', marcos: [5], gate: 'Pré-Onboarding validado → formação confirmada.' },
  { n: 5, nome: 'Onboarding Pedagógico', marcos: [6], gate: 'Onboarding concluído → escola avança para o Go-Live.' },
  { n: 6, nome: 'Go-Live', marcos: [7], gate: 'Go-Live liberado → escola entra em operação.' },
  { n: 7, nome: 'Transição para a Academia', marcos: [8], gate: 'Responsável, cadência e pontos de atenção registrados.' },
] as const

export type Grupo = 'Fundamentos' | 'Jornada de implantação' | 'Controle'

export interface AcademiaDoc {
  slug: string
  n: number
  grupo: Grupo
  /** macroetapa (1–7) à qual o documento pertence; 0 = transversal */
  etapa: number
  /** marcos do painel (índices de MARCOS) que o documento sustenta */
  marcos: number[]
  tipo: string
  kicker: string
  title: string
  short: string
  deck: string
  facts: { k: string; v: string }[]
  content: DocContent
  /** quem forneceu o documento */
  origem: 'denis' | 'complementar'
  /** numeração oficial dada por Dênis (1 a 8, 3.1) */
  oficialNo?: string
  /** arquivo oficial de onde o texto foi tirado */
  fonte: string
}

type BaseDoc = Omit<AcademiaDoc, 'origem' | 'oficialNo' | 'fonte'>

const c = (x: unknown) => x as DocContent

const BASE_DOCS: BaseDoc[] = [
  {
    slug: 'documento-normativo', n: 1, grupo: 'Fundamentos', etapa: 0, marcos: [],
    tipo: 'Documento normativo', kicker: 'Documento normativo',
    title: 'Academia We Make', short: 'Documento Normativo',
    deck: 'Modelo de negócio, fases e ciclo de funcionamento da trilha de formação, mentoria e consultoria pedagógica do sistema We Make.',
    facts: [
      { k: 'Elaborado por', v: 'Direção estratégica da empresa' },
      { k: 'Estrutura', v: '12 capítulos' },
      { k: 'Ciclos', v: '8 fases na frente escolar · 4 fases na frente de famílias educadoras' },
      { k: 'Revisão', v: 'Anual' },
    ],
    content: c(documentoNormativo),
  },
  {
    slug: 'arquitetura-de-processos', n: 2, grupo: 'Fundamentos', etapa: 0, marcos: [],
    tipo: 'Arquitetura de processos', kicker: 'Arquitetura de processos · 2027',
    title: 'Arquitetura de Processos', short: 'Arquitetura de Processos 2027',
    deck: 'Conhecer, Explorar e Criar como sistema de gestão da formação, do acompanhamento e dos braços de atuação da Academia.',
    facts: [
      { k: 'Data', v: 'Setembro de 2026' },
      { k: 'Uso', v: 'Interno' },
      { k: 'Estrutura', v: '19 seções · 7 braços de atuação' },
      { k: 'Leitura rápida', v: 'Seções 4, 15, 18 e 19' },
    ],
    content: c(arquitetura),
  },
  {
    slug: 'manual-operacional', n: 3, grupo: 'Jornada de implantação', etapa: 0, marcos: [],
    tipo: 'Manual operacional', kicker: 'Manual operacional de pós-venda · 2027',
    title: 'Jornada de Implantação e Sucesso da Escola Parceira', short: 'Manual Operacional de Implantação',
    deck: 'Do contrato à transição para a Academia We Make.',
    facts: [
      { k: 'Versão', v: '2.0' },
      { k: 'Data', v: 'Setembro de 2026' },
      { k: 'Uso', v: 'Interno' },
      { k: 'Estrutura', v: '7 macroetapas · 9 marcos no Painel Mestre' },
    ],
    content: c(manualOperacional),
  },
  {
    slug: 'handoff', n: 4, grupo: 'Jornada de implantação', etapa: 1, marcos: [0],
    tipo: 'Formulário', kicker: 'Macroetapa 1 de 7 · Handoff Comercial',
    title: 'Handoff Comercial → Implantação', short: 'Handoff Comercial',
    deck: 'Ficha padrão de passagem de bastão após fechamento do contrato.',
    facts: [], content: c(handoff),
  },
  {
    slug: 'procedimento-diagnostico', n: 5, grupo: 'Jornada de implantação', etapa: 2, marcos: [1, 2, 3],
    tipo: 'Procedimento oficial', kicker: 'Macroetapa 2 de 7 · Ecologia Formativa',
    title: 'Diagnóstico do Espaço Maker', short: 'Procedimento de Diagnóstico',
    deck: 'Etapas, responsabilidades, evidências e critérios para análise da infraestrutura e dos recursos da escola parceira.',
    facts: [
      { k: 'Documento', v: 'Oficial de referência · Implantação 2027 · Uso interno e escolas parceiras' },
      { k: 'Princípio', v: 'A escola informa → a We Make diagnostica → recomenda → a escola adequa → a We Make valida' },
      { k: 'Estrutura', v: '9 seções · 7 etapas do diagnóstico' },
    ],
    content: c(procedimentoDiagnostico),
  },
  {
    slug: 'planilha-diagnostico', n: 6, grupo: 'Jornada de implantação', etapa: 2, marcos: [1, 2, 3],
    tipo: 'Planilha', kicker: 'Macroetapa 2 de 7 · Ecologia Formativa',
    title: 'Planilha de Diagnóstico do Espaço Maker', short: 'Planilha de Diagnóstico',
    deck: 'Planilha para levantamento de informações pela escola e parecer técnico da We Make.',
    facts: [
      { k: 'Abas', v: 'Orientações · Sala e Evidências · Recursos Reutilizáveis · Recursos Consumíveis · Resumo We Make · Listas' },
      { k: 'A escola preenche', v: 'Medidas, evidências, quantidades e modelos' },
      { k: 'A We Make preenche', v: 'Parecer técnico, quantidade aproveitável e ação' },
    ],
    content: c(planilhaDiagnostico),
  },
  {
    slug: 'registro-ativacao-comercial', n: 7, grupo: 'Jornada de implantação', etapa: 3, marcos: [4],
    tipo: 'Formulário', kicker: 'Macroetapa 3 de 7 · Ativação Comercial',
    title: 'Registro de Ativação Comercial', short: 'Ativação Comercial',
    deck: 'Escola Parceira — We Make 2027.',
    facts: [], content: c(registroAtivacao),
  },
  {
    slug: 'manual-do-formador', n: 8, grupo: 'Jornada de implantação', etapa: 3, marcos: [4],
    tipo: 'Manual', kicker: 'Academia We Make · Trilha de ativação comercial',
    title: 'Manual do Formador', short: 'Manual do Formador',
    deck: 'Como formar equipes comerciais, de marketing, secretaria e coordenação para apresentar a We Make às famílias.',
    facts: [
      { k: 'Processo', v: 'Ativação Comercial junto ao time comercial da escola' },
      { k: 'Papel na trilha', v: 'Material do formador, que forma o multiplicador' },
      { k: 'Uso', v: 'Documento interno · equipe de formadores We Make' },
      { k: 'Data', v: 'Setembro de 2026' },
      { k: 'Prazo da trilha', v: 'Até 30 dias corridos após o Handoff' },
      { k: 'Estrutura', v: '15 partes · 5 encontros de formação' },
    ],
    content: c(manualFormador),
  },
  {
    slug: 'material-do-multiplicador', n: 9, grupo: 'Jornada de implantação', etapa: 3, marcos: [4],
    tipo: 'Material de apoio', kicker: 'Academia We Make · Trilha de ativação comercial',
    title: 'Material do Multiplicador', short: 'Material do Multiplicador',
    deck: 'Um guia para apresentar a We Make às famílias com clareza, segurança e verdade.',
    facts: [
      { k: 'Processo', v: 'Ativação Comercial junto ao time comercial da escola' },
      { k: 'Papel na trilha', v: 'Material do aluno: o multiplicador, equipe da escola formada pelo formador' },
      { k: 'Entregue a', v: 'Equipe formada pela Trilha de Ativação Comercial' },
      { k: 'Data', v: 'Setembro de 2026' },
      { k: 'Estrutura', v: '9 partes' },
    ],
    content: c(materialMultiplicador),
  },
  {
    slug: 'checklist-pre-onboarding', n: 10, grupo: 'Jornada de implantação', etapa: 4, marcos: [5],
    tipo: 'Formulário', kicker: 'Macroetapa 4 de 7 · Pré-Onboarding',
    title: 'Checklist Pré-Onboarding', short: 'Checklist Pré-Onboarding',
    deck: 'Validação de prontidão para realização do onboarding presencial.',
    facts: [], content: c(checklistPreOnboarding),
  },
  {
    slug: 'processo-de-onboarding-2026', n: 11, grupo: 'Jornada de implantação', etapa: 5, marcos: [6],
    tipo: 'Diretrizes', kicker: 'Macroetapa 5 de 7 · Onboarding Pedagógico',
    title: 'Processo de Onboarding', short: 'Processo de Onboarding',
    deck: 'Diretrizes, estrutura, carga horária e resultados esperados.',
    facts: [
      { k: 'Formato', v: '2 dias · 12 horas (cerca de 6 h por dia)' },
      { k: 'Três perguntas', v: 'Por quê? Como? Com o quê?' },
      { k: 'Edição', v: 'Formação inicial de escolas parceiras · 2026' },
    ],
    content: c(processoOnboarding),
  },
  {
    slug: 'relatorio-onboarding', n: 12, grupo: 'Jornada de implantação', etapa: 5, marcos: [6],
    tipo: 'Formulário', kicker: 'Macroetapa 5 de 7 · Onboarding Pedagógico',
    title: 'Relatório de Onboarding da Escola Parceira', short: 'Relatório de Onboarding',
    deck: 'Registro de execução, conclusão e prontidão para as primeiras aulas.',
    facts: [], content: c(relatorioOnboarding),
  },
  {
    slug: 'ficha-go-live', n: 13, grupo: 'Jornada de implantação', etapa: 6, marcos: [7, 8],
    tipo: 'Formulário', kicker: 'Macroetapas 6 e 7 de 7 · Go-Live e Transição',
    title: 'Ficha de Go-Live', short: 'Ficha de Go-Live',
    deck: 'Validação final para início das aulas We Make, com a transição para a Academia na seção 8.',
    facts: [], content: c(fichaGoLive),
  },
  {
    slug: 'painel-mestre', n: 14, grupo: 'Controle', etapa: 0, marcos: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    tipo: 'Planilha', kicker: 'Controle · Painel Mestre de Implantação 2027',
    title: 'Painel Mestre de Implantação', short: 'Painel Mestre',
    deck: 'Visão executiva das escolas parceiras: etapas, prazos, riscos e próximas ações.',
    facts: [
      { k: 'Regra básica', v: 'Uma linha por escola' },
      { k: 'Marcos', v: '9 marcos, do Handoff à Transição para a Academia' },
      { k: 'Abas', v: 'Painel · Implantacao · Listas · Como usar · Matriz documentos' },
    ],
    content: c(painelMestre),
  },
]

const EXTRA: Record<string, Pick<AcademiaDoc, 'origem' | 'oficialNo' | 'fonte'>> = {
  'manual-operacional': { origem: 'denis', oficialNo: '1', fonte: '1. Manual_Operacional_Implantacao_We_Make_2027_v2.0.pdf' },
  handoff: { origem: 'denis', oficialNo: '2', fonte: '2. Handoff_Comercial_Implantacao_We_Make_2027.pdf' },
  'procedimento-diagnostico': { origem: 'denis', oficialNo: '3', fonte: '3. Procedimento_Oficial_Diagnostico_Espaco_Maker_We_Make_2027.pdf' },
  'planilha-diagnostico': { origem: 'denis', oficialNo: '3.1', fonte: '3.1 Diagnostico_Espaco_Maker_We_Make_2027.xlsx' },
  'registro-ativacao-comercial': { origem: 'denis', oficialNo: '4', fonte: '4. Registro_Ativacao_Comercial_We_Make_2027.pdf' },
  'checklist-pre-onboarding': { origem: 'denis', oficialNo: '5', fonte: '5. Checklist_Pre_Onboarding_We_Make_2027.pdf' },
  'relatorio-onboarding': { origem: 'denis', oficialNo: '6', fonte: '6. Relatorio_Onboarding_Escola_Parceira_We_Make_2027.pdf' },
  'ficha-go-live': { origem: 'denis', oficialNo: '7', fonte: '7. Ficha_Go_Live_We_Make_2027.pdf' },
  'painel-mestre': { origem: 'denis', oficialNo: '8', fonte: '8. Painel_Mestre_Implantacao_We_Make_2027.xlsx' },
  'documento-normativo': { origem: 'complementar', fonte: 'We_Make_Academia_Documento_Normativo.pdf' },
  'arquitetura-de-processos': { origem: 'complementar', fonte: 'We_Make_Academia_Arquitetura_de_Processos_2027.docx' },
  'processo-de-onboarding-2026': { origem: 'complementar', fonte: 'Processo_de_Onboarding_We_Make_2026.pdf' },
  'manual-do-formador': { origem: 'complementar', fonte: 'WeMake_Manual_do_Formador.pdf' },
  'material-do-multiplicador': { origem: 'complementar', fonte: 'WeMake_Material_do_Multiplicador.pdf' },
}

export const ACADEMIA_DOCS: AcademiaDoc[] = BASE_DOCS.map(d => ({ ...d, ...EXTRA[d.slug] }))

export const ORIGEM_LABEL = { denis: 'Documento oficial · Dênis', complementar: 'Documento complementar' } as const

export const GRUPOS: { nome: Grupo; texto: string }[] = [
  { nome: 'Fundamentos', texto: 'O que a Academia é, quem responde por ela e como as peças se encaixam.' },
  { nome: 'Jornada de implantação', texto: 'Da assinatura do contrato à transição para o acompanhamento anual, na ordem em que a escola percorre.' },
  { nome: 'Controle', texto: 'Como a equipe enxerga todas as escolas ao mesmo tempo.' },
]

export function getDoc(slug: string) {
  return ACADEMIA_DOCS.find(d => d.slug === slug)
}

export function getNeighbors(slug: string) {
  const i = ACADEMIA_DOCS.findIndex(d => d.slug === slug)
  return {
    prev: i > 0 ? ACADEMIA_DOCS[i - 1] : null,
    next: i >= 0 && i < ACADEMIA_DOCS.length - 1 ? ACADEMIA_DOCS[i + 1] : null,
  }
}

/** Trio de informações do cabeçalho: usa o trio do próprio documento quando existe. */
export function headerFacts(d: AcademiaDoc) {
  const trio = d.content.trio
  if (trio && trio.length) return trio.map(t => ({ k: t.k.charAt(0) + t.k.slice(1).toLowerCase(), v: t.v }))
  return d.facts
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export interface OutlineItem { id: string; label: string; n?: string; level: 1 | 2 }

/** Índice (sumário) gerado a partir das seções do documento. */
export function buildOutline(blocks: Block[]): OutlineItem[] {
  const out: OutlineItem[] = []
  const used = new Map<string, number>()
  const uid = (base: string) => {
    const k = used.get(base) ?? 0
    used.set(base, k + 1)
    return k ? `${base}-${k + 1}` : base
  }
  blocks.forEach(b => {
    if (b.t === 'sec') out.push({ id: uid(slugify((b.n ? b.n + '-' : '') + b.x)), label: b.x, n: b.n, level: 1 })
    else if (b.t === 'sub') out.push({ id: uid(slugify((b.n ? b.n + '-' : '') + b.x)), label: b.x, n: b.n, level: 2 })
  })
  return out
}
