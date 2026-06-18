'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'

type BtnState = 'idle' | 'loading' | 'done' | 'error'

function ActionButton({
  label, icon: Icon, color, onClick, loading, msg, msgStatus,
}: {
  label: string
  icon: React.ElementType
  color: string
  onClick: () => void
  loading: boolean
  msg: string
  msgStatus: BtnState
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          padding: '.4rem .9rem', borderRadius: 8,
          border: `1px solid ${color}22`,
          background: '#fff', color, fontSize: '.78rem', fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          fontFamily: 'var(--font-montserrat,sans-serif)',
        }}
      >
        <Icon size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        {label}
      </button>

      {msgStatus === 'done' && (
        <span style={{ fontSize: '.73rem', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
          <CheckCircle size={12} /> {msg}
        </span>
      )}
      {msgStatus === 'error' && (
        <span style={{ fontSize: '.73rem', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
          <AlertCircle size={12} /> {msg}
        </span>
      )}
    </div>
  )
}

export default function SincronizarLeadsButton() {
  const [syncState, setSyncState]   = useState<BtnState>('idle')
  const [syncMsg, setSyncMsg]       = useState('')
  const [dedupState, setDedupState] = useState<BtnState>('idle')
  const [dedupMsg, setDedupMsg]     = useState('')
  const [confirming, setConfirming] = useState(false)

  async function handleSync() {
    setSyncState('loading'); setSyncMsg('')
    try {
      const res  = await fetch('/api/admin/migrar-leads', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setSyncState('error'); setSyncMsg(json.error ?? 'Erro') }
      else {
        setSyncState('done')
        setSyncMsg(`${json.migrated} sincronizado${json.migrated !== 1 ? 's' : ''}, ${json.skipped} já existia${json.skipped !== 1 ? 'm' : ''}`)
      }
    } catch (e: any) { setSyncState('error'); setSyncMsg(e.message ?? 'Erro de rede') }
  }

  async function handleDedup() {
    if (!confirming) { setConfirming(true); return }
    setConfirming(false)
    setDedupState('loading'); setDedupMsg('')
    try {
      const res  = await fetch('/api/admin/remover-duplicatas', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setDedupState('error'); setDedupMsg(json.error ?? 'Erro') }
      else {
        setDedupState('done')
        setDedupMsg(`${json.removed} duplicata${json.removed !== 1 ? 's' : ''} removida${json.removed !== 1 ? 's' : ''}`)
        if (json.removed > 0) setTimeout(() => window.location.reload(), 1200)
      }
    } catch (e: any) { setDedupState('error'); setDedupMsg(e.message ?? 'Erro de rede') }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
      <ActionButton
        label="Sincronizar com Banco de Leads"
        icon={RefreshCw}
        color="#4A7FDB"
        onClick={handleSync}
        loading={syncState === 'loading'}
        msg={syncMsg}
        msgStatus={syncState}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <button
          onClick={handleDedup}
          disabled={dedupState === 'loading'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            padding: '.4rem .9rem', borderRadius: 8,
            border: `1px solid ${confirming ? '#dc262644' : '#e2e8f0'}`,
            background: confirming ? '#fef2f2' : '#fff',
            color: confirming ? '#dc2626' : '#64748b',
            fontSize: '.78rem', fontWeight: 600,
            cursor: dedupState === 'loading' ? 'wait' : 'pointer',
            opacity: dedupState === 'loading' ? 0.7 : 1,
            fontFamily: 'var(--font-montserrat,sans-serif)',
            transition: 'all .15s',
          }}
        >
          <Trash2 size={13} />
          {confirming ? 'Confirmar remoção?' : 'Remover duplicatas'}
        </button>

        {confirming && (
          <button
            onClick={() => setConfirming(false)}
            style={{
              padding: '.35rem .7rem', borderRadius: 8,
              border: '1px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontSize: '.75rem', cursor: 'pointer',
              fontFamily: 'var(--font-montserrat,sans-serif)',
            }}
          >
            Cancelar
          </button>
        )}

        {dedupState === 'done' && (
          <span style={{ fontSize: '.73rem', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
            <CheckCircle size={12} /> {dedupMsg}
          </span>
        )}
        {dedupState === 'error' && (
          <span style={{ fontSize: '.73rem', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
            <AlertCircle size={12} /> {dedupMsg}
          </span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
