/**
 * Áreas da Gestão Geral da We Make (administrativa, financeira e de resultado).
 * "ativo" = já existe página que funciona; "em estruturação" = área definida,
 * ainda sem página. Os links apontam só para páginas que já existem hoje.
 */

export type StatusArea = 'ativo' | 'em estruturação'

export interface AreaItem {
  slug: string
  nome: string
  descricao: string
  status: StatusArea
  href?: string
  /** de onde vêm os dados, quando já há fonte */
  fonte?: string
}

export interface GrupoAreas {
  slug: string
  nome: string
  texto: string
  itens: AreaItem[]
}

export const GRUPOS_AREAS: GrupoAreas[] = [
  {
    slug: 'financeiro',
    nome: 'Financeiro',
    texto: 'Entradas, saídas e a saúde do caixa.',
    itens: [
      {
        slug: 'receita', nome: 'Receita contratada', status: 'ativo', href: '/gestao/receita',
        descricao: 'Receita anual e mensal de cada escola, calculada pelos contratos e pela quantidade de alunos.',
        fonte: 'Contratos da plataforma comercial',
      },
      { slug: 'receber', nome: 'Contas a receber e cobrança', status: 'em estruturação', descricao: 'Parcelas esperadas, recebidas e em atraso por escola.' },
      { slug: 'pagar', nome: 'Contas a pagar', status: 'em estruturação', descricao: 'Compromissos com fornecedores, equipe e impostos, com vencimento e situação.' },
      { slug: 'caixa', nome: 'Fluxo de caixa e conciliação bancária', status: 'em estruturação', descricao: 'Saldo projetado e realizado, conciliado com o extrato.' },
      { slug: 'faturamento', nome: 'Faturamento e notas fiscais', status: 'em estruturação', descricao: 'Emissão e controle das notas por contrato.' },
      { slug: 'orcamento', nome: 'Orçamento e planejamento financeiro', status: 'em estruturação', descricao: 'Planejamento anual por mês e por contrato, a partir da planilha de planejamento financeiro.', fonte: 'Planilha de Planejamento Financeiro 2027' },
      { slug: 'custos', nome: 'Centros de custo', status: 'em estruturação', descricao: 'Custo por frente, inclusive o centro de custo Academia proposto na Arquitetura de Processos.' },
    ],
  },
  {
    slug: 'administrativo',
    nome: 'Administrativo',
    texto: 'A estrutura que sustenta a operação.',
    itens: [
      { slug: 'contabil', nome: 'Contabilidade e obrigações fiscais', status: 'em estruturação', descricao: 'Calendário de obrigações e documentos para o contador.' },
      { slug: 'pessoas', nome: 'Pessoas, folha e benefícios', status: 'em estruturação', descricao: 'Equipe, contratos de trabalho e folha.' },
      { slug: 'compras', nome: 'Compras e fornecedores', status: 'em estruturação', descricao: 'Cadastro de fornecedores, pedidos e cotações.' },
      { slug: 'estoque', nome: 'Estoque, patrimônio e comodato', status: 'em estruturação', href: '/estoque', descricao: 'Equipamentos em comodato, inventário e reposição dos espaços maker.' },
      {
        slug: 'contratos', nome: 'Jurídico, contratos e certidões', status: 'ativo', href: '/comercial/contratos',
        descricao: 'Jornada contratual de cada escola, com minuta, assinatura e arquivos.', fonte: 'Jornada Contratual',
      },
      {
        slug: 'agenda', nome: 'Agenda, viagens e diárias', status: 'ativo', href: '/agenda',
        descricao: 'Agenda da equipe. Viagens e diárias ainda não têm controle próprio.', fonte: 'Agenda da plataforma',
      },
    ],
  },
  {
    slug: 'resultado',
    nome: 'Gestão e resultado',
    texto: 'Metas, indicadores e decisão.',
    itens: [
      {
        slug: 'metas', nome: 'Metas e resultados', status: 'ativo', href: '/comercial/metas',
        descricao: 'Metas comerciais e acompanhamento do realizado.', fonte: 'Metas da plataforma comercial',
      },
      {
        slug: 'academia', nome: 'Implantação e Academia We Make', status: 'ativo', href: '/academia/gestao',
        descricao: 'Painel Mestre, tarefas, quadro, calendário e agenda da implantação das escolas.', fonte: 'Academia We Make',
      },
      { slug: 'bi', nome: 'Indicadores e painéis de BI', status: 'em estruturação', href: '/dashboards', descricao: 'Painéis que cruzam receita, contratos, implantação e custo.' },
      { slug: 'governanca', nome: 'Governança e rotinas de reunião', status: 'em estruturação', descricao: 'Ritos semanais, mensais e anuais, com pauta e registro. Os ritos da Academia já estão no Workspace.' },
    ],
  },
]

export const TODAS_AREAS = GRUPOS_AREAS.flatMap(g => g.itens.map(i => ({ ...i, grupo: g.nome })))
