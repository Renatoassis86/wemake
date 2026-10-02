import { carregarGestao } from '@/lib/academia-data'
import { addDias, fmtData, fmtHora, hojeISO } from '@/lib/academia-gestao'
import { getLista } from '@/lib/academia-workspace'
import SetupNotice from '@/components/academia/gestao/SetupNotice'
import { NovoEventoForm, ExcluirEventoBtn } from '@/components/academia/gestao/AgendaForms'
import { Chip } from '@/components/academia/gestao/ui'

export const dynamic = 'force-dynamic'

const diaSemana = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })

type Item = { k: 'tarefa' | 'evento'; id: string; titulo: string; sub: string; quando: string; status?: string }

export default async function AgendaPage() {
  const d = await carregarGestao()
  if (d.setup || d.erro) return <SetupNotice erro={d.erro} />

  const hoje = hojeISO()
  const limite = addDias(hoje, 60)
  const nomes = new Map(d.implantacoes.map(i => [i.id, i.escola_nome]))
  const atrasadas = d.tarefas.filter(t => t.prazo && t.prazo < hoje && t.status !== 'Concluído')

  const dias = new Map<string, Item[]>()
  const add = (dia: string, it: Item) => dias.set(dia, [...(dias.get(dia) ?? []), it])
  d.tarefas
    .filter(t => t.prazo && t.prazo >= hoje && t.prazo <= limite && t.status !== 'Concluído')
    .forEach(t =>
      add(t.prazo as string, {
        k: 'tarefa', id: t.id, titulo: t.titulo, quando: 'Prazo', status: t.status,
        sub: `${nomes.get(t.implantacao_id ?? '') ?? 'Sem escola'} · ${getLista(t.lista)?.nome ?? ''}`,
      }),
    )
  d.eventos.forEach(e => {
    const dia = new Date(new Date(e.inicio).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10)
    if (dia >= hoje && dia <= limite) {
      add(dia, {
        k: 'evento', id: e.id, titulo: e.titulo, quando: fmtHora(e.inicio),
        sub: [e.tipo, e.implantacao_id ? nomes.get(e.implantacao_id) : null, e.local, e.responsavel].filter(Boolean).join(' · '),
      })
    }
  })
  const ordenados = [...dias.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <>
      <div className="ac-sec-linha">
        <h2 className="ac-h3" style={{ margin: 0 }}>Agenda: próximos 60 dias</h2>
        <NovoEventoForm implantacoes={d.implantacoes.filter(i => !i.arquivada)} pessoas={d.pessoas.map(p => p.nome)} />
      </div>

      {atrasadas.length ? (
        <section className="ac-agenda-atraso" aria-labelledby="atraso-t">
          <h3 id="atraso-t" className="ac-minor">Atrasadas ({atrasadas.length})</h3>
          <ul className="ac-agenda-l">
            {atrasadas.map(t => (
              <li key={t.id}>
                <span className="ac-ag-q is-vencido">{fmtData(t.prazo)}</span>
                <div><p>{t.titulo}</p><small>{nomes.get(t.implantacao_id ?? '') ?? 'Sem escola'} · {getLista(t.lista)?.nome}</small></div>
                <Chip s={t.status} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {ordenados.length ? ordenados.map(([dia, itens]) => (
        <section key={dia} className="ac-agenda-dia">
          <h3 className="ac-agenda-h"><span>{fmtData(dia).slice(0, 5)}</span> {diaSemana(dia)}{dia === hoje ? ' · hoje' : ''}</h3>
          <ul className="ac-agenda-l">
            {itens.map(it => (
              <li key={it.k + it.id}>
                <span className="ac-ag-q">{it.quando}</span>
                <div><p>{it.titulo}</p><small>{it.sub}</small></div>
                {it.k === 'evento' ? <ExcluirEventoBtn id={it.id} titulo={it.titulo} /> : it.status ? <Chip s={it.status} /> : null}
              </li>
            ))}
          </ul>
        </section>
      )) : <p className="ac-vazio">Nada agendado nos próximos 60 dias. Os prazos das tarefas e os compromissos aparecem aqui.</p>}
    </>
  )
}
