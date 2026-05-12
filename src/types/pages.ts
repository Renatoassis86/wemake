/**
 * pages.ts — Tipos TypeScript específicos para cada página do app.
 *
 * Importar em Server Components e Client Components conforme necessário.
 * Todos os tipos de entidade base estão em @/types/database.
 * Todos os tipos de retorno de queries estão em @/lib/queries.
 */

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
  NivelInteresse,
  ProntidaoNegociacao,
  AberturaPropostal,
  MeioContato,
  TarefaPrioridade,
  TarefaStatus,
} from '@/types/database'

import type {
  DashboardStats,
  RegistroComEscola,
  TarefaComEscola,
  EscolaSemContato,
  Top5Escola,
  DistribuicaoClassificacao,
  RegistrosMes,
  PipelineStage,
} from '@/lib/queries'

// ─── Re-exports convenientes ──────────────────────────────────────────────────
// Facilita importação única nos componentes: import type { ... } from '@/types/pages'

export type {
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
  NivelInteresse,
  ProntidaoNegociacao,
  AberturaPropostal,
  MeioContato,
  TarefaPrioridade,
  TarefaStatus,
  DashboardStats,
  RegistroComEscola,
  TarefaComEscola,
  EscolaSemContato,
  Top5Escola,
  DistribuicaoClassificacao,
  RegistrosMes,
  PipelineStage,
}

// ─── Dashboard (/comercial) ────────────────────────────────────────────────────

/** Props do componente KpiCard */
export interface KpiCardProps {
  label: string
  value: number | string
  sub: string
  /** 'danger' | 'warning' | 'teal' | 'success' | '' */
  color?: string
  href?: string
}

/** Dados para um gráfico de pizza (classificação) */
export interface PieChartDatum {
  name: string
  value: number
  color: string
}

/** Dados para um gráfico de barras (registros por mês) */
export interface BarChartDatum {
  label: string
  value: number
}

// ─── Escolas (/comercial/escolas) ─────────────────────────────────────────────

/** Props da página de listagem de escolas */
export interface EscolasPageSearchParams {
  q?: string
  estado?: string
  classificacao?: ClassificacaoLead
  responsavel_id?: string
  page?: string
}

/** Linha da tabela de escolas (view escolas_resumo + campos adicionais) */
export interface EscolaRow extends EscolaResumo {
  // Campos derivados para exibição
  localidade: string   // "Cidade, UF" ou apenas "Cidade"
  tem_paideia: boolean
}

// ─── Detalhe da Escola (/comercial/escolas/[id]) ──────────────────────────────

/** Dados completos carregados na página de detalhe */
export interface EscolaDetalheData {
  escola:        Escola & { responsavel: Profile | null }
  registros:     RegistroComEscola[]
  negociacoes:   Negociacao[]
  tarefas:       TarefaComEscola[]
  notas:         NotaEscola[]
  contrato:      Contrato | null
  profiles:      Pick<Profile, 'id' | 'full_name'>[]
}

/** Props da tab de registros na escola */
export interface TabRegistrosProps {
  registros: RegistroComEscola[]
  escola_id: string
  profiles:  Pick<Profile, 'id' | 'full_name'>[]
}

/** Props da tab de negociações na escola */
export interface TabNegociacoesProps {
  negociacoes: Negociacao[]
  escola_id:   string
  profiles:    Pick<Profile, 'id' | 'full_name'>[]
}

/** Props da tab de tarefas na escola */
export interface TabTarefasProps {
  tarefas:  TarefaComEscola[]
  escola_id: string
  profiles:  Pick<Profile, 'id' | 'full_name'>[]
}

// ─── Novo Registro (/comercial/registros/novo) ────────────────────────────────

/** Props da página de novo registro */
export interface RegistroNovoPageProps {
  searchParams: Promise<{ escola?: string; negociacao?: string }>
}

/** Dados carregados para o formulário de registro */
export interface RegistroFormData {
  escolas:      Pick<Escola, 'id' | 'nome'>[]
  profiles:     Pick<Profile, 'id' | 'full_name'>[]
  negociacoes:  Pick<Negociacao, 'id' | 'titulo' | 'stage'>[]
  currentUserId: string | null
  hoje:          string
}

/** Payload enviado pelo form de registro (tipagem do formData parseado) */
export interface RegistroFormPayload {
  id?:             string
  escola_id:       string
  negociacao_id?:  string | null
  data_contato:    string
  hora_contato?:   string | null
  meio_contato:    MeioContato
  resumo:          string
  responsavel_id:  string
  contato_nome?:   string | null
  contato_cargo?:  string | null
  interesse:       NivelInteresse
  prontidao:       ProntidaoNegociacao
  abertura:        AberturaPropostal
  encaminhamentos: string[]
  qtd_infantil:    number
  qtd_fund1:       number
  qtd_fund2:       number
  qtd_medio:       number
  proximo_contato?: string | null
  notas_internas?:  string | null
}

