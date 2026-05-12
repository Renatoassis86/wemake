export type UserRole = 'gerente' | 'supervisor' | 'consultor' | 'assistente' | 'readonly'

export type PerfilPedagogico =
  | 'crista_catolica' | 'evangelica' | 'por_principio'
  | 'crista_classica' | 'convencional' | 'outro'

export type OrigemLead =
  | 'feira' | 'instagram' | 'network' | 'envio_material' | 'opening_company'
  | 'abeka' | 'acsi' | 'congresso_ecc' | 'indicacao_escola' | 'outros'

export type MeioContato =
  | 'presencial' | 'whatsapp' | 'email' | 'telefone' | 'videoconf' | 'outro'

export type NivelInteresse = 'muito_baixo' | 'baixo' | 'medio' | 'alto' | 'muito_alto'

export type ProntidaoNegociacao =
  | 'parada' | 'nova_reuniao' | 'esperando_retorno' | 'apresentacao'
  | 'contrato_enviado' | 'atualizar_contrato' | 'contrato_assinado' | 'parceiro_ativo'

export type AberturaPropostal = 'nenhuma' | 'baixa' | 'media' | 'alta'
export type ClassificacaoLead = 'quente' | 'morno' | 'frio'

export type StageNegociacao =
  | 'prospeccao' | 'qualificacao' | 'apresentacao' | 'proposta'
  | 'negociacao' | 'fechamento' | 'ganho' | 'perdido'

export type TarefaPrioridade = 'baixa' | 'media' | 'alta' | 'urgente'
export type TarefaStatus = 'pendente' | 'concluida' | 'cancelada'

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone: string | null
  region: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Escola {
  id: string
  nome: string
  cnpj: string | null
  perfil_pedagogico: PerfilPedagogico
  escola_paideia: boolean
  rua: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  telefone: string | null
  email: string | null
  site: string | null
  contato_nome: string | null
  contato_cargo: string | null
  diretor_nome: string | null
  qtd_infantil: number
  qtd_infantil2: number
  qtd_infantil3: number
  qtd_infantil4: number
  qtd_infantil5: number
  qtd_fund1: number
  qtd_fund1_ano1: number
  qtd_fund1_ano2: number
  qtd_fund1_ano3: number
  qtd_fund1_ano4: number
  qtd_fund1_ano5: number
  qtd_fund2: number
  qtd_medio: number
  origem_lead: OrigemLead | null
  responsavel_id: string | null
  observacoes: string | null
  ativa: boolean
  total_alunos: number
  potencial_financeiro: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  responsavel?: Profile
}

export interface EscolaResumo extends Escola {
  ultimo_contato: string | null
  classificacao_atual: ClassificacaoLead | null
  probabilidade_atual: number | null
  responsavel_nome: string | null
}

export interface ContatoEscola {
  id: string
  escola_id: string
  nome: string
  cargo: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  principal: boolean
  observacoes: string | null
  created_at: string
}

export interface Negociacao {
  id: string
  escola_id: string
  titulo: string | null
  stage: StageNegociacao
  responsavel_id: string | null
  valor_estimado: number | null
  probabilidade: number
  previsao_fechamento: string | null
  motivo_perda: string | null
  ativa: boolean
  observacoes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  escola?: Escola
  responsavel?: Profile
}

export interface Registro {
  id: string
  escola_id: string
  negociacao_id: string | null
  data_contato: string
  hora_contato: string | null
  meio_contato: MeioContato
  resumo: string
  responsavel_id: string | null
  contato_nome: string | null
  contato_cargo: string | null
  interesse: NivelInteresse
  prontidao: ProntidaoNegociacao
  abertura: AberturaPropostal
  encaminhamentos: string[]
  qtd_infantil: number
  qtd_fund1: number
  qtd_fund2: number
  qtd_medio: number
  potencial_financeiro: number
  probabilidade: number
  classificacao: ClassificacaoLead
  proximo_contato: string | null
  notas_internas: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  escola?: Escola
  responsavel?: Profile
}

export interface Tarefa {
  id: string
  escola_id: string
  negociacao_id: string | null
  titulo: string
  descricao: string | null
  responsavel_id: string | null
  vencimento: string | null
  prioridade: TarefaPrioridade
  status: TarefaStatus
  concluida_em: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  escola?: Escola
  responsavel?: Profile
}

export interface NotaEscola {
  id: string
  escola_id: string
  texto: string
  fixada: boolean
  created_by: string | null
  created_at: string
}

