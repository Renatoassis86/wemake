'use client'

import { useMemo, useState } from 'react'
import { STATUS, STATUS_AJUDA, fmtData, hojeISO, type Implantacao, type Status, type Tarefa } from '@/lib/academia-gestao'
import { getLista, LISTAS } from '@/lib/academia-workspace'
import { atualizarTarefa } from '@/app/(dashboard)/academia/gestao/actions'
import { Aviso, useRun } from './ui'

export default function QuadroView({ implantacoes, tarefas }: { implantacoes: Implantacao[]; tarefas: Tarefa[] }) {
  const { erro, run } = useRun()
  const [escola, setEscola] = useState('')
  const [lista, setLista] = useState('')
  // estado otimista: o card muda de coluna na hora e a action confirma em seguida
  const [movidas, setMovidas] = useState<Record<string, Status>>({})
  const [sobre, setSobre] = useState<Status | null>(null)
  const nomes = useMemo(() => new Map(implantacoes.map(i => [i.id, i.escola_nome])), [implantacoes])

  const visiveis = tarefas
    .map(t => ({ ...t, status: movidas[t.id] ?? t.status }))
    .filter(t => (!escola || t.implantacao_id === escola) && (!lista || t.lista === lista))

  function mover(id: string, destino: Status) {
    setMovidas(m => ({ ...m, [id]: destino }))
    run(() => atualizarTarefa(id, { status: destino }), () => setMovidas(m => { const n = { ...m }; delete n[id]; return n }))
  }

  return (
    <div>
      <div className="ac-filtros">
        <label><span>Escola</span>
          <select value={escola} onChange={e => setEscola(e.target.value)}>
            <option value="">Todas</option>
            {implantacoes.map(i => <option key={i.id} value={i.id}>{i.escola_nome}</option>)}
          </select>
        </label>
        <label><span>Lista</span>
          <select value={lista} onChange={e => setLista(e.target.value)}>
            <option value="">Todas</option>
            {LISTAS.map(l => <option key={l.slug} value={l.slug}>{l.nome}</option>)}
          </select>
        </label>
        <span className="ac-contagem">{visiveis.length} tarefas · arraste os cartões entre as colunas</span>
      </div>
      <Aviso erro={erro} />

      <div className="ac-board" role="list">
        {STATUS.map(s => {
          const col = visiveis.filter(t => t.status === s)
          return (
            <section
              key={s}
              role="listitem"
              className={`ac-col${sobre === s ? ' is-over' : ''}`}
              data-s={s}
              onDragOver={e => { e.preventDefault(); setSobre(s) }}
              onDragLeave={() => setSobre(x => (x === s ? null : x))}
              onDrop={e => {
                e.preventDefault()
                setSobre(null)
                const id = e.dataTransfer.getData('text/plain')
                if (id) mover(id, s)
              }}
            >
              <header title={STATUS_AJUDA[s]}>
                <h2>{s}</h2>
                <span>{col.length}</span>
              </header>
              <ul>
                {col.map(t => {
                  const vencida = !!t.prazo && t.prazo < hojeISO() && t.status !== 'Concluído'
                  return (
                    <li
                      key={t.id}
                      className="ac-card"
                      draggable
                      onDragStart={e => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move' }}
                    >
                      <p className="ac-card-t">{t.titulo}</p>
                      <p className="ac-card-m">
                        <span>{nomes.get(t.implantacao_id ?? '') ?? 'Sem escola'}</span>
                        <span>{getLista(t.lista)?.nome}</span>
                      </p>
                      <p className="ac-card-f">
                        {t.prioridade !== 'Normal' ? <b className="ac-prio" data-p={t.prioridade}>{t.prioridade}</b> : null}
                        {t.prazo ? <span className={vencida ? 'is-vencido' : undefined}>{fmtData(t.prazo)}</span> : null}
                        {t.responsavel ? <span>{t.responsavel}</span> : null}
                      </p>
                      <select
                        className="ac-card-mv" aria-label={`Mover “${t.titulo}” para`} value={t.status}
                        onChange={e => mover(t.id, e.target.value as Status)}
                      >
                        {STATUS.map(x => <option key={x}>{x}</option>)}
                      </select>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
