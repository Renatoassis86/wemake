'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { arquivarProposta, desarquivarProposta } from '@/lib/actions'

interface Props {
  propostaId: string
  escolaNome: string
  arquivada?: boolean
  variant?: 'row' | 'form'
  redirectTo?: string
}

export function ArquivarPropostaBtn({ propostaId, escolaNome, arquivada = false, variant = 'row', redirectTo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleClick() {
    if (arquivada) {
      setLoading(true)
      const result = await desarquivarProposta(propostaId)
      setLoading(false)
      if (!result.success) alert(result.error ?? 'Erro ao restaurar')
      else router.refresh()
      return
    }

    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    const result = await arquivarProposta(propostaId)
    if (result.success) {
      if (redirectTo) router.push(redirectTo)
      else router.refresh()
    } else {
      alert(result.error ?? 'Erro ao arquivar')
      setLoading(false)
      setConfirm(false)
    }
  }

  if (variant === 'form') {
    return (
      <>
        {confirm && !arquivada && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
            padding: '.75rem 1rem', marginBottom: '.5rem',
            fontSize: '.72rem', color: '#dc2626', lineHeight: 1.5,
            fontFamily: 'var(--font-inter,sans-serif)',
          }}>
            <strong>Atenção:</strong> Isso arquiva a proposta — ela some da listagem, mas continua no banco e pode ser restaurada.
            <br />
            <button onClick={() => setConfirm(false)} style={{ marginTop: '.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '.7rem', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600, textDecoration: 'underline' }}>
              Cancelar
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem',
            padding: '.65rem 1.2rem', borderRadius: 9,
            border: `1.5px solid ${arquivada ? '#86efac' : confirm ? '#dc2626' : '#fca5a5'}`,
            background: arquivada ? '#f0fdf4' : confirm ? '#dc2626' : '#fef2f2',
            color: arquivada ? '#16a34a' : confirm ? '#fff' : '#dc2626',
            fontSize: '.82rem', fontWeight: 700,
            fontFamily: 'var(--font-montserrat, sans-serif)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? .6 : 1,
          }}
          title={arquivada ? `Restaurar proposta de ${escolaNome}` : confirm ? 'Clique para confirmar' : `Arquivar proposta de ${escolaNome}`}
        >
          {loading ? 'Aguarde...' : arquivada ? 'Restaurar proposta' : confirm ? 'Confirmar arquivamento' : 'Arquivar proposta'}
        </button>
      </>
    )
  }

  // variant === 'row' — botão compacto de ícone pra usar dentro da tabela
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 7, border: 'none',
        background: confirm ? '#dc2626' : arquivada ? '#f0fdf4' : '#fef2f2',
        color: confirm ? '#fff' : arquivada ? '#16a34a' : '#dc2626',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all .15s',
      }}
      title={arquivada ? 'Restaurar proposta' : confirm ? 'Clique para confirmar' : 'Arquivar proposta'}
    >
      {arquivada ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      )}
    </button>
  )
}
