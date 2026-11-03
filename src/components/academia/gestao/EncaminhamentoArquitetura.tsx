'use client'

import { useState, useTransition } from 'react'
import { salvarParecer } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'

export default function EncaminhamentoArquitetura({ id, inicial }: { id: string; inicial: string | null }) {
  const [valor, setValor] = useState(inicial ?? '')
  const [salvo, setSalvo] = useState<'ok' | 'salvando' | 'erro'>('ok')

  function salvar() {
    setSalvo('salvando')
    salvarParecer(id, { 'geral.arquitetura': valor }).then(r => setSalvo(r.ok ? 'ok' : 'erro'))
  }

  return (
    <label className="an-geral" style={{ margin: 0 }}>
      <span>
        Encaminhamento ao estúdio de arquitetura
        {salvo === 'salvando' ? ' · salvando…' : salvo === 'erro' ? ' · erro ao salvar' : ''}
      </span>
      <textarea rows={2} value={valor} onChange={e => setValor(e.target.value)} onBlur={salvar} />
    </label>
  )
}
