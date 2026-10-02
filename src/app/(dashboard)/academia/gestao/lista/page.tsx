import { carregarGestao } from '@/lib/academia-data'
import ListaView from '@/components/academia/gestao/ListaView'
import SetupNotice from '@/components/academia/gestao/SetupNotice'

export const dynamic = 'force-dynamic'

export default async function ListaPage() {
  const d = await carregarGestao()
  if (d.setup || d.erro) return <SetupNotice erro={d.erro} />
  return (
    <>
      <h2 className="ac-h3">Lista de tarefas</h2>
      <p className="ac-sec-lead">
        Espaço, pastas e listas seguem as macroetapas do Manual Operacional. Marque como concluída, troque o status, o
        responsável e o prazo direto na linha.
      </p>
      <ListaView implantacoes={d.implantacoes.filter(i => !i.arquivada)} tarefas={d.tarefas} pessoas={d.pessoas.map(p => p.nome)} />
    </>
  )
}
