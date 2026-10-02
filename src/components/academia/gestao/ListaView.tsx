'use client'

import { useMemo, useState } from 'react'
import {
  PRIORIDADES, STATUS, fmtData, hojeISO, type Implantacao, type Prioridade, type Status, type Tarefa,
} from '@/lib/academia-gestao'
import { LISTAS, PASTAS } from '@/lib/academia-workspace'
import { atualizarTarefa, criarTarefa, excluirTarefa } from '@/app/(dashboard)/academia/gestao/actions'
import { Aviso, StatusSelect, useRun } from './ui'

function Linha({ t, escola, pessoas }: { t: Tarefa; escola?: string; pessoas: string[] }) {
  const { pending, erro, run } = useRun()
  const [titulo, setTitulo] = useState(t.titulo)
  const salvar = (patch: Record<string, unknown>) => run(() => atualizarTarefa(t.id, patch))
  const feita = t.status === 'Concluído'
  const vencida = !!t.prazo && t.prazo < hojeISO() && !feita

  return (
    <li className={`ac-task${feita ? ' is-done' : ''}${pending ? ' is-saving' : ''}`}>
      <input
        type="checkbox"
        className="ac-task-ck"
        checked={feita}
        aria-label={`Concluir: ${t.titulo}`}
        onChange={e => salvar({ status: e.target.checked ? 'Concluído' : 'Em andamento' })}
      />
      <div className="ac-task-main">
        <input
          className="ac-task-t"
          value={titulo}
          aria-label="Título da tarefa"
          onChange={e => setTitulo(e.target.value)}
          onBlur={() => { if (titulo.trim() && titulo !== t.titulo) salvar({ titulo }) }}
        />
        <div className="ac-task-meta">
          {escola ? <span className="ac-task-escola">{escola}</span> : null}
          <select className="ac-cell-in" value={t.prioridade} aria-label="Prioridade" onChange={e => salvar({ prioridade: e.target.value as Prioridade })}>
            {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
          </select>
          <input
            className="ac-cell-in" defaultValue={t.responsavel ?? ''} list="ac-pessoas-l" placeholder="Responsável" aria-label="Responsável"
            onBlur={e => { if (e.target.value !== (t.responsavel ?? '')) salvar({ responsavel: e.target.value }) }}
          />
          <input
            className={`ac-cell-in${vencida ? ' is-vencido' : ''}`} type="date" defaultValue={t.prazo ?? ''} aria-label="Prazo"
            onChange={e => salvar({ prazo: e.target.value })}
          />
        </div>
        <Aviso erro={erro} />
      </div>
      <StatusSelect value={t.status} onChange={s => salvar({ status: s })} />
      <button
        type="button" className="ac-x" aria-label={`Excluir: ${t.titulo}`}
        onClick={() => { if (confirm('Excluir esta tarefa?')) run(() => excluirTarefa(t.id)) }}
      >×</button>
    </li>
  )
}

function NovaTarefa({ implantacoes, escola }: { implantacoes: Implantacao[]; escola: string }) {
  const { pending, erro, run } = useRun()
  return (
    <form
      className="ac-quick"
      onSubmit={e => {
        e.preventDefault()
        const form = e.currentTarget
        run(() => criarTarefa(new FormData(form)), () => form.reset())
      }}
    >
      <select name="implantacao_id" defaultValue={escola} aria-label="Escola" required>
        <option value="">Escola…</option>
        {implantacoes.map(i => <option key={i.id} value={i.id}>{i.escola_nome}</option>)}
      </select>
      <select name="lista" aria-label="Lista" defaultValue="handoff" required>
        {PASTAS.map(p => (
          <optgroup key={p.slug} label={`${p.etapa}. ${p.nome}`}>
            {p.listas.map(l => <option key={l.slug} value={l.slug}>{l.nome}</option>)}
          </optgroup>
        ))}
      </select>
      <input name="titulo" placeholder="Nova tarefa…" required maxLength={300} aria-label="Título da nova tarefa" />
      <input name="prazo" type="date" aria-label="Prazo" />
      <button className="ac-btn" disabled={pending}>Adicionar</button>
      <Aviso erro={erro} />
    </form>
  )
}

export default function ListaView({ implantacoes, tarefas, pessoas }: { implantacoes: Implantacao[]; tarefas: Tarefa[]; pessoas: string[] }) {
  const [escola, setEscola] = useState('')
  const [status, setStatus] = useState<'' | Status>('')
  const [soAbertas, setSoAbertas] = useState(false)

  const nomes = useMemo(() => new Map(implantacoes.map(i => [i.id, i.escola_nome])), [implantacoes])
  const filtradas = tarefas.filter(t =>
    (!escola || t.implantacao_id === escola) && (!status || t.status === status) && (!soAbertas || t.status !== 'Concluído'),
  )

  return (
    <div>
      <datalist id="ac-pessoas-l">{pessoas.map(p => <option key={p} value={p} />)}</datalist>
      <div className="ac-filtros">
        <label><span>Escola</span>
          <select value={escola} onChange={e => setEscola(e.target.value)}>
            <option value="">Todas</option>
            {implantacoes.map(i => <option key={i.id} value={i.id}>{i.escola_nome}</option>)}
          </select>
        </label>
        <label><span>Status</span>
          <select value={status} onChange={e => setStatus(e.target.value as '' | Status)}>
            <option value="">Todos</option>
            {STATUS.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="ac-check"><input type="checkbox" checked={soAbertas} onChange={e => setSoAbertas(e.target.checked)} /><span>Só em aberto</span></label>
        <span className="ac-contagem">{filtradas.length} de {tarefas.length} tarefas</span>
      </div>

      <NovaTarefa implantacoes={implantacoes} escola={escola} />

      {PASTAS.map(p => {
        const doGrupo = p.listas.map(l => ({ l, itens: filtradas.filter(t => t.lista === l.slug) }))
        if (!doGrupo.some(g => g.itens.length)) return null
        return (
          <section key={p.slug} className="ac-folder">
            <h2 className="ac-folder-t"><span>{p.etapa}</span>{p.nome}</h2>
            {doGrupo.map(({ l, itens }) => itens.length ? (
              <div key={l.slug} className="ac-lst">
                <h3 className="ac-lst-t">{l.nome} <small>{itens.filter(t => t.status === 'Concluído').length}/{itens.length}</small></h3>
                <ul>
                  {itens.map(t => <Linha key={t.id} t={t} escola={escola ? undefined : nomes.get(t.implantacao_id ?? '')} pessoas={pessoas} />)}
                </ul>
              </div>
            ) : null)}
          </section>
        )
      })}

      {!filtradas.length ? (
        <p className="ac-vazio">
          {tarefas.length ? 'Nenhuma tarefa com esses filtros.' : `Ainda não há tarefas. Cadastre uma escola com “criar tarefas-modelo” marcado ou use “Gerar tarefas” no Painel. As ${LISTAS.reduce((n, l) => n + l.tarefas.length, 0)} tarefas-modelo vêm dos documentos.`}
        </p>
      ) : null}
    </div>
  )
}