export interface Contrato {
  id: string
  escola_id: string
  formulario_enviado: boolean
  formulario_recebido: boolean
  minuta_enviada: boolean
  retorno_minuta: boolean
  observacao_minuta: string | null
  minuta_atualizada: boolean
  contrato_enviado: boolean
  contrato_assinado: boolean
  contrato_arquivado: boolean
  encaminhamento_final: string | null
  infantil2_qtd: number
  infantil2_valor: number
  infantil3_qtd: number
  infantil3_valor: number
  infantil4_qtd: number
  infantil4_valor: number
  infantil5_qtd: number
  infantil5_valor: number
  fund1_ano1_qtd: number
  fund1_ano1_valor: number
  fund1_ano2_qtd: number
  fund1_ano2_valor: number
  fund1_ano3_qtd: number
  fund1_ano3_valor: number
  fund1_ano4_qtd: number
  fund1_ano4_valor: number
  fund1_ano5_qtd: number
  fund1_ano5_valor: number
  tempo_contrato: number
  valor_total: number
  valor_total_calculado: number
  created_at: string
  updated_at: string
  escola?: Escola
}

export interface Formulario {
  id: string
  data_envio: string
  email_responsavel: string
  nome_escola: string
  cnpj: string | null
  rua: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  infantil2_qtd: number
  infantil3_qtd: number
  infantil4_qtd: number
  infantil5_qtd: number
  fund1_ano1_qtd: number
  fund1_ano2_qtd: number
  fund1_ano3_qtd: number
  fund1_ano4_qtd: number
  fund1_ano5_qtd: number
  data_inicio_letivo: string | null
  data_fim_letivo: string | null
  formato_ano_letivo: string | null
  observacoes: string | null
  legal_nome: string | null
  legal_cpf: string | null
  legal_rg: string | null
  legal_orgao: string | null
  legal_rua: string | null
  legal_numero: string | null
  legal_complemento: string | null
  legal_bairro: string | null
  legal_cidade: string | null
  legal_estado: string | null
  legal_cep: string | null
  legal_email: string | null
  legal_celular: string | null
  fin_nome: string | null
  fin_cpf: string | null
  fin_rg: string | null
  fin_orgao: string | null
  fin_email: string | null
  fin_celular: string | null
  ped_nome: string | null
  ped_cpf: string | null
  ped_rg: string | null
  ped_orgao: string | null
  ped_email: string | null
  ped_celular: string | null
}

export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: any
  new_data: any
  ip_address: string | null
  created_at: string
}

export interface Notificacao {
  id: string
  user_id: string
  titulo: string
  mensagem: string | null
  tipo: 'info' | 'warning' | 'success' | 'danger'
  lida: boolean
  link: string | null
  created_at: string
}

// ─── Labels / Options ─────────────────────────────────────────────────────────

export const PERFIL_OPTIONS = [
  { value: 'crista_catolica',  label: 'Cristã Católica' },
  { value: 'evangelica',       label: 'Cristã Evangélica' },
  { value: 'por_principio',    label: 'Educação por Princípio' },
  { value: 'crista_classica',  label: 'Cristã Clássica' },
  { value: 'convencional',     label: 'Convencional (Educação Moderna)' },
  { value: 'outro',            label: 'Outro' },
]

// Apenas valores válidos no enum PostgreSQL origem_lead
// Para adicionar novos, execute supabase/fix_origem_lead_enum.sql
export const ORIGEM_OPTIONS = [
  { value: 'feira',     label: 'Feira' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'network',   label: 'Network' },
  { value: 'site',      label: 'Site' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'email',     label: 'E-mail' },
  { value: 'telefone',  label: 'Telefone' },
  { value: 'visita',    label: 'Visita Presencial' },
  { value: 'evento',    label: 'Evento / Congresso ECC' },
  { value: 'parceiro',  label: 'Indicação de parceiro' },
  { value: 'outro',     label: 'Outro' },
]

export const CARGO_CONTATO_OPTIONS = [
  'Mantenedor', 'Gestor', 'Diretor', 'Coordenador', 'Professor', 'Secretário(a)', 'Outro',
]

export const RESPONSAVEIS_OPTIONS = [
  'Raissa Fernandes', 'Ranieri França', 'Emmanuel Pires', 'Isabela Rolim',
  'Renato Assis', 'Thiago Dutra', 'Bia Ruggeri', 'Jhon Jarison', 'Layla Ramos',
]

export const MEIO_OPTIONS = [
  { value: 'presencial',  label: 'Presencial' },
  { value: 'whatsapp',    label: 'WhatsApp' },
  { value: 'email',       label: 'E-mail' },
  { value: 'telefone',    label: 'Telefone' },
  { value: 'videoconf',   label: 'Videoconferência' },
  { value: 'outro',       label: 'Outro' },
]

export const INTERESSE_OPTIONS = [
  { value: 'muito_baixo', label: 'Muito Baixo' },
  { value: 'baixo',       label: 'Baixo' },
  { value: 'medio',       label: 'Médio' },
  { value: 'alto',        label: 'Alto' },
  { value: 'muito_alto',  label: 'Muito Alto' },
]

