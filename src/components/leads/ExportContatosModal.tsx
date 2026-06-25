'use client'

import { useState } from 'react'

const FONTE_OPTS = [
  { value: '',                  label: 'Todos os eventos' },
  { value: 'ciecc_2025',        label: '1º CIECC 2025' },
  { value: 'ciecc_2026',        label: '2º CIECC 2026' },
  { value: 'formulario_wemake', label: 'Formulário We Make' },
  { value: 'crm',               label: 'CRM Education' },
  { value: 'oikos',             label: 'Oikos Live' },
  { value: 'outro',             label: 'Outro' },
]

interface Props {
  ufsDisponiveis: string[]
}

export function ExportContatosModal({ ufsDisponiveis }: Props) {
  const [open, setOpen]           = useState(false)
  const [fonte, setFonte]         = useState('')
  const [uf, setUf]               = useState('')
  const [apenasComNome, setApenasComNome]   = useState(false)
  const [apenasComTel, setApenasComTel]     = useState(false)
  const [apenasComEmail, setApenasComEmail] = useState(false)

  function buildUrl() {
    const p: Record<string, string> = { modo: 'simples' }
    if (fonte)        p.fonte = fonte
    if (uf)           p.uf    = uf
    if (apenasComNome)  p.com_nome  = '1'
    if (apenasComTel)   p.com_tel   = '1'
    if (apenasComEmail) p.com_email = '1'
    return `/api/leads-export?${new URLSearchParams(p).toString()}`
  }

  function handleDownload() {
    window.location.href = buildUrl()
    setOpen(false)
  }

  const LBL: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-montserrat,sans-serif)',
    fontSize: '.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    color: '#64748b',
    marginBottom: '.35rem',
  }

  const SEL: React.CSSProperties = {
    width: '100%',
    padding: '.55rem .75rem',
    borderRadius: 8,
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: '.82rem',
    fontFamily: 'var(--font-inter,sans-serif)',
    color: '#0f172a',
    outline: 'none',
    cursor: 'pointer',
  }

  const svgDown = (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )

  return (
    <>
      {/* Botão de abertura */}
      <button
        onClick={() => setOpen(true)}
        title="Exportar contatos com filtros por evento e estado"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          padding: '.45rem 1rem', borderRadius: 9999,
          background: '#0b1f44', color: '#fff', border: 'none',
          fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
          fontFamily: 'var(--font-montserrat,sans-serif)',
          boxShadow: '0 4px 12px rgba(11,31,68,.3)',
        }}
      >
        {svgDown}
        Exportar Contatos
      </button>

      {/* Overlay + Modal */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(11,31,68,.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{
            background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,.22)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ background: '#0b1f44', padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.45)', marginBottom: 2 }}>
                  Banco de Leads
                </div>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.95rem', fontWeight: 800, color: '#fff' }}>
                  Exportar Contatos
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Evento */}
              <div>
                <label style={LBL}>Evento / Fonte</label>
                <select value={fonte} onChange={e => setFonte(e.target.value)} style={SEL}>
                  {FONTE_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label style={LBL}>Estado (UF)</label>
                <select value={uf} onChange={e => setUf(e.target.value)} style={SEL}>
                  <option value="">Todos os estados</option>
                  {ufsDisponiveis.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Filtros de qualidade */}
              <div>
                <label style={LBL}>Filtros de qualidade</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem', background: '#f8fafc', borderRadius: 10, padding: '.85rem 1rem', border: '1.5px solid #e2e8f0' }}>
                  {[
                    { checked: apenasComNome,  set: setApenasComNome,  label: 'Apenas leads com nome' },
                    { checked: apenasComTel,   set: setApenasComTel,   label: 'Apenas leads com telefone' },
                    { checked: apenasComEmail, set: setApenasComEmail, label: 'Apenas leads com e-mail' },
                  ].map(({ checked, set, label }) => (
                    <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', cursor: 'pointer', fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.82rem', color: '#0f172a' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => set(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#0b1f44', cursor: 'pointer' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Colunas exportadas */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.72rem', color: '#0369a1', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.7 }}>
                <strong>Colunas exportadas:</strong> Nome · Cargo · Escola · Telefone · E-mail · Evento · Estado
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.4rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: '.55rem 1.2rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '.8rem', fontWeight: 600, fontFamily: 'var(--font-inter,sans-serif)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDownload}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', padding: '.55rem 1.4rem', borderRadius: 8, border: 'none', background: '#0b1f44', color: '#fff', fontSize: '.82rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,31,68,.3)' }}
              >
                {svgDown}
                Baixar Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
