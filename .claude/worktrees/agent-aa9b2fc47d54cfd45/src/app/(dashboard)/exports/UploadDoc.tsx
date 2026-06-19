'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tipo: 'ficha_cadastral' | 'minuta_contrato'
  label: string
}

export function UploadDoc({ tipo, label }: Props) {
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMsg(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('tipo', tipo)

    try {
      const res  = await fetch('/api/upload-doc', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setMsg({ tipo: 'erro', texto: data.error ?? 'Erro ao fazer upload' })
      } else {
        setMsg({ tipo: 'ok', texto: `✓ "${file.name}" enviado com sucesso!` })
        router.refresh()
      }
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' })
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleUpload}
        style={{ display: 'none' }}
        id={`upload-${tipo}`}
      />
      <label htmlFor={`upload-${tipo}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          padding: '6px 14px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
          border: '1.5px solid #e2e8f0', background: loading ? '#f1f5f9' : '#fff',
          fontSize: '.72rem', fontWeight: 700, color: '#475569',
          fontFamily: 'var(--font-montserrat,sans-serif)', transition: 'all .15s',
          opacity: loading ? .6 : 1,
        }}
        onMouseEnter={e => { if (!loading) { (e.target as HTMLLabelElement).style.background = '#0f172a'; (e.target as HTMLLabelElement).style.color = '#fff'; (e.target as HTMLLabelElement).style.borderColor = '#0f172a' }}}
        onMouseLeave={e => { (e.target as HTMLLabelElement).style.background = '#fff'; (e.target as HTMLLabelElement).style.color = '#475569'; (e.target as HTMLLabelElement).style.borderColor = '#e2e8f0' }}
      >
        {loading ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
            Enviando...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            Atualizar
          </>
        )}
      </label>

      {msg && (
        <div style={{
          marginTop: '.5rem', fontSize: '.7rem', lineHeight: 1.5,
          color: msg.tipo === 'ok' ? '#16a34a' : '#dc2626',
          fontFamily: 'var(--font-inter,sans-serif)', fontWeight: msg.tipo === 'ok' ? 600 : 400,
        }}>
          {msg.texto}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
