import { carregarGestao } from '@/lib/academia-data'
import JornadaBoard from '@/components/academia/gestao/JornadaBoard'
import SetupNotice from '@/components/academia/gestao/SetupNotice'

export const dynamic = 'force-dynamic'

export default async function JornadaPage() {
  const d = await carregarGestao()
  if (d.setup || d.erro) return <SetupNotice erro={d.erro} />
  const ativas = d.implantacoes.filter(i => !i.arquivada)
  return (
    <>
      <h2 className="ac-h3">Jornada por escola</h2>
      <p className="ac-sec-lead">
        Cada cartão é uma escola, na coluna da etapa em que ela está agora. “Concluído” junta quem já terminou as nove
        etapas. Avance a etapa pelo seletor do cartão; prazo vencido ou tarefa em aberto entra como atraso.
      </p>
      <JornadaBoard implantacoes={ativas} tarefas={d.tarefas} />
    </>
  )
}
