/**
 * followup.ts — uma linha por escola para acompanhamento comercial de
 * propostas já enviadas: dados de contato para retomar contato, e status da
 * negociação (da fonte real quando existe, ou a nota manual mais recente
 * quando não existe nenhum registro).
 *
 * Diferente de getFunilContratacao(): aquele só considera propostas ATIVAS
 * (arquivada_em IS NULL) porque mede o funil em andamento. Aqui a régua é
 * outra — "toda escola que recebeu proposta, alguma vez" — então a busca de
 * propostas não filtra arquivada_em, e getFunilContratacao() entra só como
 * enriquecimento (estágio do funil, última interação, contrato) quando a
 * escola também aparece lá.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarNomeEscola } from '@/lib/utils'
import { getFunilContratacao, FASE_LABELS } from '@/lib/funil-contratacao'

export interface FollowupLinha {
  [key: string]: unknown
  escolaId: string | null
  escolaNome: string
  cidade: string | null
  estado: string | null

  propostaId: string
  propostaData: string
  propostaStatus: string | null
  propostaArquivada: boolean

  alunos: number | null
  ticketMedio: number | null
  valorContrato: number | null
  valorContratoAssinado: boolean

  contatoNome: string | null
  email: string | null
  telefone: string | null

  statusAutomatico: string | null // vem do funil (estágio + última interação), somente leitura
  notaManual: string | null       // nota mais recente em notas_escola, editável quando não há status automático
}

export async function getFollowupPropostas(): Promise<FollowupLinha[]> {
  // notas_escola, escolas e propostas têm policy de SELECT restrita por
  // responsável/role no client comum (confirmado comparando o mesmo relatório
  // logado como gerente vs. usuario — os números batiam diferente) — aqui
  // precisamos do cross-escola completo, sempre igual pra qualquer usuário
  // que acesse a tela, então usa admin, mesmo padrão de
  // registros/negociacoes/contratos em funil-contratacao.ts.
  const admin = createAdminClient()

  const [{ data: propostasRaw }, { data: escolasRaw }, { data: notasRaw }, funil] = await Promise.all([
    admin
      .from('propostas')
      .select('id, escola_id, escola_nome, valor_aluno_ano, num_alunos, status, created_at, arquivada_em')
      .order('created_at', { ascending: false }),
    admin.from('escolas').select('id, nome, telefone, email, contato_nome, cidade, estado'),
    admin.from('notas_escola').select('escola_id, texto, created_at').order('created_at', { ascending: false }),
    getFunilContratacao(),
  ])

  const propostas = propostasRaw ?? []
  const escolas = escolasRaw ?? []
  const notas = notasRaw ?? []

  const escolaPorId = new Map(escolas.map(e => [e.id, e]))
  const escolaPorNome = new Map(escolas.map(e => [normalizarNomeEscola(e.nome), e]))
  const notaPorEscola = new Map<string, string>()
  for (const n of notas) if (n.escola_id && !notaPorEscola.has(n.escola_id)) notaPorEscola.set(n.escola_id, n.texto)
  const funilPorEscola = new Map(funil.linhas.map(l => [l.escola_id, l]))

  // Uma proposta por escola — a mais recente (propostas já vem ordenado desc).
  // Escolas sem escola_id vinculado (propostas antigas) caem pelo nome normalizado.
  const maisRecentePorEscola = new Map<string, typeof propostas[number]>()
  for (const p of propostas) {
    const chave = p.escola_id ?? (p.escola_nome ? `nome:${normalizarNomeEscola(p.escola_nome)}` : null)
    if (!chave) continue
    if (!maisRecentePorEscola.has(chave)) maisRecentePorEscola.set(chave, p)
  }

  function resumoAutomatico(escolaId: string): string | null {
    const linha = funilPorEscola.get(escolaId)
    if (!linha) return null
    const partes = [FASE_LABELS[linha.fase_funil]]
    if (linha.negociacao_observacoes) partes.push(linha.negociacao_observacoes)
    else if (linha.ultima_interacao) {
      const dias = Math.floor((Date.now() - new Date(linha.ultima_interacao).getTime()) / 86_400_000)
      partes.push(dias === 0 ? 'último contato hoje' : `último contato há ${dias} dia${dias === 1 ? '' : 's'}`)
    }
    return partes.join(' · ')
  }

  const linhas: FollowupLinha[] = []
  for (const p of maisRecentePorEscola.values()) {
    const escola = p.escola_id
      ? escolaPorId.get(p.escola_id)
      : (p.escola_nome ? escolaPorNome.get(normalizarNomeEscola(p.escola_nome)) : undefined)

    const escolaId = escola?.id ?? p.escola_id ?? null
    const linhaFunil = escolaId ? funilPorEscola.get(escolaId) : undefined

    const valorPotencial = (p.num_alunos ?? 0) * (p.valor_aluno_ano ?? 0)
    const temContratoAssinado = !!linhaFunil?.contrato_assinado
    const valorContrato = temContratoAssinado ? linhaFunil!.contrato_valor_total : (valorPotencial || null)

    linhas.push({
      escolaId,
      escolaNome: escola?.nome ?? p.escola_nome ?? 'Escola sem nome',
      cidade: escola?.cidade ?? linhaFunil?.cidade ?? null,
      estado: escola?.estado ?? linhaFunil?.estado ?? null,

      propostaId: p.id,
      propostaData: p.created_at,
      propostaStatus: p.status,
      propostaArquivada: p.arquivada_em != null,

      alunos: p.num_alunos,
      ticketMedio: p.valor_aluno_ano,
      valorContrato,
      valorContratoAssinado: temContratoAssinado,

      contatoNome: escola?.contato_nome ?? linhaFunil?.contato_nome ?? null,
      email: escola?.email ?? null,
      telefone: escola?.telefone ?? null,

      statusAutomatico: escolaId ? resumoAutomatico(escolaId) : null,
      notaManual: escolaId ? (notaPorEscola.get(escolaId) ?? null) : null,
    })
  }

  return linhas.sort((a, b) => new Date(b.propostaData).getTime() - new Date(a.propostaData).getTime())
}
