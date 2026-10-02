import { carregarGestao } from '@/lib/academia-data'
import QuadroView from '@/components/academia/gestao/QuadroView'
import SetupNotice from '@/components/academia/gestao/SetupNotice'

export const dynamic = 'force-dynamic'

export default async function QuadroPage() {
  const d = await carregarGestao()
  if (d.setup || d.erro) return <SetupNotice erro={d.erro} />
  return (
    <>
      <h2 className="ac-h3">Quadro por status</h2>
      <p className="ac-sec-lead">
        As seis colunas são os status oficiais do Painel Mestre. “Aguardando escola” e “Aguardando We Make” tornam explícita a
        dependência atual; “Bloqueado” é só para impedimento real.
      </p>
      <QuadroView implantacoes={d.implantacoes.filter(i => !i.arquivada)} tarefas={d.tarefas} />
    </>
  )
}
