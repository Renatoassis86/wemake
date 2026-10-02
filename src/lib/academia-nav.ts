/**
 * Navegação lateral da Academia We Make. Lista enxuta de propósito: o menu lateral é um componente de
 * cliente e não deve carregar o texto dos 14 documentos. Manter na mesma ordem de src/lib/academia.ts.
 */

export interface ItemNav { slug: string; n: number; nome: string }

export const NAV_DOCS: { grupo: string; itens: ItemNav[] }[] = [
  {
    grupo: 'Fundamentos',
    itens: [
      { slug: 'documento-normativo', n: 1, nome: 'Documento Normativo' },
      { slug: 'arquitetura-de-processos', n: 2, nome: 'Arquitetura de Processos' },
    ],
  },
  {
    grupo: 'Jornada de implantação',
    itens: [
      { slug: 'manual-operacional', n: 3, nome: 'Manual Operacional' },
      { slug: 'handoff', n: 4, nome: 'Handoff Comercial' },
      { slug: 'procedimento-diagnostico', n: 5, nome: 'Procedimento de Diagnóstico' },
      { slug: 'planilha-diagnostico', n: 6, nome: 'Planilha de Diagnóstico' },
      { slug: 'registro-ativacao-comercial', n: 7, nome: 'Ativação Comercial' },
      { slug: 'manual-do-formador', n: 8, nome: 'Manual do Formador' },
      { slug: 'material-do-multiplicador', n: 9, nome: 'Material do Multiplicador' },
      { slug: 'checklist-pre-onboarding', n: 10, nome: 'Checklist Pré-Onboarding' },
      { slug: 'processo-de-onboarding-2026', n: 11, nome: 'Processo de Onboarding' },
      { slug: 'relatorio-onboarding', n: 12, nome: 'Relatório de Onboarding' },
      { slug: 'ficha-go-live', n: 13, nome: 'Ficha de Go-Live' },
    ],
  },
  {
    grupo: 'Controle',
    itens: [{ slug: 'painel-mestre', n: 14, nome: 'Painel Mestre' }],
  },
]

export const NAV_GESTAO: { href: string; nome: string; soDiagnosticos?: boolean }[] = [
  { href: '/academia/gestao', nome: 'Painel' },
  { href: '/academia/gestao/lista', nome: 'Lista' },
  { href: '/academia/gestao/quadro', nome: 'Quadro' },
  { href: '/academia/gestao/calendario', nome: 'Calendário' },
  { href: '/academia/gestao/agenda', nome: 'Agenda' },
  { href: '/academia/gestao/workspace', nome: 'Workspace' },
  { href: '/academia/gestao/diagnosticos', nome: 'Diagnósticos', soDiagnosticos: true },
]
