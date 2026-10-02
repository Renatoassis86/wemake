import { addDias, addDiasUteis, type Implantacao, type Prioridade } from '@/lib/academia-gestao'

/**
 * Estrutura do workspace de gestão (espaço → pastas → listas → tarefas).
 * Cada pasta é uma macroetapa do Manual Operacional; cada lista é um marco do
 * Painel Mestre; as tarefas-modelo vêm do "Como executar" de cada macroetapa e
 * dos formulários oficiais. O campo `origem` diz de qual documento saiu.
 */

export type RefData = 'assinatura' | 'handoff' | 'onboarding' | 'inicio'

export interface TarefaModelo {
  titulo: string
  descricao?: string
  prioridade?: Prioridade
  /** prazo relativo a uma data-chave da escola */
  quando?: { ref: RefData; dias: number; uteis?: boolean; nota?: string }
  /** documento da Academia em que a tarefa se baseia */
  origem: string
}

export interface ListaModelo {
  slug: string
  nome: string
  /** índice do marco do Painel Mestre (0 a 8) */
  marco: number
  doc: string
  tarefas: TarefaModelo[]
}

export interface PastaModelo {
  slug: string
  nome: string
  /** macroetapa 1–7 */
  etapa: number
  gate: string
  listas: ListaModelo[]
}

export const WORKSPACE_NOME = 'Academia We Make · Implantação 2027'

