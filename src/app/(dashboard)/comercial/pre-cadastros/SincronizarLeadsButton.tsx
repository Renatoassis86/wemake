'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function SincronizarLeadsButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleSync() {
    setStatus('loading')
    setMsg('')
    try {
      const res = await fetch('/api/admin/migrar-leads', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMsg(json.error ?? 'Erro desconhecido')
      } else {
        setStatus('done')
        setMsg(`${json.migrated} sincronizado${json.migrated !== 1 ? 's' : ''}, ${json.skipped} já existia${json.skipped !== 1 ? 'm' : ''}`)
      }
    } catch (e: any) {
      setStatus('error')
      setMsg(e.message ?? 'Erro de rede')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
      <button
        onClick={handleSync}
        disabled={status === 'loading'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          padding: '.4rem .9rem', borderRadius: 8, border: '1px solid #e2e8f0',
          background: '#fff', color: '#4A7FDB', fontSize: '.78rem', fontWeight: 600,
          cursor: status === 'loading' ? 'wait' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
          fontFamily: 'var(--font-montserrat,sans-serif)',
        }}
      >
        <RefreshCw size={13} style={{ animation: status === 'loading' ? 'spin 1s linear infinite' : 'none' }} />
        Sincronizar com Banco de Leads
      </button>

      {status === 'done' && (
        <span style={{ fontSize: '.75rem', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
          <CheckCircle size={13} /> {msg}
        </span>
      )}
      {status === 'error' && (
        <span style={{ fontSize: '.75rem', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
          <AlertCircle size={13} /> {msg}
        </span>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
