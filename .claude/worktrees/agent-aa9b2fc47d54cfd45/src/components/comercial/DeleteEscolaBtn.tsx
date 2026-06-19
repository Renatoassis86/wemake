'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletarEscola } from '@/lib/actions'

interface Props {
  escolaId: string
  escolaNome: string
  variant?: 'hero' | 'sidebar'
}

export function DeleteEscolaBtn({ escolaId, escolaNome, variant = 'sidebar' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    const result = await deletarEscola(escolaId)
    if (result.success) {
      router.push('/comercial/escolas')
    } else {
      alert(result.error ?? 'Erro ao excluir')
      setLoading(false)
      setConfirm(false)
    }
  }

  if (variant === 'hero') {
    return (
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '.45rem',
          background: confirm ? 'rgba(220,38,38,.85)' : 'rgba(255,255,255,.06)',
          color: confirm ? '#fff' : 'rgba(255,255,255,.6)',
          padding: '.6rem 1rem', borderRadius: 8,
          fontSize: '.82rem', fontWeight: 600,
          fontFamily: 'var(--font-montserrat, sans-serif)',
          border: `1px solid ${confirm ? 'rgba(220,38,38,.5)' : 'rgba(255,255,255,.12)'}`,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all .2s',
        }}
        title={confirm ? 'Clique novamente para confirmar' : `Excluir ${escolaNome}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        {loading ? 'Excluindo...' : confirm ? 'Confirmar exclusão' : 'Excluir'}
      </button>
    )
  }

  // variant === 'sidebar'
  return (
    <>
      {confirm && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '.75rem 1rem', marginBottom: '.5rem',
          fontSize: '.72rem', color: '#dc2626', lineHeight: 1.5,
          fontFamily: 'var(--font-inter,sans-serif)',
        }}>
          <strong>Atenção:</strong> Esta ação desativa a escola e remove ela dos filtros.
          Os registros e histórico são mantidos.
          <br />
          <button onClick={() => setConfirm(false)} style={{ marginTop: '.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '.7rem', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600, textDecoration: 'underline' }}>
            Cancelar
          </button>
        </div>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem',
          width: '100%', padding: '.65rem 1rem', borderRadius: 9,
          border: `1.5px solid ${confirm ? '#dc2626' : '#fca5a5'}`,
          background: confirm ? '#dc2626' : '#fef2f2',
          color: confirm ? '#fff' : '#dc2626',
          fontSize: '.82rem', fontWeight: 700,
          fontFamily: 'var(--font-montserrat, sans-serif)',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all .15s',
          opacity: loading ? .6 : 1,
        }}
        title={confirm ? 'Clique para confirmar a exclusão' : `Excluir escola ${escolaNome}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        {loading ? 'Excluindo...' : confirm ? 'Confirmar exclusão' : 'Excluir Escola'}
      </button>
    </>
  )
}