export const PASTAS: PastaModelo[] = [
  {
    slug: 'handoff', nome: 'Handoff Comercial', etapa: 1,
    gate: 'Ficha revisada pelo Comercial e aceita pela Implantação; responsável definido; escola cadastrada no Painel Mestre com próxima ação registrada.',
    listas: [{
      slug: 'handoff', nome: 'Handoff', marco: 0, doc: 'handoff',
      tarefas: [
        { titulo: 'Preencher a Ficha de Handoff Comercial → Implantação', descricao: 'Quem preenche: responsável pelo fechamento comercial.', quando: { ref: 'assinatura', dias: 2, uteis: true, nota: 'até 2 dias úteis após a assinatura' }, prioridade: 'Alta', origem: 'Handoff · Manual Operacional, macroetapa 1' },
        { titulo: 'Registrar escopo contratado, calendário, pessoas-chave, acordos e exceções, contexto da decisão, situação do Espaço Maker, pendências e alertas', quando: { ref: 'assinatura', dias: 2, uteis: true }, origem: 'Manual Operacional, macroetapa 1' },
        { titulo: 'Realizar a reunião interna de passagem de bastão entre Comercial e Implantação', quando: { ref: 'handoff', dias: 0 }, origem: 'Manual Operacional, macroetapa 1' },
        { titulo: 'Definir o responsável We Make pela implantação e a próxima ação', quando: { ref: 'handoff', dias: 0 }, origem: 'Manual Operacional, macroetapa 1' },
        { titulo: 'Kickoff com a escola e registro de calendário e marcos (quando necessário)', origem: 'Manual Operacional, macroetapa 1' },
        { titulo: 'Cadastrar a escola no Painel Mestre com a próxima ação registrada', quando: { ref: 'handoff', dias: 0 }, origem: 'Painel Mestre · Como usar' },
      ],
    }],
  },
  {
    slug: 'ecologia-formativa', nome: 'Ecologia Formativa', etapa: 2,
    gate: 'Diagnóstico analisado; recursos existentes classificados; adequações definidas; lista final de recursos entregue; pendências críticas com responsável e prazo.',
    listas: [
      {
        slug: 'diagnostico', nome: 'Diagnóstico', marco: 1, doc: 'procedimento-diagnostico',
        tarefas: [
          { titulo: 'Enviar à escola a planilha oficial de diagnóstico e o checklist de medidas e evidências', descricao: 'Etapa 1 do procedimento. A planilha já contém a lista de recursos reutilizáveis e consumíveis.', origem: 'Procedimento de Diagnóstico, etapa 1' },
          { titulo: 'Escola: levantar o ambiente (uso atual, alunos, mobiliário, equipamentos e checklist de medidas)', descricao: 'Paredes, pé-direito, portas, janelas, tomadas, pontos de rede, climatização, iluminação, pilares, vigas e elementos fixos.', origem: 'Procedimento de Diagnóstico, etapa 2' },
          { titulo: 'Escola: enviar as evidências (fotos, vídeo de 1 a 2 minutos, planta baixa ou croqui)', origem: 'Procedimento de Diagnóstico, etapa 3' },
          { titulo: 'Escola: informar o inventário de recursos existentes (possui, quantidade, marca/modelo)', origem: 'Procedimento de Diagnóstico, etapa 4' },
          { titulo: 'We Make: analisar o ambiente e os recursos informados e registrar o parecer técnico', origem: 'Procedimento de Diagnóstico, etapa 5' },
        ],
      },
      {
        slug: 'arquitetura', nome: 'Arquitetura', marco: 2, doc: 'procedimento-diagnostico',
        tarefas: [
          { titulo: 'Consolidar o briefing e encaminhar ao estúdio de arquitetura (quando aplicável)', origem: 'Procedimento de Diagnóstico, etapa 6' },
          { titulo: 'Receber o memorial/orientações do estúdio e devolvê-los à escola', origem: 'Manual Operacional, macroetapa 2' },
        ],
      },
      {
        slug: 'recursos', nome: 'Recursos', marco: 3, doc: 'planilha-diagnostico',
        tarefas: [
          { titulo: 'Classificar os itens reutilizáveis (parecer, quantidade aproveitável e ação recomendada)', origem: 'Planilha de Diagnóstico' },
          { titulo: 'Definir a lista final de aquisições permanentes e consumíveis', origem: 'Manual Operacional, macroetapa 2' },
          { titulo: 'Devolutiva final: parecer do ambiente, recursos aprovados para reutilização e itens a adquirir', origem: 'Procedimento de Diagnóstico, etapa 7' },
          { titulo: 'Acompanhar adequações e compras da escola (itens críticos antes do Go-Live)', origem: 'Manual Operacional · riscos recorrentes' },
        ],
      },
    ],
  },
  {
    slug: 'ativacao-comercial', nome: 'Ativação Comercial', etapa: 3,
    gate: 'Equipe-chave orientada; materiais oficiais disponibilizados; responsável da escola capaz de apresentar a proposta; dúvidas ou riscos de comunicação registrados.',
    listas: [{
      slug: 'ativacao-comercial', nome: 'Ativação Comercial', marco: 4, doc: 'registro-ativacao-comercial',
      tarefas: [
        { titulo: 'Encontro 1 · 90 min · Quem é a We Make, fundamentação teológica e dado do Nobel', descricao: 'Momento Conhecer.', quando: { ref: 'handoff', dias: 30, nota: 'a trilha conclui em até 30 dias corridos após o Handoff' }, origem: 'Manual do Formador · cronograma-modelo' },
        { titulo: 'Encontro 2 · 90 min · Posicionamento “soma, não substitui” e mapa de temas por área', descricao: 'Momentos Conhecer e Explorar.', quando: { ref: 'handoff', dias: 30 }, origem: 'Manual do Formador · cronograma-modelo' },
        { titulo: 'Encontro 3 · 120 min · Fluxo curricular por segmento e portfólio de produtos e serviços', descricao: 'Momento Explorar.', quando: { ref: 'handoff', dias: 30 }, origem: 'Manual do Formador · cronograma-modelo' },
        { titulo: 'Encontro 4 · 90 min · Script comercial, roteiro de deslumbramento e discurso de 60 segundos', descricao: 'Momentos Explorar e Criar.', quando: { ref: 'handoff', dias: 30 }, origem: 'Manual do Formador · cronograma-modelo' },
        { titulo: 'Encontro 5 · 90 min · Role-play de objeções com escalada e diagnóstico final', descricao: 'Momento Criar. Nenhum encontro termina sem um produto do participante.', quando: { ref: 'handoff', dias: 30 }, origem: 'Manual do Formador · cronograma-modelo' },
        { titulo: 'Entregar o Material do Multiplicador e os materiais oficiais (apresentação, FAQ, texto institucional, imagens)', quando: { ref: 'handoff', dias: 30 }, origem: 'Registro de Ativação Comercial' },
        { titulo: 'Preencher o Registro de Ativação Comercial e validar a prontidão da equipe', quando: { ref: 'handoff', dias: 30 }, prioridade: 'Alta', origem: 'Registro de Ativação Comercial' },
      ],
    }],
  },
  {
    slug: 'pre-onboarding', nome: 'Pré-Onboarding', etapa: 4,
    gate: 'Pré-Onboarding validado → formação confirmada.',
    listas: [{
      slug: 'pre-onboarding', nome: 'Pré-Onboarding', marco: 5, doc: 'checklist-pre-onboarding',
      tarefas: [
        { titulo: 'Enviar o Checklist Pré-Onboarding à escola', quando: { ref: 'onboarding', dias: -10, nota: 'iniciar entre 7 e 10 dias antes da formação' }, origem: 'Manual Operacional, macroetapa 4' },
        { titulo: 'Escola: confirmar participantes, espaço, dispositivos e acessos, equipamentos e agenda', origem: 'Checklist Pré-Onboarding' },
        { titulo: 'We Make: validar os itens e concluir a preparação interna (materiais, planos, acessos, prática)', quando: { ref: 'onboarding', dias: -2, uteis: true }, origem: 'Checklist Pré-Onboarding' },
        { titulo: 'Registrar pendências com responsável e prazo', quando: { ref: 'onboarding', dias: -2, uteis: true }, origem: 'Checklist Pré-Onboarding' },
        { titulo: 'Decisão de prontidão: Confirmado, Confirmado com Pendências ou Não Confirmado', quando: { ref: 'onboarding', dias: -2, uteis: true, nota: 'encerrar até 2 dias úteis antes' }, prioridade: 'Alta', origem: 'Checklist Pré-Onboarding' },
      ],
    }],
  },
  {
    slug: 'onboarding', nome: 'Onboarding Pedagógico', etapa: 5,
    gate: 'Onboarding concluído → escola avança para a preparação do Go-Live.',
    listas: [{
      slug: 'onboarding', nome: 'Onboarding', marco: 6, doc: 'relatorio-onboarding',
      tarefas: [
        { titulo: 'Dia 1 · Fundamentos e metodologia (≈ 6 h)', descricao: 'Cosmovisão, Educação e Tecnologia; Conhecer, Explorar e Criar.', quando: { ref: 'onboarding', dias: 0 }, prioridade: 'Alta', origem: 'Processo de Onboarding' },
        { titulo: 'Dia 2 · Plataforma, planos, máquinas e prática (≈ 6 h)', descricao: 'Plataforma; planos e planejamento; máquinas e ferramentas; prática orientada; recomendações para as primeiras aulas.', prioridade: 'Alta', origem: 'Processo de Onboarding' },
        { titulo: 'Preencher o Relatório de Onboarding ao final do segundo dia', origem: 'Relatório de Onboarding' },
        { titulo: 'Parecer final: Concluído, Concluído com Pendências ou Não Concluído', origem: 'Relatório de Onboarding' },
        { titulo: 'Registrar o plano de ação pós-onboarding', origem: 'Relatório de Onboarding' },
      ],
    }],
  },
  {
    slug: 'go-live', nome: 'Go-Live e Transição', etapa: 6,
    gate: 'Go-Live liberado → escola entra em operação; responsável, cadência e pontos de atenção registrados.',
    listas: [
      {
        slug: 'go-live', nome: 'Go-Live', marco: 7, doc: 'ficha-go-live',
        tarefas: [
          { titulo: 'Preencher a Ficha de Go-Live (pessoas e formação, plataforma, Espaço Maker, recursos e primeiras aulas)', quando: { ref: 'inicio', dias: -1, nota: 'após o onboarding e antes da primeira aula' }, prioridade: 'Alta', origem: 'Ficha de Go-Live' },
          { titulo: 'Registrar as pendências abertas e a decisão: Liberado, Liberado com Pendências ou Go-Live Bloqueado', quando: { ref: 'inicio', dias: -1 }, prioridade: 'Alta', origem: 'Ficha de Go-Live' },
          { titulo: 'Revisão completa da escola antes do Go-Live', origem: 'Manual Operacional · rotina do Painel Mestre' },
        ],
      },
      {
        slug: 'transicao', nome: 'Transição para a Academia', marco: 8, doc: 'ficha-go-live',
        tarefas: [
          { titulo: 'Registrar a seção 8 da Ficha de Go-Live: data de entrada, responsável, frequência inicial, ponto de atenção e primeira ação', quando: { ref: 'inicio', dias: 0, nota: 'imediatamente após a liberação do Go-Live' }, prioridade: 'Alta', origem: 'Manual Operacional, macroetapa 7' },
          { titulo: 'Definir o nível de acompanhamento inicial (A, B ou C)', descricao: 'Proposta da Arquitetura de Processos: o campo ainda não existe na Ficha de Go-Live.', quando: { ref: 'inicio', dias: 0 }, origem: 'Arquitetura de Processos · ajuste 2' },
          { titulo: 'Marcar o marco “Transição para Academia” como Concluído no Painel Mestre', quando: { ref: 'inicio', dias: 0 }, origem: 'Manual Operacional, macroetapa 7' },
        ],
      },
    ],
  },
]

