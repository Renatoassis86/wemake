import './ciclo-anual.css'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { moduloPermitido } from '@/lib/modulos'
import { MARCOS } from '@/lib/academia'
import { carregarAssinadas } from '@/lib/academia-comercial'
import { CicloAnualBoard, type CronogramaCard, type KanbanData, type StatusPorCard } from '@/components/academia/ciclo-anual/CicloAnualBoard'
import { VisaoGeralEscolas, type ResumoEscola } from '@/components/academia/ciclo-anual/VisaoGeralEscolas'
import { EscolaPicker } from '@/components/academia/ciclo-anual/EscolaPicker'

export const dynamic = 'force-dynamic'

export default async function CicloAnualPage({ searchParams }: { searchParams: Promise<{ escola?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !moduloPermitido('academia', user.email)) redirect('/academia')

  const { escola: escolaId } = await searchParams

  const admin = createAdminClient()
  const [{ data: cards }, { data: implantacoes }, escolas, { data: statusTodas }] = await Promise.all([
    admin.from('academia_cronograma_cards').select('id, momento, ordem, titulo, data_label, status_tag, descricao, fonte, marco, status_padrao')
      .eq('ativo', true).order('momento').order('ordem'),
    admin.from('academia_implantacoes').select('escola_nome, marcos').eq('arquivada', false),
    // As escolas da Academia são as que o Comercial marcou com contrato
    // assinado (não declinado) no funil de contratação — mesma fonte já
    // usada pelo "Trazer assinadas" do Painel Mestre. Não é a tabela
    // `escolas` crua: essa tem lead/prospecção/duplicata que nunca virou
    // parceria de verdade.
    carregarAssinadas(),
    // busca o status de TODAS as escolas de uma vez — alimenta tanto a visão
    // geral (resumo por escola) quanto o detalhe (filtra por escolaId em JS,
    // evita round-trip extra quando o usuário troca de escola). Uma linha
    // aqui é SEMPRE uma exceção: sem linha, vale o status_padrao do cartão.
    admin.from('academia_cronograma_status').select('card_id, escola_id, status, prazo_data, anotacoes'),
  ])

  const todosCards = (cards ?? []) as CronogramaCard[]
  const totalCards = todosCards.length

  // exceções por (escola, cartão) — só existe linha quando o status daquela
  // escola naquele cartão difere do padrão.
  const excecoes = new Map<string, { status: string; prazo_data: string | null; anotacoes: string }>()
  for (const s of statusTodas ?? []) excecoes.set(`${s.escola_id}:${s.card_id}`, { status: s.status, prazo_data: s.prazo_data, anotacoes: s.anotacoes ?? '' })

  // kanbanData['Handoff']['Concluído'] = ['Colégio X', ...] — alimenta o verso
  // de cada cartão ligado a um marco, com os nomes reais das escolas no Painel Mestre.
  const kanbanData: KanbanData = {}
  for (const impl of implantacoes ?? []) {
    const marcosEscola = (impl.marcos ?? {}) as Record<string, string>
    for (const [marco, status] of Object.entries(marcosEscola)) {
      kanbanData[marco] ??= {}
      kanbanData[marco][status] ??= []
      kanbanData[marco][status].push(impl.escola_nome)
    }
  }

  // resumo por escola, pra visão geral: progresso, pendências e o momento mais
  // avançado em que a escola já tem algum cartão em andamento ou concluído.
  // Passa por TODO cartão (não só exceções), já que o padrão conta pra todo mundo.
  const hoje = new Date().toISOString().slice(0, 10)
  const resumoPorEscola = new Map<string, ResumoEscola>()
  for (const e of escolas) {
    const r: ResumoEscola = { escolaId: e.id, nome: e.nome, cidadeUf: e.cidade_uf, concluidos: 0, emAndamento: 0, bloqueados: 0, naoIniciados: 0, proximoPrazo: null, atrasado: false, momentoAtual: 'conhecer' }
    for (const c of todosCards) {
      const exc = excecoes.get(`${e.id}:${c.id}`)
      const status = exc?.status ?? c.status_padrao
      if (status === 'Concluído') { r.concluidos++; r.momentoAtual = c.momento }
      else if (status === 'Bloqueado') r.bloqueados++
      else if (status !== 'Não iniciado') { r.emAndamento++; r.momentoAtual = c.momento }
      else r.naoIniciados++
      if (status !== 'Concluído' && exc?.prazo_data && (!r.proximoPrazo || exc.prazo_data < r.proximoPrazo)) {
        r.proximoPrazo = exc.prazo_data
        r.atrasado = exc.prazo_data < hoje
      }
    }
    resumoPorEscola.set(e.id, r)
  }

  // detalhe da escola selecionada: status efetivo (exceção ?? padrão) de cada
  // cartão, e qual cartão tem o próximo prazo a vencer.
  const statusPorCard: StatusPorCard = {}
  let proximoVencerId: string | null = null
  if (escolaId) {
    let menorData: string | null = null
    for (const c of todosCards) {
      const exc = excecoes.get(`${escolaId}:${c.id}`)
      statusPorCard[c.id] = { status: exc?.status ?? c.status_padrao, prazo_data: exc?.prazo_data ?? null, anotacoes: exc?.anotacoes ?? '' }
      if (statusPorCard[c.id].status !== 'Concluído' && exc?.prazo_data && (!menorData || exc.prazo_data < menorData)) {
        menorData = exc.prazo_data
        proximoVencerId = c.id
      }
    }
  }

  const escolaAtual = escolas.find(e => e.id === escolaId) ?? null

  return (
    <div className="ca-page">
      <div className="ca-head">
        <h1>Ciclo Anual por Escolas</h1>
        <p className="ca-lede">O cronograma de pós-venda da Academia We Make, do contrato assinado ao fechamento do ciclo, nos três momentos da jornada: Conhecer, Explorar e Criar — agora por escola, com status, prazo e anotações próprios de cada uma.</p>
        <p className="ca-hint">Escolha uma escola para ver e editar os cartões dela. Sem escola escolhida, veja o avanço de todas ao mesmo tempo. Para marcar uma etapa como feita para todas as escolas de uma vez — como "contratos enviados" — edite o cartão e mude o <b>status padrão</b>; só precisa editar escola por escola quando uma delas fugir da regra.</p>
      </div>

      <EscolaPicker escolas={escolas} atualId={escolaId ?? ''} />

      {escolaAtual ? (
        <CicloAnualBoard
          cards={todosCards}
          kanbanData={kanbanData}
          marcos={[...MARCOS]}
          escolaId={escolaAtual.id}
          escolaNome={escolaAtual.nome}
          statusPorCard={statusPorCard}
          proximoVencerId={proximoVencerId}
        />
      ) : (
        <VisaoGeralEscolas resumo={[...resumoPorEscola.values()]} totalCards={totalCards} />
      )}
    </div>
  )
}
