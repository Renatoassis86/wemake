'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRegistro } from '@/lib/actions'

interface Props {
  registroId: string
  escolaId: string
  onDeleted?: (id: string) => void
}

export function DeleteRegistroBtn({ registroId, escolaId, onDeleted }: Props) {
  const router = useRouter()
  const [loading,  setLoading]  = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    const result = await deleteRegistro(registroId)
    if (result.success) {
      onDeleted?.(registroId)
      router.refresh()
    } else {
      alert(result.error ?? 'Erro ao excluir')
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title={confirm ? 'Clique para confirmar' : 'Excluir registro'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 7,
        border: `1.5px solid ${confirm ? '#dc2626' : '#fca5a5'}`,
        background: confirm ? '#dc2626' : '#fef2f2',
        color: confirm ? '#fff' : '#dc2626',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all .15s', flexShrink: 0,
        opacity: loading ? .6 : 1,
      }}
    >
      {loading ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      ) : confirm ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
        </svg>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
