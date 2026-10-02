'use client'

import { useRef, useState } from 'react'
import { TIPOS_EVENTO, type Implantacao } from '@/lib/academia-gestao'
import { criarEvento, excluirEvento, gerarTarefas } from '@/app/(dashboard)/academia/gestao/actions'
import { Aviso, useRun } from './ui'

export function NovoEventoForm({
  implantacoes, pessoas, inicial,
}: { implantacoes: Implantacao[]; pessoas: string[]; inicial?: { titulo?: string; tipo?: string; minutos?: number } }) {
  const ref = useRef<HTMLFormElement>(null)
  const [aberto, setAberto] = useState(false)
  const { pending, erro, msg, run } = useRun()

  if (!aberto) {
    return <button type="button" className="ac-btn" onClick={() => setAberto(true)}>+ Novo compromisso</button>
  }
  return (
    <form
      ref={ref}
      className="ac-form"
      onSubmit={e => {
        e.preventDefault()
        run(() => criarEvento(new FormData(e.currentTarget)), () => { ref.current?.reset(); setAberto(false) })
      }}
    >
      <h3 className="ac-form-t">Novo compromisso</h3>
      <div className="ac-form-g">
        <label><span>Título</span><input name="titulo" required maxLength={200} defaultValue={inicial?.titulo} /></label>
        <label><span>Tipo</span>
          <select name="tipo" defaultValue={inicial?.tipo ?? 'Reunião'}>{TIPOS_EVENTO.map(t => <option key={t}>{t}</option>)}</select>
        </label>
        <label><span>Dia</span><input type="date" name="dia" required /></label>
        <label><span>Início</span><input type="time" name="hora_inicio" defaultValue="09:00" /></label>
        <label><span>Fim</span><input type="time" name="hora_fim" /></label>
        <label><span>Escola</span>
          <select name="implantacao_id" defaultValue="">
            <option value="">— nenhuma —</option>
            {implantacoes.map(i => <option key={i.id} value={i.id}>{i.escola_nome}</option>)}
          </select>
        </label>
        <label><span>Responsável</span>
          <input name="responsavel" list="ac-pessoas-ev" maxLength={120} />
          <datalist id="ac-pessoas-ev">{pessoas.map(p => <option key={p} value={p} />)}</datalist>
        </label>
        <label><span>Local</span><input name="local" maxLength={160} /></label>
      </div>
      <label className="ac-form-b"><span>Notas</span><textarea name="notas" rows={2} maxLength={1500} /></label>
      <Aviso erro={erro} msg={msg} />
      <div className="ac-form-a">
        <button className="ac-btn" disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="ac-btn is-ghost" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </form>
  )
}

export function ExcluirEventoBtn({ id, titulo }: { id: string; titulo: string }) {
  const { pending, erro, run } = useRun()
  return (
    <>
      <button
        type="button" className="ac-x" disabled={pending} aria-label={`Excluir compromisso: ${titulo}`}
        onClick={() => { if (confirm('Excluir este compromisso?')) run(() => excluirEvento(id)) }}
      >×</button>
      <Aviso erro={erro} />
    </>
  )
}

export function GerarTarefasPanel({ implantacoes }: { implantacoes: Implantacao[] }) {
  const [id, setId] = useState('')
  const { pending, erro, msg, run } = useRun()
  return (
    <div className="ac-gerar">
      <label>
        <span>Escola</span>
        <select value={id} onChange={e => setId(e.target.value)}>
          <option value="">Escolha…</option>
          {implantacoes.map(i => <option key={i.id} value={i.id}>{i.escola_nome}</option>)}
        </select>
      </label>
      <button type="button" className="ac-btn" disabled={!id || pending} onClick={() => run(() => gerarTarefas(id))}>
        {pending ? 'Gerando…' : 'Gerar tarefas-modelo'}
      </button>
      <Aviso erro={erro} msg={msg} />
    </div>
  )
}
