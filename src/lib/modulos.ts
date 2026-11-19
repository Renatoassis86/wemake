/**
 * Módulos da plataforma We Make: o que cada um representa, quais páginas tem e quem acessa.
 * A regra de acesso é aplicada no middleware (src/middleware.ts), então vale para páginas e ações.
 * Este arquivo não pode importar nada do Node: o middleware roda no Edge.
 */

export type ModuloSlug = 'administrativo' | 'financeiro' | 'comercial' | 'contratos' | 'academia' | 'pedidos' | 'projetos'

export interface PaginaModulo {
  nome: string
  descricao: string
  href?: string
  status: 'disponível' | 'em estruturação'
  /** chave pro ícone na barra lateral (ver ICONES_PAGINA em SidebarContextual.tsx) — string, não componente, pra não puxar lucide-react pro bundle do middleware (roda no Edge) */
  icone?: string
  /** nome da subseção que agrupa esta página na barra lateral (ex.: "Orçamento") — páginas sem grupo ficam soltas, como sempre foi */
  grupo?: string
}

export interface Modulo {
  slug: ModuloSlug
  nome: string
  curto: string
  eyebrow: string
  descricao: string
  /** texto em destaque na página do módulo */
  deck: string
  paginas: PaginaModulo[]
  /** primeira página depois do login */
  home: string
  /** prefixos de rota protegidos por este módulo */
  prefixos: string[]
}

/** Direção: Dênis (contato@wemake.tec.br) e Renato. */
const DIRECAO = ['contato@wemake.tec.br', 'renato086@gmail.com']
/** Academia: direção + Emanuel + Gabi (arquiteta). */
const ACADEMIA = [...DIRECAO, 'epcri1966@gmail.com', 'gabi@wemake.tec.br']

/** Lista de e-mails de cada módulo. `todos` = qualquer usuário ativo. Sobrescreve por env ACESSO_<MODULO>=a@x,b@y */
const PADRAO: Record<ModuloSlug, string[] | 'todos'> = {
  comercial: 'todos',
  administrativo: DIRECAO,
  financeiro: DIRECAO,
  contratos: DIRECAO,
  pedidos: DIRECAO,
  academia: ACADEMIA,
  projetos: 'todos',
}

export function emailsDoModulo(slug: ModuloSlug): string[] | 'todos' {
  const env = process.env[`ACESSO_${slug.toUpperCase()}`]
  if (env) return env.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const p = PADRAO[slug]
  return p === 'todos' ? p : p.map(e => e.toLowerCase())
}

export function moduloPermitido(slug: ModuloSlug, email: string | null | undefined) {
  const lista = emailsDoModulo(slug)
  if (lista === 'todos') return true
  return !!email && lista.includes(email.toLowerCase())
}

export function modulosDoUsuario(email: string | null | undefined): ModuloSlug[] {
  return MODULOS.filter(m => moduloPermitido(m.slug, email)).map(m => m.slug)
}

