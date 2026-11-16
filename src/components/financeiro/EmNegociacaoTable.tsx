'use client'

import { useState, useTransition } from 'react'
import CelulaMoney from './CelulaMoney'
import { atualizarValorAnualContrato } from '@/app/(dashboard)/financeiro/receita/actions'

export interface LinhaNegociacao { id: string; escola: string; uf: string; alunos: number; anual: number; enviado: boolean }

export default function EmNegociacaoTable({ linhasIniciais }: { linhasIniciais: LinhaNegociacao[] }) {
  const [linhas, setLinhas] = useState(linhasIniciais)
  const [, startTransition] = useTransition()

  function onAnual(id: string, valor: number) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, anual: valor } : l))
    startTransition(async () => { await atualizarValorAnualContrato(id, valor) })
  }

  return (
    <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Contratos em negociação">
      <table className="ac-table is-num">
        <thead><tr><th scope="col">Escola</th><th scope="col">UF</th><th scope="col">Alunos</th><th scope="col">Valor anual</th><th scope="col">Situação</th></tr></thead>
        <tbody>
          {linhas.map(l => (
            <tr key={l.id}>
              <td>{l.escola}</td><td>{l.uf}</td><td>{l.alunos.toLocaleString('pt-BR')}</td>
              <td><CelulaMoney valor={l.anual} aria={`${l.escola} — valor anual estimado`} onSalvar={v => onAnual(l.id, v)} /></td>
              <td>{l.enviado ? 'Contrato enviado' : 'Em andamento'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
