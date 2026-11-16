'use client'

import { useState, useTransition } from 'react'
import { formatCurrency } from '@/lib/utils'
import CelulaMoney from './CelulaMoney'
import { atualizarMesContrato } from '@/app/(dashboard)/financeiro/receita/actions'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export interface LinhaProjecao {
  id: string
  escola: string
  anual: number
  mensal: number
  /** meses reais de 2027 (Orçamento) — null usa anual/12 repetido */
  mesesReais: number[] | null
  /** valor de cada ano de vigência — null repete o anual pros anos sem dado próprio */
  valoresPorAno: number[] | null
  anos: number | null
}

export default function ProjecaoMensalTable({ linhas: linhasIniciais, ano }: {
  linhas: LinhaProjecao[]
  ano: number
}) {
  const [modo, setModo] = useState<'mensal' | 'anual'>('mensal')
  const [linhas, setLinhas] = useState(linhasIniciais)
  const [, startTransition] = useTransition()
  const maxAnos = Math.max(1, ...linhas.map(l => Math.ceil(l.anos ?? 1)))

  function valorAno(l: LinhaProjecao, indiceAno: number) {
    if (!l.anual) return 0
    return l.valoresPorAno?.[indiceAno] ?? l.anual
  }

  function mesesDaLinha(l: LinhaProjecao) {
    return l.mesesReais ?? Array(12).fill(l.mensal)
  }

  function onMes(id: string, mesIdx: number, valor: number) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, mesesReais: mesesDaLinha(l).map((v, i) => i === mesIdx ? valor : v) } : l))
    startTransition(async () => { await atualizarMesContrato(id, ano, mesIdx + 1, valor) })
  }

  const totaisPorMes = MESES.map((_, i) => linhas.reduce((s, l) => s + (l.anual ? mesesDaLinha(l)[i] : 0), 0))

  return (
    <>
      <div role="group" aria-label="Visualização" style={{ margin: '0 0 .75rem', display: 'flex', gap: '.4rem' }}>
        <button type="button" className={`ac-btn-sm${modo === 'mensal' ? '' : ' is-ghost'}`} onClick={() => setModo('mensal')}>Mensal</button>
        <button type="button" className={`ac-btn-sm${modo === 'anual' ? '' : ' is-ghost'}`} onClick={() => setModo('anual')}>Anual</button>
      </div>
      <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Projeção mensal por escola">
        <table className={`ac-table is-num${modo === 'mensal' ? ' is-projecao-compacta' : ''}`}>
          <thead>
            <tr>
              <th scope="col">Escola</th>
              {modo === 'mensal'
                ? MESES.map(m => <th key={m} scope="col">{m}</th>)
                : Array.from({ length: maxAnos }, (_, i) => <th key={i} scope="col">Ano {i + 1}</th>)}
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={l.id}>
                <td>{l.escola}</td>
                {modo === 'mensal'
                  ? mesesDaLinha(l).map((v, i) => (
                    <td key={i}>
                      {l.anual || v
                        ? <CelulaMoney valor={v} aria={`${l.escola} — ${MESES[i]}`} onSalvar={n => onMes(l.id, i, n)} style={{ minWidth: '4.2rem' }} />
                        : '—'}
                    </td>
                  ))
                  : Array.from({ length: maxAnos }, (_, i) => (
                    <td key={i}>{i < Math.ceil(l.anos ?? 1) && l.anual ? formatCurrency(valorAno(l, i)) : '—'}</td>
                  ))}
              </tr>
            ))}
            <tr className="ac-total">
              <td>Total</td>
              {modo === 'mensal'
                ? totaisPorMes.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)
                : Array.from({ length: maxAnos }, (_, i) => (
                  <td key={i}>{formatCurrency(linhas.reduce((s, l) => s + (i < Math.ceil(l.anos ?? 1) ? valorAno(l, i) : 0), 0))}</td>
                ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
