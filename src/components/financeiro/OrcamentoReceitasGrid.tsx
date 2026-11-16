'use client'

import { useState, useTransition } from 'react'
import { MESES_LABEL, type LinhaOrcamento } from '@/lib/orcamentos'
import { formatCurrency } from '@/lib/utils'
import { atualizarValorMensal, atualizarObservacao, vincularContrato, criarLinhaReceita, excluirLinhaReceita } from '@/app/(dashboard)/financeiro/orcamento/actions'

export interface ContratoOpcao { id: string; nome: string }

const cellMoney: React.CSSProperties = {
  width: '100%', minWidth: '5.5rem', boxSizing: 'border-box', border: '1px solid transparent', borderRadius: 6,
  padding: '.3rem .35rem', font: 'inherit', fontVariantNumeric: 'tabular-nums', textAlign: 'right',
  background: 'transparent', color: 'inherit',
}

function numeroOuZero(v: string) {
  const n = parseFloat(v.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export default function OrcamentoReceitasGrid({ ano, linhasIniciais, contratosOpcoes }: {
  ano: number; linhasIniciais: LinhaOrcamento[]; contratosOpcoes: ContratoOpcao[]
}) {
  const [linhas, setLinhas] = useState(linhasIniciais)
  const [formAberto, setFormAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const totalPorMes = Array(12).fill(0)
  for (const l of linhas) l.meses.forEach((v, i) => { totalPorMes[i] += v })
  const totalAnual = totalPorMes.reduce((s, v) => s + v, 0)

  function salvarValor(linhaId: string, mesIdx: number, valor: number) {
    setLinhas(prev => prev.map(l => {
      if (l.id !== linhaId) return l
      const meses = [...l.meses]; meses[mesIdx] = valor
      return { ...l, meses, total: meses.reduce((s, v) => s + v, 0) }
    }))
    startTransition(async () => { await atualizarValorMensal(linhaId, mesIdx + 1, valor) })
  }

  function salvarObservacao(linhaId: string, texto: string) {
    startTransition(async () => { await atualizarObservacao(linhaId, texto) })
  }

  function salvarContrato(linhaId: string, contratoId: string) {
    setLinhas(prev => prev.map(l => l.id === linhaId ? { ...l, contratoId: contratoId || null } : l))
    startTransition(async () => { await vincularContrato(linhaId, contratoId || null) })
  }

  function excluir(id: string, nome: string) {
    if (!confirm(`Remover "${nome}" do orçamento de ${ano}? Não pode ser desfeito.`)) return
    setLinhas(prev => prev.filter(l => l.id !== id))
    startTransition(async () => { await excluirLinhaReceita(id) })
  }

  function adicionar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData(e.currentTarget)
    fd.set('ano', String(ano))
    const nome = String(fd.get('nome') ?? '').trim()
    if (!nome) { setErro('Informe o nome da escola.'); return }
    startTransition(async () => {
      const res = await criarLinhaReceita(fd)
      if (!res.success || !res.id) { setErro(res.error ?? 'Não foi possível adicionar.'); return }
      const contratoId = (fd.get('contrato_id') as string) || null
      setLinhas(prev => [...prev, {
        id: res.id!, nome, observacao: null, contratoId, meses: Array(12).fill(0), total: 0, ordem: prev.length + 1,
      }])
      setFormAberto(false)
      e.currentTarget.reset()
    })
  }

  return (
    <>
      <div className="ac-table-wrap" tabIndex={0} role="region" aria-label={`Orçamento de receitas ${ano}`}>
        <table className="ac-table is-num is-meses">
          <thead>
            <tr>
              <th scope="col">Escola</th>
              {MESES_LABEL.map(m => <th key={m} scope="col">{m}</th>)}
              <th scope="col">Total</th>
              <th scope="col">Contrato</th>
              <th scope="col">Observação</th>
              <th scope="col" aria-label="Remover" />
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={l.id}>
                <td>{l.nome}</td>
                {l.meses.map((v, i) => (
                  <td key={i}>
                    <input
                      type="text" inputMode="decimal" defaultValue={v ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      placeholder="0,00" style={cellMoney} aria-label={`${l.nome} — ${MESES_LABEL[i]}`}
                      onBlur={e => salvarValor(l.id, i, numeroOuZero(e.target.value))}
                    />
                  </td>
                ))}
                <td style={{ fontWeight: 700 }}>{formatCurrency(l.total)}</td>
                <td>
                  <select defaultValue={l.contratoId ?? ''} onChange={e => salvarContrato(l.id, e.target.value)}
                    style={{ font: 'inherit', fontSize: '.78rem', border: '1px solid transparent', background: 'transparent', color: 'inherit', maxWidth: '10rem' }}>
                    <option value="">— sem contrato —</option>
                    {contratosOpcoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </td>
                <td style={{ minWidth: '12rem' }}>
                  <input type="text" defaultValue={l.observacao ?? ''} placeholder="—" onBlur={e => salvarObservacao(l.id, e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid transparent', borderRadius: 6, padding: '.3rem .35rem', font: 'inherit', fontSize: '.8rem', background: 'transparent', color: 'inherit' }} />
                </td>
                <td>
                  <button type="button" className="ac-btn-excluir" onClick={() => excluir(l.id, l.nome)} aria-label={`Remover ${l.nome}`}>✕</button>
                </td>
              </tr>
            ))}
            <tr className="ac-total">
              <td>Total</td>
              {totalPorMes.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
              <td>{formatCurrency(totalAnual)}</td>
              <td /><td /><td />
            </tr>
          </tbody>
        </table>
      </div>

      {formAberto ? (
        <form onSubmit={adicionar} style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', alignItems: 'flex-start', marginTop: '.75rem' }}>
          <input name="nome" placeholder="Nome da escola" required style={{
            padding: '.55rem .7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.85rem', minWidth: '14rem',
          }} />
          <select name="contrato_id" defaultValue="" style={{ padding: '.55rem .7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.85rem' }}>
            <option value="">— sem contrato —</option>
            {contratosOpcoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button type="submit" className="ac-btn-sm">Adicionar</button>
          <button type="button" className="ac-btn-sm is-ghost" onClick={() => setFormAberto(false)}>Cancelar</button>
        </form>
      ) : (
        <button type="button" className="ac-btn-sm" style={{ marginTop: '.75rem' }} onClick={() => setFormAberto(true)}>+ Adicionar escola</button>
      )}
      {erro ? <p className="ac-nota" style={{ color: '#b3261e' }}>{erro}</p> : null}
    </>
  )
}
