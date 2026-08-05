'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { definirEstagioFila, marcarComoParceira } from '@/lib/actions'
import { STAGE_OPTIONS, type StageNegociacao } from '@/types/database'

interface Props {
  escolaId: string
  negociacaoId: string | null
  stage: StageNegociacao | null
  parceira: boolean
}

const PARCEIRA = 'parceira' as const

const CORES: Record<string, { bg: string; text: string; border: string }> = {
  '':            { bg: '#F8FAFC', text: '#94A3B8', border: '#E2E8F0' },
  prospeccao:    { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  qualificacao:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  apresentacao:  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  proposta:      { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  negociacao:    { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  fechamento:    { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  ganho:         { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
  perdido:       { bg: '#F8FAFC', text: '#64748B', border: '#CBD5E1' },
  [PARCEIRA]:    { bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
}

export function EstagioSelect({ escolaId, negociacaoId, stage, parceira }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [valor, setValor] = useState<string>(parceira ? PARCEIRA : (stage ?? ''))

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value
    if (!novo || novo === valor) return
    const anterior = valor
    setValor(novo)
    startTransition(async () => {
      // Selecionar "Parceira" marca o contrato como assinado; sair da Parceira para
      // outro estágio desmarca, pra não deixar a escola presa em "Parceira" enquanto
      // o dropdown já mostra outra coisa.
      if (anterior === PARCEIRA && novo !== PARCEIRA) {
        const rDesmarcar = await marcarComoParceira(escolaId, false)
        if (!rDesmarcar.success) {
          alert(rDesmarcar.error ?? 'Erro ao atualizar')
          setValor(anterior)
          return
        }
      }

      const result = novo === PARCEIRA
        ? await marcarComoParceira(escolaId, true)
        : await definirEstagioFila(escolaId, negociacaoId, novo as StageNegociacao)

      if (!result.success) {
        alert(result.error ?? 'Erro ao atualizar')
        setValor(anterior)
        return
      }
      router.refresh()
    })
  }

  const cor = CORES[valor] ?? CORES['']

  return (
    <select
      value={valor}
      onChange={handleChange}
      disabled={pending}
      title="Alterar situação comercial"
      style={{
        padding: '3px 8px', borderRadius: 99,
        fontSize: '.65rem', fontWeight: 700,
        background: cor.bg, color: cor.text,
        border: `1px solid ${cor.border}`,
        fontFamily: 'var(--font-montserrat, sans-serif)',
        letterSpacing: '.03em',
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? .6 : 1,
        outline: 'none',
        appearance: 'auto',
      }}
    >
      <option value="" disabled={valor !== ''}>Nunca contatada</option>
      {STAGE_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
      <option value={PARCEIRA}>🤝 Parceira</option>
    </select>
  )
}