export const LISTAS = PASTAS.flatMap(p => p.listas.map(l => ({ ...l, pasta: p })))
export const getLista = (slug: string) => LISTAS.find(l => l.slug === slug)

/** Ritos de governança da Academia (Arquitetura de Processos, seção 13). */
export const RITOS = [
  { frequencia: 'Semanal', nome: 'Revisão do Painel Mestre de Implantação', foco: 'Prazos vencidos, bloqueios, riscos altos', quem: 'Implantação e Renato', duracao: '30 min', minutos: 30 },
  { frequencia: 'Quinzenal', nome: 'Reunião da Academia', foco: 'Escolas em nível A, alertas, chamados abertos', quem: 'Emanuela, Suzana e Renato', duracao: '45 min', minutos: 45 },
  { frequencia: 'Mensal', nome: 'Comitê da Academia com a direção', foco: 'Indicadores, capacidade, decisões', quem: 'Dênis, Emanuela e Renato', duracao: '1 h', minutos: 60 },
  { frequencia: 'Trimestral', nome: 'Comitê de conteúdo', foco: 'Backlog editorial', quem: 'Dênis e Emanuela', duracao: '2 h', minutos: 120 },
  { frequencia: 'Semestral', nome: 'Revisão do meio de ciclo e reclassificação de níveis', foco: 'Meio de ciclo', quem: 'Equipe da Academia', duracao: '2 h', minutos: 120 },
  { frequencia: 'Anual, em novembro', nome: 'Revisão do Documento Normativo, da Arquitetura e do calendário do ano seguinte', foco: 'Revisão anual', quem: 'Direção e Academia', duracao: 'Meio dia', minutos: 240 },
] as const

/* ══════════════════════════════ Datas das tarefas ══════════════════════════════ */

export function prazoDoModelo(t: TarefaModelo, i: Pick<Implantacao, 'data_assinatura' | 'data_onboarding' | 'data_inicio_aulas'>): string | null {
  if (!t.quando) return null
  const handoff = i.data_assinatura ? addDiasUteis(i.data_assinatura, 2) : null
  const base =
    t.quando.ref === 'assinatura' ? i.data_assinatura
    : t.quando.ref === 'handoff' ? handoff
    : t.quando.ref === 'onboarding' ? i.data_onboarding
    : i.data_inicio_aulas
  if (!base) return null
  return t.quando.uteis ? addDiasUteis(base, t.quando.dias) : addDias(base, t.quando.dias)
}
