'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MARCOS } from '@/lib/academia'
import {
  fmtData, hojeISO, marcoAtual, percentual, prazoVencido, tarefasVencidas,
  type Implantacao, type Status, type Tarefa,
} from '@/lib/academia-gestao'
import { definirMarco, type Resultado } from '@/app/(dashboard)/academia/gestao/actions'
import { Aviso, Chip, useRun } from './ui'

const COLUNAS = [...MARCOS, 'Concluído'] as const
type Coluna = (typeof COLUNAS)[number]

function colunaDe(i: Implantacao): Coluna {
  return (marcoAtual(i) ?? 'Concluído') as Coluna
}

function diasEntre(aISO: string, bISO: string) {
  const a = new Date(aISO + 'T12:00:00')
  const b = new Date(bISO + 'T12:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** Nove pontos: um por marco, coloridos pelo status daquele marco nesta escola. */
function MiniProgresso({ marcos }: { marcos: Record<string, Status> }) {
  return (
    <ol className="ac-mini-prog" aria-label="Avanço por etapa">
      {MARCOS.map(m => {
        const s = marcos?.[m] ?? 'Não iniciado'
        return <li key={m} data-s={s} title={`${m}: ${s}`} />
      })}
    </ol>
  )
}

function Cartao({
  i, onMudou,
}: { i: Implantacao; onMudou: (id: string, patch: Record<string, Status>, justificativa?: string) => Promise<Resultado> }) {
  const { pending, erro, run } = useRun()
  const marco = marcoAtual(i)
  const pct = Math.round(percentual(i) * 100)
  const vencido = prazoVencido(i)
  const hoje = hojeISO()

  async function trocar(novoStatus: Status): Promise<Resultado> {
    if (!marco) return { ok: true }
    let r = await onMudou(i.id, { [marco]: novoStatus })
    if (!r.ok && r.erro.startsWith('JUSTIFICAR:')) {
      const just = window.prompt(r.erro.slice('JUSTIFICAR:'.length))
      if (!just?.trim()) return { ok: false, erro: 'Alteração cancelada: faltou a justificativa.' }
      r = await onMudou(i.id, { [marco]: novoStatus }, just.trim())
    }
    return r.ok ? r : { ok: false, erro: r.erro.replace(/^JUSTIFICAR:/, '') }
  }

  return (
    <li className={`ac-card ac-card--jornada${pending ? ' is-saving' : ''}`}>
      <p className="ac-card-t">
        <Link href={`/academia/gestao/escola/${i.id}`}>{i.escola_nome}</Link>
      </p>
      {i.cidade_uf ? <p className="ac-card-cidade">{i.cidade_uf}</p> : null}

      <MiniProgresso marcos={i.marcos} />
      <p className="ac-card-pct"><span className="ac-bar"><i style={{ width: `${pct}%` }} /></span> {pct}%</p>

      <p className="ac-card-f">
        <Chip s={i.risco} />
        {i.prioridade !== 'Normal' ? <b className="ac-prio" data-p={i.prioridade}>{i.prioridade}</b> : null}
        {i.prazo ? (
          <span className={vencido ? 'is-vencido' : undefined}>
            {vencido ? `Atrasada ${diasEntre(i.prazo, hoje)}d · ${fmtData(i.prazo)}` : `Prazo ${fmtData(i.prazo)}`}
          </span>
        ) : <span className="ac-sem-prazo">Sem prazo definido</span>}
      </p>

      {i.proxima_acao ? <p className="ac-card-acao">{i.proxima_acao}</p> : null}
      {i.responsavel_acao ? <p className="ac-card-resp">Resp.: {i.responsavel_acao}</p> : null}
      {i.motivo_bloqueio ? <p className="ac-card-bloqueio">{i.motivo_bloqueio}</p> : null}

      {marco ? (
        <select
          className="ac-card-mv" aria-label={`Status de “${marco}” para ${i.escola_nome}`}
          value={i.marcos?.[marco] ?? 'Não iniciado'}
          disabled={pending}
          onChange={e => run(() => trocar(e.target.value as Status))}
        >
          <option value="Não iniciado">Não iniciado</option>
          <option value="Em andamento">Em andamento</option>
          <option value="Aguardando escola">Aguardando escola</option>
          <option value="Aguardando We Make">Aguardando We Make</option>
          <option value="Bloqueado">Bloqueado</option>
          <option value="Concluído">Concluído — avançar etapa →</option>
        </select>
      ) : (
        <p className="ac-card-ok">Implantação concluída ✓</p>
      )}
      <Aviso erro={erro} />
    </li>
  )
}

export default function JornadaBoard({ implantacoes, tarefas }: { implantacoes: Implantacao[]; tarefas: Tarefa[] }) {
  // estado otimista: o cartão troca de coluna na hora; a action confirma em seguida
  const [overrides, setOverrides] = useState<Record<string, Record<string, Status>>>({})
  const vencidasPorEscola = useMemo(() => tarefasVencidas(tarefas), [tarefas])

  const efetivas = implantacoes.map(i => (overrides[i.id] ? { ...i, marcos: { ...i.marcos, ...overrides[i.id] } } : i))

  async function mudarMarco(id: string, patch: Record<string, Status>, justificativa?: string): Promise<Resultado> {
    setOverrides(o => ({ ...o, [id]: { ...(o[id] ?? {}), ...patch } }))
    const [[marco, status]] = Object.entries(patch)
    const r = await definirMarco(id, marco, status, justificativa)
    if (!r.ok) setOverrides(o => { const n = { ...o }; delete n[id]; return n })
    return r
  }

  const porColuna = new Map<Coluna, Implantacao[]>(COLUNAS.map(c => [c, []]))
  for (const i of efetivas) porColuna.get(colunaDe(i))!.push(i)
  for (const lista of porColuna.values()) {
    lista.sort((a, b) => {
      const av = prazoVencido(a) ? 0 : 1, bv = prazoVencido(b) ? 0 : 1
      if (av !== bv) return av - bv
      if (a.prazo && b.prazo) return a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0
      if (a.prazo) return -1
      if (b.prazo) return 1
      return a.escola_nome.localeCompare(b.escola_nome, 'pt-BR')
    })
  }

  return (
    <div className="ac-board ac-board--jornada" role="list">
      {COLUNAS.map(c => {
        const col = porColuna.get(c) ?? []
        const atrasadas = col.filter(i => prazoVencido(i) || vencidasPorEscola.has(i.id)).length
        return (
          <section key={c} role="listitem" className={`ac-col ac-col--jornada${c === 'Concluído' ? ' is-concluido' : ''}`}>
            <header>
              <h2>{c}</h2>
              <span>{col.length}{atrasadas ? <b className="ac-col-alerta"> · {atrasadas} atrasada{atrasadas > 1 ? 's' : ''}</b> : null}</span>
            </header>
            <ul>
              {col.map(i => <Cartao key={i.id} i={i} onMudou={mudarMarco} />)}
            </ul>
            {!col.length ? <p className="ac-col-vazio">Nenhuma escola.</p> : null}
          </section>
        )
      })}
    </div>
  )
}
