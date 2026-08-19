'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarResponsavelEscola } from '@/lib/actions'

interface Usuario { id: string; nome_completo: string }

export function ResponsavelInlineSelect({ escolaId, responsavelId, usuarios }: {
  escolaId: string
  responsavelId: string | null
  usuarios: Usuario[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [valor, setValor] = useState(responsavelId ?? '')

  function handleChange(novoId: string) {
    setValor(novoId)
    startTransition(async () => {
      const res = await atualizarResponsavelEscola(escolaId, novoId)
      if (res.success) router.refresh()
    })
  }

  return (
    <select
      value={valor}
      onChange={e => handleChange(e.target.value)}
      disabled={pending}
      style={{
        fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)',
        border: '1px solid transparent', borderRadius: 6, background: pending ? '#f1f5f9' : 'transparent',
        padding: '.2rem .3rem', cursor: pending ? 'wait' : 'pointer', maxWidth: 130,
      }}
      onMouseEnter={e => { if (!pending) e.currentTarget.style.border = '1px solid #e2e8f0' }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent' }}
    >
      <option value="">— sem responsável —</option>
      {usuarios.map(u => (
        <option key={u.id} value={u.id}>{u.nome_completo}</option>
      ))}
    </select>
  )
}