export const MODULOS: Modulo[] = [
  {
    slug: 'administrativo',
    nome: 'Gestão Administrativa',
    curto: 'Administrativa',
    eyebrow: 'Gestão administrativa',
    deck: 'A operação interna da We Make.',
    descricao:
      'Reúne contabilidade e obrigações, pessoas e folha, compras e fornecedores, estoque e patrimônio, agenda da equipe, metas e as rotinas de governança.',
    home: '/administrativo',
    prefixos: ['/administrativo'],
    paginas: [
      { nome: 'Visão geral', descricao: 'As áreas administrativas e o que já está disponível em cada uma.', href: '/administrativo', status: 'disponível', icone: 'dashboard' },
      { nome: 'Contabilidade e obrigações fiscais', descricao: 'Calendário de obrigações e documentos para o contador.', status: 'em estruturação', icone: 'contabilidade' },
      { nome: 'Pessoas, folha e benefícios', descricao: 'Equipe, contratos de trabalho e folha.', status: 'em estruturação', icone: 'pessoas' },
      { nome: 'Compras e fornecedores', descricao: 'Cadastro de fornecedores, pedidos de compra e cotações.', status: 'em estruturação', icone: 'compras' },
      { nome: 'Estoque, patrimônio e comodato', descricao: 'Equipamentos em comodato, inventário e reposição dos espaços maker.', href: '/estoque', status: 'em estruturação', icone: 'estoque' },
      { nome: 'Agenda, viagens e diárias', descricao: 'Agenda da equipe. Viagens e diárias ainda não têm controle próprio.', href: '/agenda', status: 'disponível', icone: 'agenda' },
      { nome: 'Metas e resultados', descricao: 'Metas comerciais e acompanhamento do realizado.', href: '/comercial/metas', status: 'disponível', icone: 'metas' },
      { nome: 'Governança e rotinas de reunião', descricao: 'Ritos semanais, mensais e anuais, com pauta e registro.', status: 'em estruturação', icone: 'governanca' },
    ],
  },
  {
    slug: 'financeiro',
    nome: 'Gestão Financeira',
    curto: 'Financeira',
    eyebrow: 'Gestão financeira',
    deck: 'Entradas, saídas e situação do caixa.',
    descricao:
      'Acompanha o dinheiro da We Make: a receita que os contratos garantem, o que há para receber e pagar, o fluxo de caixa, o faturamento e o planejamento do ano.',
    home: '/financeiro',
    prefixos: ['/financeiro'],
    paginas: [
      { nome: 'Visão geral', descricao: 'Indicadores de receita contratada e as áreas financeiras.', href: '/financeiro', status: 'disponível', icone: 'dashboard' },
      { nome: 'Receita contratada', descricao: 'Receita anual e mensal de cada escola, calculada pelos contratos e pela quantidade de alunos.', href: '/financeiro/receita', status: 'disponível', icone: 'receita' },
      { nome: 'Contas a receber e cobrança', descricao: 'Parcelas esperadas, recebidas e em atraso por escola.', status: 'em estruturação', icone: 'a-receber' },
      { nome: 'Contas a pagar', descricao: 'Compromissos com fornecedores, equipe e impostos, com vencimento e situação.', status: 'em estruturação', icone: 'a-pagar' },
      { nome: 'Fluxo de caixa e conciliação bancária', descricao: 'Saldo projetado e realizado, conciliado com o extrato.', status: 'em estruturação', icone: 'fluxo-caixa' },
      { nome: 'Faturamento e notas fiscais', descricao: 'Emissão e controle das notas por contrato.', status: 'em estruturação', icone: 'notas-fiscais' },
      { nome: 'Receitas', descricao: 'Previsão e execução de receita por escola, em categorias de até 6 níveis.', href: '/financeiro/orcamento/receitas', status: 'disponível', icone: 'orcamento-receita', grupo: 'Orçamento' },
      { nome: 'Despesas', descricao: 'Previsão e execução de despesa por categoria, do macro ao micro.', href: '/financeiro/orcamento/despesas', status: 'disponível', icone: 'orcamento-despesa', grupo: 'Orçamento' },
      { nome: 'Proposta Orçamentária 2027', descricao: 'O consolidado de receita e despesa pra fechar a proposta do ano.', href: '/financeiro/orcamento/proposta', status: 'disponível', icone: 'proposta', grupo: 'Orçamento' },
      { nome: 'Gestão Orçamentária', descricao: 'Previsto x realizado, remanejamentos, fluxo de caixa e indicadores financeiros.', href: '/financeiro/orcamento/gestao', status: 'em estruturação', icone: 'gestao-orcamentaria', grupo: 'Orçamento' },
      { nome: 'Quantidade de alunos', descricao: 'Alunos por série em cada escola parceira, espelhado da Gestão Comercial, e pedido de livro pra gráfica.', href: '/financeiro/quantidade-alunos', status: 'disponível', icone: 'alunos' },
      { nome: 'Centros de custo', descricao: 'Custo por frente, inclusive o centro de custo Academia proposto na Arquitetura de Processos.', status: 'em estruturação', icone: 'centros-custo' },
    ],
  },
  {
    slug: 'comercial',
    nome: 'Gestão Comercial',
    curto: 'Comercial',
    eyebrow: 'Gestão comercial',
    deck: 'Escolas, negociações e indicadores comerciais em tempo real.',
    descricao:
      'A ferramenta da equipe comercial: cadastro de escolas, pipeline, registros de negociação, propostas, jornada contratual, metas e dashboard.',
    home: '/comercial',
    prefixos: [],
    paginas: [
      { nome: 'Dashboard', descricao: 'Indicadores comerciais e visão geral das escolas.', href: '/comercial', status: 'disponível', icone: 'dashboard' },
      { nome: 'Escolas', descricao: 'Cadastro e histórico de cada escola parceira ou em prospecção.', href: '/comercial/escolas', status: 'disponível', icone: 'escolas' },
      { nome: 'Registros', descricao: 'Interações e contatos com as escolas.', href: '/comercial/registros', status: 'disponível', icone: 'registros' },
      { nome: 'Pipeline', descricao: 'Negociações por etapa, em quadro.', href: '/comercial/pipeline', status: 'disponível', icone: 'pipeline' },
      { nome: 'Propostas', descricao: 'Propostas comerciais enviadas e seu andamento.', href: '/comercial/propostas', status: 'disponível', icone: 'proposta' },
      { nome: 'Metas', descricao: 'Metas comerciais e acompanhamento do realizado.', href: '/comercial/metas', status: 'disponível', icone: 'metas' },
      { nome: 'Calculadora', descricao: 'Simulação de valores de proposta.', href: '/calculadora', status: 'disponível', icone: 'calculadora' },
      { nome: 'Agenda e transcrições', descricao: 'Compromissos da equipe e transcrições de reuniões.', href: '/agenda', status: 'disponível', icone: 'agenda' },
    ],
  },
  {
    slug: 'contratos',
    nome: 'Gestão de Contratos',
    curto: 'Contratos',
    eyebrow: 'Gestão de contratos',
    deck: 'Da minuta à assinatura, todos os contratos num só lugar.',
    descricao:
      'Acompanha a documentação contratual de cada escola: minutas, assinaturas, arquivos e prazos. A jornada contratual usada pela equipe comercial continua disponível para ela; aqui fica a visão de gestão.',
    home: '/contratos',
    prefixos: ['/contratos'],
    paginas: [
      { nome: 'Visão geral', descricao: 'Dashboard de indicadores: receita contratada, mapa por estado, modelo comercial, renovações e cláusulas especiais.', href: '/contratos', status: 'disponível', icone: 'dashboard' },
      { nome: 'Jornada contratual', descricao: 'Minuta, retorno, envio e assinatura de cada contrato, com os arquivos da escola.', href: '/comercial/contratos', status: 'disponível', icone: 'jornada' },
      { nome: 'Dados dos Contratos', descricao: 'Dados sistematizados de cada contrato assinado, com visualização do documento original.', href: '/contratos/dados', status: 'disponível', icone: 'contratos-dados' },
      { nome: 'Modelos e minutas', descricao: 'Modelos de contrato reutilizáveis.', status: 'em estruturação', icone: 'modelos' },
      { nome: 'Assinatura eletrônica', descricao: 'Envio e acompanhamento de assinaturas.', status: 'em estruturação', icone: 'assinatura' },
      { nome: 'Certidões e documentos', descricao: 'Certidões e documentos jurídicos da empresa e das escolas.', status: 'em estruturação', icone: 'certidoes' },
    ],
  },
  {
    slug: 'academia',
    nome: 'Academia We Make',
    curto: 'Academia We Make',
    eyebrow: 'Academia We Make',
    deck: 'A jornada de implantação da escola parceira, do contrato ao acompanhamento anual.',
    descricao:
      'Os processos da implantação, cada um com a sua página, e a gestão do dia a dia: Painel Mestre, tarefas, quadro, calendário, agenda e o Diagnóstico do Espaço Maker respondido pelas escolas.',
    home: '/academia',
    prefixos: ['/academia'],
    paginas: [
      { nome: 'Documentos e processos', descricao: 'As 14 páginas dos processos, com o texto integral de cada documento.', href: '/academia', status: 'disponível' },
      { nome: 'Gestão da implantação', descricao: 'Painel Mestre, lista de tarefas, quadro, calendário, agenda e workspace.', href: '/academia/gestao', status: 'disponível' },
      { nome: 'Diagnósticos das escolas', descricao: 'Respostas, fotos e parecer do Diagnóstico do Espaço Maker.', href: '/academia/gestao/diagnosticos', status: 'disponível' },
      { nome: 'Lista de produtos', descricao: 'Catálogo mestre do Diagnóstico do Espaço Maker — nome, descrição, link e preço, iguais pra toda escola.', href: '/academia/gestao/produtos', status: 'disponível' },
    ],
  },
  {
    slug: 'projetos',
    nome: 'Gestão de Projetos',
    curto: 'Projetos',
    eyebrow: 'Gestão de projetos',
    deck: 'Quadro kanban para organizar o que está pendente em cada frente.',
    descricao:
      'Um quadro estilo Trello para centralizar tarefas, prazos e responsáveis — o que está pendente, em andamento e concluído, com tags e prioridade.',
    home: '/projetos',
    prefixos: ['/projetos'],
    paginas: [
      { nome: 'Quadro', descricao: 'Quadro kanban com as tarefas, arrastar entre colunas, tags e prioridade.', href: '/projetos', status: 'disponível', icone: 'quadro' },
    ],
  },
  {
    slug: 'pedidos',
    nome: 'Gestão de Pedidos',
    curto: 'Pedidos',
    eyebrow: 'Gestão de pedidos',
    deck: 'Os pedidos das escolas parceiras, do registro à entrega.',
    descricao:
      'Acompanha os pedidos feitos pelas escolas parceiras: o que foi pedido, em que etapa está e quando chega. O módulo está em estruturação.',
    home: '/pedidos',
    prefixos: ['/pedidos'],
    paginas: [
      { nome: 'Visão geral', descricao: 'Resumo dos pedidos e o que já está disponível.', href: '/pedidos', status: 'disponível', icone: 'dashboard' },
      { nome: 'Pedidos das escolas', descricao: 'Registro e acompanhamento de cada pedido.', status: 'em estruturação', icone: 'pedidos' },
      { nome: 'Status e entregas', descricao: 'Em que etapa está cada pedido e a previsão de entrega.', status: 'em estruturação', icone: 'entregas' },
    ],
  },
]

export const getModulo = (slug: string) => MODULOS.find(m => m.slug === slug)

/** Qual módulo protege este caminho? (comercial e rotas antigas não têm prefixo: ficam abertas a todos os logados) */
export function moduloDoCaminho(pathname: string): ModuloSlug | null {
  for (const m of MODULOS) {
    if (m.prefixos.some(p => pathname === p || pathname.startsWith(p + '/'))) return m.slug
  }
  return null
}
