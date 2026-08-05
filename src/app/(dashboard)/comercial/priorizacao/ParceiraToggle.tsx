'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Handshake } from 'lucide-react'
import { marcarComoParceira } from '@/lib/actions'

interface Props {
  escolaId: string
  parceira: boolean
}

export function ParceiraToggle({ escolaId, parceira }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [valor, setValor] = useState(parceira)

  function handleToggle() {
    const novoValor = !valor
    setValor(novoValor)
    startTransition(async () => {
      const result = await marcarComoParceira(escolaId, novoValor)
      if (!result.success) {
        alert(result.error ?? 'Erro ao atualizar')
        setValor(!novoValor)
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      title={valor ? 'Já é parceira — clique para desmarcar' : 'Marcar como parceira (contrato assinado)'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '.3rem',
        padding: '3px 9px', borderRadius: 99, fontSize: '.62rem', fontWeight: 700,
        background: valor ? '#F0FDF4' : '#F8FAFC',
        color: valor ? '#15803D' : '#94A3B8',
        border: `1px solid ${valor ? '#BBF7D0' : '#E2E8F0'}`,
        fontFamily: 'var(--font-montserrat, sans-serif)', letterSpacing: '.02em',
        cursor: pending ? 'wait' : 'pointer', opacity: pending ? .6 : 1,
      }}
    >
      <Handshake size={11} />
      {valor ? 'Parceira' : 'Marcar parceira'}
    </button>
  )
}