export const PRONTIDAO_OPTIONS = [
  { value: 'parada',              label: 'Negociação Parada' },
  { value: 'nova_reuniao',        label: 'Nova Reunião Necessária' },
  { value: 'esperando_retorno',   label: 'Esperando Retorno' },
  { value: 'apresentacao',        label: 'Apresentação em Andamento' },
  { value: 'contrato_enviado',    label: 'Contrato Enviado' },
  { value: 'atualizar_contrato',  label: 'Atualizar Contrato' },
  { value: 'contrato_assinado',   label: 'Contrato Assinado' },
  { value: 'parceiro_ativo',      label: 'Parceiro Ativo' },
]

export const ABERTURA_OPTIONS = [
  { value: 'nenhuma', label: 'Nenhuma' },
  { value: 'baixa',   label: 'Baixa' },
  { value: 'media',   label: 'Média' },
  { value: 'alta',    label: 'Alta' },
]

export const ENCAMINHAMENTOS_OPTIONS = [
  { value: 'agendamento_reuniao',   label: 'Agendamento de Reunião' },
  { value: 'apresentacao_curriculo', label: 'Apresentação Currículo' },
  { value: 'envio_material',        label: 'Envio de Material' },
  { value: 'nova_visita',           label: 'Nova Visita' },
  { value: 'contato_futuro',        label: 'Contato Futuro' },
  { value: 'elaboracao_contrato',   label: 'Elaboração de Contrato' },
  { value: 'contrato_enviado',      label: 'Contrato Enviado' },
  { value: 'contrato_assinado',     label: 'Contrato Assinado' },
]

export const STAGE_OPTIONS = [
  { value: 'prospeccao',   label: 'Prospecção' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'apresentacao', label: 'Apresentação' },
  { value: 'proposta',     label: 'Proposta Enviada' },
  { value: 'negociacao',   label: 'Em Negociação' },
  { value: 'fechamento',   label: 'Fechamento' },
  { value: 'ganho',        label: 'Ganho ✓' },
  { value: 'perdido',      label: 'Perdido ✗' },
]

export const ROLE_OPTIONS = [
  { value: 'gerente',    label: 'Gerente' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'consultor',  label: 'Consultor Comercial' },
  { value: 'assistente', label: 'Assistente' },
  { value: 'readonly',   label: 'Somente Leitura' },
]

export const LABEL: Record<string, Record<string, string>> = {
  perfil_pedagogico: Object.fromEntries(PERFIL_OPTIONS.map(o => [o.value, o.label])),
  origem_lead: Object.fromEntries(ORIGEM_OPTIONS.map(o => [o.value, o.label])),
  meio_contato: Object.fromEntries(MEIO_OPTIONS.map(o => [o.value, o.label])),
  interesse: Object.fromEntries(INTERESSE_OPTIONS.map(o => [o.value, o.label])),
  prontidao: Object.fromEntries(PRONTIDAO_OPTIONS.map(o => [o.value, o.label])),
  abertura: Object.fromEntries(ABERTURA_OPTIONS.map(o => [o.value, o.label])),
  stage: Object.fromEntries(STAGE_OPTIONS.map(o => [o.value, o.label])),
  role: Object.fromEntries(ROLE_OPTIONS.map(o => [o.value, o.label])),
}

// Helpers
// Valores dos kits CVE Education
export const KIT_INFANTIL = 1046.26
export const KIT_FUND     = 1302.15

export function calcPotencial(inf: number, f1: number, f2: number, med: number) {
  return Math.round(inf * KIT_INFANTIL + (f1 + f2 + med) * KIT_FUND)
}

export function calcProbabilidade(
  interesse: string, prontidao: string, abertura: string, encaminhamentos: string[]
): number {
  const pi: Record<string, number> = { muito_baixo: 5, baixo: 15, medio: 35, alto: 65, muito_alto: 85 }
  const pp: Record<string, number> = {
    parada: 0, nova_reuniao: 10, esperando_retorno: 20, apresentacao: 35,
    contrato_enviado: 60, atualizar_contrato: 70, contrato_assinado: 100, parceiro_ativo: 100,
  }
  const pa: Record<string, number> = { nenhuma: 0, baixa: 10, media: 30, alta: 60 }
  const bonus = Math.min((encaminhamentos?.length ?? 0) * 5, 20)
  const base = (pi[interesse] ?? 35) * 0.35 + (pp[prontidao] ?? 20) * 0.45 + (pa[abertura] ?? 30) * 0.20 + bonus
  return Math.min(Math.round(base), 100)
}

export function calcClassificacao(prob: number, potencial: number): ClassificacaoLead {
  if (prob >= 80 && potencial >= 20000) return 'quente'
  if (prob >= 50 && potencial >= 10000) return 'morno'
  return 'frio'
}

export function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
