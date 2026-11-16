'use client'

import { useState, useTransition } from 'react'
import { formatCurrency } from '@/lib/utils'
import CelulaMoney from './CelulaMoney'
import { atualizarValorAnualContrato, atualizarValorTotalContrato } from '@/app/(dashboard)/financeiro/receita/actions'

export interface LinhaReceitaTabela {
  id: string
  escola: string
  uf: string
  modelo: string | null
  alunos: number
  anual: number
  totalContrato: number
  anos: number | null
  veterana: boolean
}

export default function ReceitaContratadaTable({ linhasIniciais }: { linhasIniciais: LinhaReceitaTabela[] }) {
  const [linhas, setLinhas] = useState(linhasIniciais)
  const [, startTransition] = useTransition()
  const receitaAnual = linhas.reduce((s, l) => s + l.anual, 0)
  const receitaTotal = linhas.reduce((s, l) => s + l.totalContrato, 0)
  const alunos = linhas.reduce((s, l) => s + l.alunos, 0)

  function onAnual(id: string, valor: number) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, anual: valor } : l))
    startTransition(async () => { await atualizarValorAnualContrato(id, valor) })
  }

  function onTotal(id: string, valor: number) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, totalContrato: valor } : l))
    startTransition(async () => { await atualizarValorTotalContrato(id, valor) })
  }

  return (
    <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Receita por escola">
      <table className="ac-table is-num">
        <thead>
          <tr>
            <th scope="col">Escola</th><th scope="col">UF</th><th scope="col">Modelo</th><th scope="col">Alunos</th>
            <th scope="col">Valor anual</th><th scope="col">Valor total (vigência)</th><th scope="col">Duração</th><th scope="col">% da receita</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(l => (
            <tr key={l.id}>
              <td>
                {l.escola}
                {l.veterana ? (
                  <span style={{ marginLeft: '.5rem', fontSize: '.7rem', padding: '.1rem .45rem', borderRadius: '999px', background: '#f1f5f9', color: '#64748b' }}>
                    Veterana
                  </span>
                ) : null}
              </td>
              <td>{l.uf}</td>
              <td>{l.modelo ?? '—'}</td>
              <td>{l.alunos.toLocaleString('pt-BR')}</td>
              <td><CelulaMoney valor={l.anual} aria={`${l.escola} — valor anual`} onSalvar={v => onAnual(l.id, v)} /></td>
              <td><CelulaMoney valor={l.totalContrato} aria={`${l.escola} — valor total da vigência`} onSalvar={v => onTotal(l.id, v)} /></td>
              <td>{l.anos ? `${Number(l.anos).toFixed(l.anos % 1 ? 1 : 0)} ${l.anos <= 1 ? 'ano' : 'anos'}` : '—'}</td>
              <td>{receitaAnual && l.anual ? `${((l.anual / receitaAnual) * 100).toFixed(1).replace('.', ',')}%` : '—'}</td>
            </tr>
          ))}
          <tr className="ac-total">
            <td>Total</td><td /><td /><td>{alunos.toLocaleString('pt-BR')}</td>
            <td>{receitaAnual ? formatCurrency(receitaAnual) : '—'}</td>
            <td>{receitaTotal ? formatCurrency(receitaTotal) : '—'}</td>
            <td /><td>{receitaAnual ? '100%' : '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
