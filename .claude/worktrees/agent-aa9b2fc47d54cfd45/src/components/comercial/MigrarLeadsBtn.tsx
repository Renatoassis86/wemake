'use client'

import { useState } from 'react'

export function MigrarLeadsBtn() {
  const [estado, setEstado]     = useState<'idle'|'preview'|'migrando'|'ok'>('idle')
  const [preview, setPreview]   = useState<any>(null)
  const [resultado, setResult]  = useState<any>(null)

  async function handlePreview() {
    setEstado('preview')
    const res = await fetch('/api/migrar-leads-escolas')
    const data = await res.json()
    setPreview(data)
  }

  async function handleMigrar() {
    setEstado('migrando')
    const res = await fetch('/api/migrar-leads-escolas', { method: 'POST' })
    const data = await res.json()
    setResult(data)
    setEstado('ok')
    // Recarrega a página para mostrar as novas escolas
    setTimeout(() => window.location.reload(), 1500)
  }

  if (estado === 'idle') return (
    <button onClick={handlePreview} style={{
      display: 'inline-flex', alignItems: 'center', gap: '.4rem',
      background: '#f5f3ff', color: '#7c3aed',
      border: '1.5px solid #ddd6fe',
      padding: '.45rem 1rem', borderRadius: 9999,
      fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
      fontFamily: 'var(--font-montserrat,sans-serif)',
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
      Importar do Banco de Leads
    </button>
  )

  if (estado === 'preview' && preview) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '.72rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
        <strong style={{ color: '#7c3aed' }}>{preview.novas}</strong> novas escolas a criar,
        <strong style={{ color: '#2563eb', marginLeft: '.3rem' }}>{preview.existentes}</strong> existentes a atualizar
      </span>
      <button onClick={handleMigrar} style={{
        display: 'inline-flex', alignItems: 'center', gap: '.35rem',
        background: '#7c3aed', color: '#fff',
        padding: '.35rem .85rem', borderRadius: 9999,
        fontSize: '.72rem', fontWeight: 700, cursor: 'pointer', border: 'none',
        fontFamily: 'var(--font-montserrat,sans-serif)',
        boxShadow: '0 4px 12px rgba(124,58,237,.35)',
      }}>
        Confirmar importação
      </button>
      <button onClick={() => setEstado('idle')} style={{
        padding: '.35rem .65rem', borderRadius: 9999,
        border: '1px solid #e2e8f0', background: '#fff',
        color: '#64748b', fontSize: '.72rem', cursor: 'pointer',
        fontFamily: 'var(--font-montserrat,sans-serif)',
      }}>Cancelar</button>
    </div>
  )

  if (estado === 'migrando') return (
    <span style={{ fontSize: '.75rem', color: '#7c3aed', fontFamily: 'var(--font-inter,sans-serif)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Importando escolas...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  )

  if (estado === 'ok' && resultado) return (
    <span style={{ fontSize: '.72rem', color: '#16a34a', fontFamily: 'var(--font-inter,sans-serif)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      {resultado.criadas} criadas · {resultado.atualizadas} atualizadas
    </span>
  )

  return null
}