// ─── Pipeline (/comercial/pipeline) ───────────────────────────────────────────

/** Dado de uma coluna do Kanban */
export interface KanbanColuna {
  stage:         StageNegociacao
  label:         string
  negociacoes:   NegociacaoKanbanCard[]
  total_valor:   number
  count:         number
}

/** Card de negociação no Kanban */
export interface NegociacaoKanbanCard {
  id:                 string
  titulo:             string | null
  escola_nome:        string
  escola_id:          string
  valor_estimado:     number | null
  probabilidade:      number
  previsao_fechamento: string | null
  responsavel_nome:   string | null
  dias_no_stage:      number  // calculado a partir de updated_at
}

// ─── Contratos (/comercial/contratos) ─────────────────────────────────────────

/** Linha da tabela de contratos */
export interface ContratoRow {
  id:               string
  escola_id:        string
  escola_nome:      string
  contrato_assinado: boolean
  contrato_enviado:  boolean
  valor_total:       number
  tempo_contrato:    number
  updated_at:        string
}

/** Status visual de etapa do contrato */
export interface EtapaContrato {
  key:       keyof Contrato
  label:     string
  concluida: boolean
}

// ─── Admin (/adminpanel) ──────────────────────────────────────────────────────

/** Linha da tabela de usuários */
export interface ProfileRow extends Profile {
  total_registros?: number
  total_escolas?:   number
}

// ─── Formulário Público (/formulario) ─────────────────────────────────────────

/** Etapas do wizard do formulário público */
export type FormularioEtapa =
  | 'escola'
  | 'quantitativos'
  | 'representante_legal'
  | 'responsavel_financeiro'
  | 'responsavel_pedagogico'
  | 'confirmacao'

/** Estado do wizard de formulário público */
export interface FormularioWizardState {
  etapaAtual:   FormularioEtapa
  etapaIndex:   number
  totalEtapas:  number
  dados:        Partial<FormularioPublicoPayload>
}

/** Payload completo do formulário público */
export interface FormularioPublicoPayload {
  email_responsavel:  string
  nome_escola:        string
  cnpj:               string | null
  rua:                string | null
  numero:             string | null
  complemento:        string | null
  bairro:             string | null
  cidade:             string | null
  estado:             string | null
  cep:                string | null
  infantil2_qtd:      number
  infantil3_qtd:      number
  infantil4_qtd:      number
  infantil5_qtd:      number
  fund1_ano1_qtd:     number
  fund1_ano2_qtd:     number
  fund1_ano3_qtd:     number
  fund1_ano4_qtd:     number
  fund1_ano5_qtd:     number
  data_inicio_letivo: string | null
  data_fim_letivo:    string | null
  formato_ano_letivo: string | null
  observacoes:        string | null
  legal_nome:         string | null
  legal_cpf:          string | null
  legal_rg:           string | null
  legal_orgao:        string | null
  legal_rua:          string | null
  legal_numero:       string | null
  legal_complemento:  string | null
  legal_bairro:       string | null
  legal_cidade:       string | null
  legal_estado:       string | null
  legal_cep:          string | null
  legal_email:        string | null
  legal_celular:      string | null
  fin_nome:           string | null
  fin_cpf:            string | null
  fin_rg:             string | null
  fin_orgao:          string | null
  fin_email:          string | null
  fin_celular:        string | null
  ped_nome:           string | null
  ped_cpf:            string | null
  ped_rg:             string | null
  ped_orgao:          string | null
  ped_email:          string | null
  ped_celular:        string | null
}

// ─── Utilitários de tipo ──────────────────────────────────────────────────────

/** Torna todos os campos de T opcionais exceto os listados em K */
export type RequireFields<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>

/** Remove campos de readonly de T (para uso em formulários) */
export type EditableFields<T> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'created_by'>

/** Coluna genérica de tabela (para componentes de data-table reutilizáveis) */
export interface TabelaColuna<T> {
  key:        keyof T | string
  label:      string
  sortable?:  boolean
  width?:     number | string
  // use ReactNode no arquivo .tsx que importar este tipo
  render?:    (row: T) => unknown
}

/** Opção genérica de select */
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/** Resposta paginada genérica para uso nos componentes */
export interface PaginacaoProps {
  paginaAtual:  number
  totalPaginas: number
  totalItems:   number
  perPage:      number
  baseUrl:      string
  params?:      Record<string, string>
}
