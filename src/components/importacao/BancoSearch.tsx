'use client'

import { useState, useEffect, useRef } from 'react'

interface EscolaResult {
  id: string
  nome: string
  cidade: string
  estado: string
  cnpj?: string
  contato_nome?: string
  contato_cargo?: string
  qtd_alunos?: number
  classificacao_atual?: string
}

interface LeadResult {
  id: string
  nome: string
  escola_nome?: string
  cargo?: string
  email?: string
  tel_celular?: string
  cidade?: string
  uf?: string
  tipo_inscricao?: string
  qtd_alunos_total?: number
}

interface SearchResult {
  escolas: EscolaResult[]
  leads: LeadResult[]
}

export function BancoSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.trim().length < 2) { setResult(null); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/buscar-escola?q=${encodeURIComponent(query)}`)
      if (res.ok) setResult(await res.json())
      setLoading(false)
    }, 300)
  }, [query])

  const inp: React.CSSProperties = {
    width: '100%', padding: '.75rem 1rem .75rem 2.8rem', fontSize: '.95rem',
    fontFamily: 'var(--font-inter,sans-serif)', border: '2px solid #e2e8f0',
    borderRadius: 10, background: '#fff', color: '#0f172a', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const total = (result?.escolas.length ?? 0) + (result?.leads.length ?? 0)

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
      <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.65rem' }}>
        Buscar escola ou pessoa no banco de dados
      </div>

      {/* Input com ícone */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Digite o nome da escola ou pessoa..."
          style={inp}
          autoFocus
        />
        {loading && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A7FDB" strokeWidth="2" style={{ position: 'absolute', right: '.9rem', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        )}
      </div>

      {/* Resultado — Escolas no CRM */}
      {result && result.escolas.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4A7FDB' }} />
            Escolas no CRM ({result.escolas.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
            {result.escolas.map(e => (
              <div
                key={e.id}
                onClick={() => window.location.href = `/comercial/escolas/${e.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={el => { el.currentTarget.style.borderColor = '#4A7FDB'; el.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={el => { el.currentTarget.style.borderColor = '#e2e8f0'; el.currentTarget.style.background = '#f8fafc' }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '.15rem' }}>{e.nome}</div>
                  <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    {[e.cidade, e.estado].filter(Boolean).join(' · ')}
                    {e.contato_nome && ` · ${e.contato_nome}`}
                    {e.qtd_alunos && ` · ${e.qtd_alunos.toLocaleString('pt-BR')} alunos`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexShrink: 0 }}>
                  {e.classificacao_atual && (
                    <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: 99, background: e.classificacao_atual === 'quente' ? '#fef2f2' : e.classificacao_atual === 'morno' ? '#fefce8' : '#f0f9ff', color: e.classificacao_atual === 'quente' ? '#dc2626' : e.classificacao_atual === 'morno' ? '#d97706' : '#0369a1', fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'capitalize' as const }}>
                      {e.classificacao_atual}
                    </span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultado — Leads/contatos */}
      {result && result.leads.length > 0 && (
        <div>
          <div style={{ fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
            Leads / contatos ({result.leads.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
            {result.leads.map(l => (
              <div key={l.id}>
                <div
                  onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1rem', borderRadius: expandedLead === l.id ? '10px 10px 0 0' : 10, border: '1.5px solid #e2e8f0', borderBottom: expandedLead === l.id ? '1px solid #f1f5f9' : '1.5px solid #e2e8f0', background: expandedLead === l.id ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={el => { if (expandedLead !== l.id) { el.currentTarget.style.borderColor = '#86efac'; el.currentTarget.style.background = '#f0fdf4' } }}
                  onMouseLeave={el => { if (expandedLead !== l.id) { el.currentTarget.style.borderColor = '#e2e8f0'; el.currentTarget.style.background = '#f8fafc' } }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '.15rem' }}>{l.nome}</div>
                    <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {l.escola_nome && <span style={{ color: '#4A7FDB', fontWeight: 600 }}>{l.escola_nome}</span>}
                      {l.cargo && ` · ${l.cargo}`}
                      {l.cidade && ` · ${l.cidade}/${l.uf}`}
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ transform: expandedLead === l.id ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                {expandedLead === l.id && (
                  <div style={{ border: '1.5px solid #86efac', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '1rem', background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
                    {[
                      { label: 'E-mail', value: l.email },
                      { label: 'Telefone', value: l.tel_celular },
                      { label: 'Cargo', value: l.cargo },
                      { label: 'Escola', value: l.escola_nome },
                      { label: 'Cidade / UF', value: l.cidade && l.uf ? `${l.cidade} / ${l.uf}` : l.cidade ?? l.uf },
                      { label: 'Tipo inscrição', value: l.tipo_inscricao },
                      { label: 'Qtd. alunos', value: l.qtd_alunos_total?.toLocaleString('pt-BR') },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.15rem' }}>{f.label}</div>
                        <div style={{ fontSize: '.78rem', color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', fontWeight: 500 }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sem resultados */}
      {result && total === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.82rem' }}>
          Nenhum resultado para <strong style={{ color: '#475569' }}>&quot;{query}&quot;</strong>
        </div>
      )}

      {/* Estado inicial */}
      {!result && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.82rem' }}>
          Digite pelo menos 2 caracteres para buscar
        </div>
      )}
    </div>
  )
}
