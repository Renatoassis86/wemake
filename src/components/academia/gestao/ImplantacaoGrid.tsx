'use client'

import { useState } from 'react'
import { MARCOS } from '@/lib/academia'
import {
  PRIORIDADES, RISCOS, exigeMotivo, fmtData, percentual, prazoVencido,
  type Implantacao, type Prioridade, type Risco, type Status,
} from '@/lib/academia-gestao'
import { atualizarImplantacao, definirMarco, gerarTarefas } from '@/app/(dashboard)/academia/gestao/actions'
import { Aviso, StatusSelect, useRun } from './ui'

/** Campo de texto que só grava quando perde o foco e o valor mudou. */
function Campo({
  valor, onSalvar, tipo = 'text', rotulo, lista, largura,
}: { valor: string | null; onSalvar: (v: string) => void; tipo?: 'text' | 'date'; rotulo: string; lista?: string; largura?: number }) {
  const [v, setV] = useState(valor ?? '')
  return (
    <input
      className="ac-cell-in"
      type={tipo}
      value={v}
      list={lista}
      aria-label={rotulo}
      style={largura ? { minWidth: largura } : undefined}
      onChange={e => setV(e.target.value)}
      onBlur={() => { if (v !== (valor ?? '')) onSalvar(v) }}
    />
  )
}

function Linha({ i, pessoas }: { i: Implantacao; pessoas: string[] }) {
  const { pending, erro, msg, run } = useRun()
  const pct = Math.round(percentual(i) * 100)
  const motivoPendente = exigeMotivo(i) && !i.motivo_bloqueio
  const salvar = (patch: Record<string, unknown>) => run(() => atualizarImplantacao(i.id, patch))

  return (
    <tr className={pending ? 'is-saving' : undefined}>
      <th scope="row" className="ac-grid-escola">
        <Campo valor={i.escola_nome} rotulo="Escola" onSalvar={v => salvar({ escola_nome: v })} />
        <Campo valor={i.cidade_uf} rotulo="Cidade/UF" onSalvar={v => salvar({ cidade_uf: v })} />
        <Aviso erro={erro} msg={msg} />
      </th>
      <td><Campo valor={i.responsavel} rotulo="Responsável We Make" lista="ac-pessoas" onSalvar={v => salvar({ responsavel: v })} /></td>
      <td>
        <select className="ac-cell-in" value={i.prioridade} aria-label="Prioridade" onChange={e => salvar({ prioridade: e.target.value as Prioridade })}>
          {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
        </select>
      </td>
      {MARCOS.map(m => (
        <td key={m} className="ac-grid-marco">
          <StatusSelect
            value={(i.marcos?.[m] ?? 'Não iniciado') as Status}
            label={m}
            onChange={s => run(() => definirMarco(i.id, m, s))}
          />
        </td>
      ))}
      <td><Campo valor={i.proxima_acao} rotulo="Próxima ação" largura={240} onSalvar={v => salvar({ proxima_acao: v })} /></td>
      <td><Campo valor={i.responsavel_acao} rotulo="Responsável pela próxima ação" lista="ac-pessoas" onSalvar={v => salvar({ responsavel_acao: v })} /></td>
      <td className={prazoVencido(i) ? 'is-vencido' : undefined}>
        <Campo valor={i.prazo} tipo="date" rotulo="Prazo" onSalvar={v => salvar({ prazo: v })} />
      </td>
      <td>
        <select className="ac-cell-in ac-risco" data-r={i.risco} value={i.risco} aria-label="Risco" onChange={e => salvar({ risco: e.target.value as Risco })}>
          {RISCOS.map(r => <option key={r}>{r}</option>)}
        </select>
      </td>
      <td className={motivoPendente ? 'is-falta' : undefined}>
        <Campo valor={i.motivo_bloqueio} rotulo="Motivo / bloqueio" largura={220} onSalvar={v => salvar({ motivo_bloqueio: v })} />
        {motivoPendente ? <span className="ac-hint">Obrigatório: risco Alto/Crítico ou etapa Bloqueada.</span> : null}
      </td>
      <td className="ac-grid-pct" aria-label={`${pct}% da implantação`}>
        <span className="ac-bar"><i style={{ width: `${pct}%` }} /></span>
        <b>{pct}%</b>
      </td>
      <td className="ac-grid-acoes">
        <button type="button" className="ac-btn-sm" onClick={() => run(() => gerarTarefas(i.id))} title="Cria as tarefas-modelo dos documentos para esta escola">
          Gerar tarefas
        </button>
        <button type="button" className="ac-btn-sm is-ghost" onClick={() => { if (confirm(`Arquivar ${i.escola_nome}?`)) salvar({ arquivada: true }) }}>
          Arquivar
        </button>
        <span className="ac-hint">Atualizado em {fmtData(i.updated_at)}</span>
      </td>
    </tr>
  )
}

export default function ImplantacaoGrid({ itens, pessoas }: { itens: Implantacao[]; pessoas: string[] }) {
  if (!itens.length) {
    return <p className="ac-vazio">Nenhuma escola no Painel Mestre ainda. Cadastre a primeira logo após o Handoff Comercial.</p>
  }
  return (
    <div className="ac-grid-wrap" role="region" aria-label="Implantação por escola" tabIndex={0}>
      <datalist id="ac-pessoas">{pessoas.map(p => <option key={p} value={p} />)}</datalist>
      <table className="ac-grid">
        <thead>
          <tr>
            <th scope="col">Escola</th>
            <th scope="col">Responsável We Make</th>
            <th scope="col">Prioridade</th>
            {MARCOS.map(m => <th key={m} scope="col" className="ac-grid-marco">{m}</th>)}
            <th scope="col">Próxima ação</th>
            <th scope="col">Responsável pela ação</th>
            <th scope="col">Prazo</th>
            <th scope="col">Risco</th>
            <th scope="col">Motivo / bloqueio</th>
            <th scope="col">% Implantação</th>
            <th scope="col"><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {itens.map(i => <Linha key={i.id} i={i} pessoas={pessoas} />)}
        </tbody>
      </table>
    </div>
  )
}
