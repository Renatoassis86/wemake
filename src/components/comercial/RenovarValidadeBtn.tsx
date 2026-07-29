'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { renovarValidadeProposta } from '@/lib/actions'

interface Props {
  propostaId: string
  escolaNome: string
  variant?: 'row' | 'form'
}

function default20DiasAFrente() {
  const d = new Date()
  d.setDate(d.getDate() + 20)
  return d.toISOString().slice(0, 10)
}

export function RenovarValidadeBtn({ propostaId, escolaNome, variant = 'row' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(default20DiasAFrente)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleConfirmar() {
    setLoading(true)
    setErro(null)
    const result = await renovarValidadeProposta(propostaId, data)
    setLoading(false)
    if (!result.success) {
      setErro(result.error ?? 'Erro ao renovar')
      return
    }
    setOpen(false)
    router.refresh()
  }

  if (open) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '.35rem',
        background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 8,
        padding: '.25rem .4rem',
      }}>
        <input
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          style={{
            border: '1px solid #fcd34d', borderRadius: 6, padding: '.2rem .35rem',
            fontSize: '.72rem', color: '#78350f', background: '#fff', outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={loading}
          title="Confirmar nova validade"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6, border: 'none',
            background: '#16a34a', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? .6 : 1,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setErro(null) }}
          disabled={loading}
          title="Cancelar"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6, border: 'none',
            background: '#f1f5f9', color: '#64748b', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {erro && (
          <span style={{ fontSize: '.68rem', color: '#dc2626', marginLeft: '.2rem' }}>{erro}</span>
        )}
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <button
        type="button"
        onClick={() => { setData(default20DiasAFrente()); setOpen(true) }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem',
          padding: '.65rem 1.2rem', borderRadius: 9,
          border: '1.5px solid #fde68a', background: '#fffbeb', color: '#b45309',
          fontSize: '.82rem', fontWeight: 700,
          fontFamily: 'var(--font-montserrat, sans-serif)', cursor: 'pointer',
        }}
        title={`Renovar validade da proposta de ${escolaNome}`}
      >
        Renovar validade
      </button>
    )
  }

  // variant === 'row' — botão compacto de ícone pra usar dentro da tabela
  return (
    <button
      type="button"
      onClick={() => { setData(default20DiasAFrente()); setOpen(true) }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 7, border: 'none',
        background: '#fffbeb', color: '#b45309', cursor: 'pointer', transition: 'all .15s',
      }}
      title={`Renovar validade (+20 dias por padrão) — ${escolaNome}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>
    </button>
  )
}
