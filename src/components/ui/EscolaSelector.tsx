'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

interface Escola {
  id: string
  nome: string
  estado?: string | null
  cidade?: string | null
  origem?: 'crm' | 'lead'
}

interface EscolaSelectorProps {
  escolas: Escola[]
  escolaId: string
  basePath: string
  placeholder?: string
  extraButton?: React.ReactNode
}

export function EscolaSelector({ escolas, escolaId, basePath, placeholder, extraButton }: EscolaSelectorProps) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Separa CRM e leads do banco para agrupamento visual
  const escolasCRM  = escolas.filter(e => e.origem !== 'lead' || !e.id.startsWith('lead:'))
  const escolasLead = escolas.filter(e => e.origem === 'lead' || e.id.startsWith('lead:'))

  // Filtra escolas baseado no texto de busca
  const filtrarEscolas = (lista: Escola[]) => {
    if (!busca.trim()) return lista
    const q = busca.toLowerCase()
    return lista.filter(e =>
      e.nome.toLowerCase().includes(q) ||
      e.cidade?.toLowerCase().includes(q) ||
      e.estado?.toLowerCase().includes(q)
    )
  }

  const crm_filtrado = filtrarEscolas(escolasCRM)
  const lead_filtrado = filtrarEscolas(escolasLead)
  const escolaSelecionada = escolas.find(e => e.id === escolaId)

  const handleSelecion = (id: string) => {
    if (id) router.push(`${basePath}?escola=${encodeURIComponent(id)}`)
    setBusca('')
    setDropdownAberto(false)
  }

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
      <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-m)', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
        Selecionar Escola:
      </label>

      <div ref={containerRef} style={{ position: 'relative', minWidth: 280, maxWidth: 480 }}>
        {/* Input de busca com autocompletar */}
        <input
          type="text"
          placeholder={placeholder ?? 'Digite para buscar escola, cidade ou estado...'}
          value={dropdownAberto ? busca : (escolaSelecionada?.nome ?? '')}
          onChange={e => {
            setBusca(e.target.value)
            setDropdownAberto(true)
          }}
          onFocus={() => setDropdownAberto(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
            }
          }}
          className="form-control"
          style={{
            width: '100%',
            padding: '.6rem .75rem',
            paddingRight: '2rem',
            fontSize: '.85rem',
            fontFamily: 'var(--font-inter, sans-serif)',
            transition: 'border-color .15s',
            borderColor: busca.trim() && dropdownAberto ? '#0ea5e9' : '#e2e8f0',
          }}
          autoComplete="off"
        />

        {/* Ícone dropdown */}
        <svg
          style={{
            position: 'absolute',
            right: '.65rem',
            top: '50%',
            transform: `translateY(-50%) rotate(${dropdownAberto ? 180 : 0}deg)`,
            width: 16,
            height: 16,
            color: '#64748b',
            transition: 'transform .2s',
            pointerEvents: 'none',
          }}
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>

        {/* Dropdown de resultados com autocompletar */}
        {dropdownAberto && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '.4rem',
            background: '#fff',
            border: `1.5px solid ${busca.trim() ? '#0ea5e9' : '#e2e8f0'}`,
            borderRadius: 10,
            boxShadow: busca.trim() ? '0 8px 24px rgba(14,165,233,.15)' : '0 8px 24px rgba(0,0,0,.12)',
            zIndex: 1000,
            maxHeight: 320,
            overflowY: 'auto',
            transition: 'border-color .15s, box-shadow .15s',
          }}>
            {/* CRM */}
            {crm_filtrado.length > 0 && (
              <div>
                <div style={{
                  padding: '.6rem .75rem',
                  fontSize: '.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#0ea5e9',
                  letterSpacing: '.05em',
                  background: '#f0f9ff',
                  borderBottom: '1px solid #bfdbfe',
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>✓ Escolas no CRM</span>
                  <span style={{ background: '#0ea5e9', color: '#fff', borderRadius: 99, padding: '.1rem .5rem', fontSize: '.65rem' }}>{crm_filtrado.length}</span>
                </div>
                {crm_filtrado.map(e => (
                  <div
                    key={e.id}
                    onClick={() => handleSelecion(e.id)}
                    style={{
                      padding: '.6rem .75rem',
                      cursor: 'pointer',
                      fontSize: '.85rem',
                      color: '#0f172a',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'all .15s',
                      background: escolaId === e.id ? '#eff6ff' : 'transparent',
                      borderLeft: escolaId === e.id ? '3px solid #0ea5e9' : '3px solid transparent',
                      paddingLeft: '0.55rem',
                    }}
                    onMouseEnter={(evt) => (evt.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(evt) => (evt.currentTarget.style.background = escolaId === e.id ? '#eff6ff' : 'transparent')}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.nome}</div>
                    <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.2rem' }}>
                      {e.cidade && e.estado ? `${e.cidade}/${e.estado}` : e.cidade ?? e.estado ?? ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leads */}
            {lead_filtrado.length > 0 && (
              <div>
                <div style={{
                  padding: '.6rem .75rem',
                  fontSize: '.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#d97706',
                  letterSpacing: '.05em',
                  background: '#fef3c7',
                  borderBottom: '1px solid #fcd34d',
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>◈ Banco de Leads</span>
                  <span style={{ background: '#d97706', color: '#fff', borderRadius: 99, padding: '.1rem .5rem', fontSize: '.65rem' }}>{lead_filtrado.length}</span>
                </div>
                {lead_filtrado.map(e => (
                  <div
                    key={e.id}
                    onClick={() => handleSelecion(e.id)}
                    style={{
                      padding: '.6rem .75rem',
                      cursor: 'pointer',
                      fontSize: '.85rem',
                      color: '#0f172a',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'all .15s',
                      background: escolaId === e.id ? '#eff6ff' : 'transparent',
                      borderLeft: escolaId === e.id ? '3px solid #0ea5e9' : '3px solid transparent',
                      paddingLeft: '0.55rem',
                      opacity: 0.8,
                    }}
                    onMouseEnter={(evt) => (evt.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(evt) => (evt.currentTarget.style.background = escolaId === e.id ? '#eff6ff' : 'transparent')}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.nome}</div>
                    <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.2rem' }}>
                      {e.cidade && e.estado ? `${e.cidade}/${e.estado}` : e.cidade ?? e.estado ?? ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vazio */}
            {crm_filtrado.length === 0 && lead_filtrado.length === 0 && (
              <div style={{
                padding: '1.5rem',
                textAlign: 'center',
                fontSize: '.82rem',
                color: '#94a3b8',
                fontFamily: 'var(--font-inter,sans-serif)',
              }}>
                {busca.trim()
                  ? <>
                      <div style={{ marginBottom: '.5rem' }}>🔍 Nenhuma escola encontrada</div>
                      <div style={{ fontSize: '.7rem', color: '#cbd5e1' }}>
                        Tente outro nome, cidade ou estado
                      </div>
                    </>
                  : <>
                      <div style={{ marginBottom: '.5rem' }}>Carregando escolas...</div>
                      <div style={{ fontSize: '.7rem', color: '#cbd5e1' }}>
                        Digite para buscar ou escolha abaixo
                      </div>
                    </>
                }
              </div>
            )}
          </div>
        )}
      </div>

      {extraButton}
    </div>
  )
}
