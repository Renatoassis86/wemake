'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  q: string
  uf: string
  cidade?: string
  perfil?: boolean
}

export function PriorizacaoSearch({ q, uf, cidade, perfil }: Props) {
  const [focus, setFocus] = useState(false)
  const [val, setVal] = useState(q)

  return (
    <form
      action="/comercial/priorizacao"
      method="GET"
      style={{
        display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap',
        marginBottom: '1rem',
      }}
    >
      {uf && <input type="hidden" name="uf" value={uf} />}
      {cidade && <input type="hidden" name="cidade" value={cidade} />}
      {perfil && <input type="hidden" name="perfil" value="1" />}

      <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 380 }}>
        <Search size={14} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: '#94A3B8', pointerEvents: 'none',
        }} />
        <input
          name="q"
          value={val}
          onChange={e => setVal(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Buscar por nome ou cidade…"
          autoComplete="off"
          style={{
            width: '100%', paddingLeft: 32, paddingRight: val ? 32 : 12,
            paddingTop: 8, paddingBottom: 8, fontSize: '.8rem',
            border: `1.5px solid ${focus ? '#4A7FDB' : '#E2E8F0'}`,
            borderRadius: 8, outline: 'none', color: '#0F172A',
            background: '#F8FAFC',
            fontFamily: 'var(--font-inter, sans-serif)',
            boxShadow: focus ? '0 0 0 3px rgba(74,127,219,.12)' : 'none',
            transition: 'border-color .15s, box-shadow .15s',
          }}
        />
        {val && (
          <button
            type="button"
            onClick={() => setVal('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
              display: 'flex', padding: 2,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <button
        type="submit"
        style={{
          background: '#0F172A', color: '#fff', padding: '8px 16px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          fontSize: '.78rem', fontWeight: 700,
          fontFamily: 'var(--font-montserrat, sans-serif)',
        }}
      >
        Buscar
      </button>

      {(q || uf || cidade || perfil) && (
        <Link href="/comercial/priorizacao" style={{
          fontSize: '.75rem', color: '#94A3B8', textDecoration: 'none',
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>
          Limpar filtros
        </Link>
      )}
    </form>
  )
}
