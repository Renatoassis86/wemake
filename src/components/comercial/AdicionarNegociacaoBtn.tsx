'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Escola {
  id: string
  nome: string
  cidade: string | null
  estado: string | null
}

interface Props {
  escolas: Escola[]
  userId: string
  onSuccess?: () => void
}

const STAGES = [
  { id: 'prospeccao',   label: 'Prospecção' },
  { id: 'qualificacao', label: 'Qualificação' },
  { id: 'apresentacao', label: 'Apresentação' },
  { id: 'proposta',     label: 'Proposta Enviada' },
  { id: 'negociacao',   label: 'Em Negociação' },
  { id: 'fechamento',   label: 'Fechamento' },
]

export function AdicionarNegociacaoBtn({ escolas, userId, onSuccess }: Props) {
  const router = useRouter()
  const [aberto, setAberto]         = useState(false)
  const [busca, setBusca]           = useState('')
  const [escolaSel, setEscolaSel]   = useState<Escola | null>(null)
  const [stage, setStage]           = useState('prospeccao')
  const [valor, setValor]           = useState('')
  const [titulo, setTitulo]         = useState('')
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState('')
  const [sugestoes, setSugestoes]   = useState<Escola[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const v = busca.trim().toLowerCase()
    if (v.length < 2 || escolaSel) { setSugestoes([]); return }
    setSugestoes(escolas.filter(e =>
      e.nome.toLowerCase().includes(v) || (e.cidade ?? '').toLowerCase().includes(v)
    ).slice(0, 8))
  }, [busca, escolas, escolaSel])

  async function handleSalvar() {
    if (!escolaSel) { setErro('Selecione uma escola'); return }
    setSalvando(true); setErro('')

    const res = await fetch('/api/negociacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escola_id:      escolaSel.id,
        stage,
        titulo:         titulo || `${escolaSel.nome} — ${STAGES.find(s => s.id === stage)?.label}`,
        responsavel_id: userId,
        valor_estimado: valor ? parseFloat(valor.replace(',', '.')) : null,
        ativa:          true,
      }),
    })

    if (res.ok) {
      setAberto(false)
      setBusca(''); setEscolaSel(null); setValor(''); setTitulo('')
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.replace('/comercial/pipeline?t=' + Date.now())
      }
    } else {
      let msg = `Erro HTTP ${res.status}`
      try {
        const d = await res.json()
        msg = d.error ?? msg
        if (d.detail) msg += ` — ${d.detail}`
        if (d.hint)   msg += ` (${d.hint})`
      } catch { /* json parse failed */ }
      setErro(msg)
    }
    setSalvando(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '.65rem .9rem', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)',
    outline: 'none', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' as const,
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.06em', color: '#64748b', marginBottom: '.3rem',
    fontFamily: 'var(--font-montserrat,sans-serif)',
  }

  return (
    <>
      {/* Botão principal */}
      <button onClick={() => setAberto(true)} style={{
        display: 'inline-flex', alignItems: 'center', gap: '.4rem',
        padding: '.45rem 1.1rem', borderRadius: 9999, border: 'none',
        background: 'linear-gradient(135deg, #4A7FDB, #2563b8)',
        color: '#fff', fontWeight: 700, fontSize: '.78rem',
        cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
        boxShadow: '0 4px 12px rgba(74,127,219,.35)',
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Adicionar Escola ao Pipeline
      </button>

      {/* Modal */}
      {aberto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setAberto(false) }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,.18)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>Pipeline Comercial</div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Adicionar escola ao pipeline</div>
              </div>
              <button onClick={() => setAberto(false)} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Busca de escola */}
              <div>
                <label style={lbl}>Escola *</label>
                {escolaSel ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.6rem .9rem', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#15803d', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{escolaSel.nome}</div>
                      {escolaSel.cidade && <div style={{ fontSize: '.68rem', color: '#64748b' }}>{escolaSel.cidade}/{escolaSel.estado}</div>}
                    </div>
                    <button onClick={() => { setEscolaSel(null); setBusca(''); setTimeout(() => inputRef.current?.focus(), 50) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '.85rem', padding: 0 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input ref={inputRef} value={busca} onChange={e => setBusca(e.target.value)}
                      placeholder="Buscar escola pelo nome..."
                      onBlur={() => setTimeout(() => setSugestoes([]), 200)}
                      style={{ ...inp, paddingLeft: '2.1rem' }} autoFocus />
                    {sugestoes.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 10, overflow: 'hidden' }}>
                        {sugestoes.map(e => (
                          <div key={e.id} onMouseDown={() => { setEscolaSel(e); setBusca(e.nome); setSugestoes([]) }}
                            style={{ padding: '.6rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.6rem', borderBottom: '1px solid #f8fafc' }}
                            onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={ev => ev.currentTarget.style.background = '#fff'}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '.8rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{e.nome}</div>
                              {e.cidade && <div style={{ fontSize: '.65rem', color: '#94a3b8' }}>{e.cidade}/{e.estado}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Estágio */}
              <div>
                <label style={lbl}>Estágio no Pipeline *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.4rem' }}>
                  {STAGES.map(s => (
                    <button key={s.id} type="button" onClick={() => setStage(s.id)} style={{
                      padding: '.45rem .5rem', borderRadius: 8, border: `1.5px solid ${stage === s.id ? '#4A7FDB' : '#e2e8f0'}`,
                      background: stage === s.id ? '#fffbeb' : '#f8fafc',
                      color: stage === s.id ? '#4A7FDB' : '#475569',
                      fontSize: '.7rem', fontWeight: stage === s.id ? 700 : 400,
                      cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
                      transition: 'all .1s',
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título e Valor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div>
                  <label style={lbl}>Título (opcional)</label>
                  <input value={titulo} onChange={e => setTitulo(e.target.value)} style={inp}
                    placeholder={escolaSel ? `${escolaSel.nome.slice(0,20)}...` : 'Ex: Apresentação Paideia'} />
                </div>
                <div>
                  <label style={lbl}>Valor Estimado (R$)</label>
                  <input value={valor} onChange={e => setValor(e.target.value)} style={inp}
                    placeholder="Ex: 15000" type="number" min="0" step="100" />
                </div>
              </div>

              {erro && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.65rem .9rem', fontSize: '.78rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>{erro}</div>}

              <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.25rem' }}>
                <button onClick={handleSalvar} disabled={salvando || !escolaSel} style={{
                  flex: 1, padding: '.75rem', borderRadius: 9999, border: 'none',
                  background: !escolaSel || salvando ? '#e2e8f0' : 'linear-gradient(135deg, #4A7FDB, #2563b8)',
                  color: !escolaSel || salvando ? '#94a3b8' : '#fff',
                  fontWeight: 700, fontSize: '.875rem', cursor: !escolaSel || salvando ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  boxShadow: !escolaSel || salvando ? 'none' : '0 4px 14px rgba(74,127,219,.35)',
                }}>
                  {salvando ? 'Adicionando...' : 'Adicionar ao Pipeline'}
                </button>
                <button onClick={() => setAberto(false)} style={{ padding: '.75rem 1.5rem', borderRadius: 9999, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
