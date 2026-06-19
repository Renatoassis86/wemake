'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

interface Props {
  q: string
  estado: string
  classif: string
  view: string
  page: number
  estados: string[]
  escolas?: { id: string; nome: string; cidade: string | null; estado: string | null }[]
}

export function EscolasToolbar({ q: initialQ, estado: initialEstado, classif, view, page, estados, escolas = [] }: Props) {
  const router = useRouter()
  const [focusSearch, setFocusSearch] = useState(false)
  const [searchVal, setSearchVal] = useState(initialQ)
  const [sugestoes, setSugestoes] = useState<typeof escolas>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef  = useRef<HTMLFormElement>(null)

  // Filtra escolas localmente conforme digita
  useEffect(() => {
    const v = searchVal.trim().toLowerCase()
    if (v.length < 2) { setSugestoes([]); return }
    setSugestoes(
      escolas.filter(e =>
        e.nome.toLowerCase().includes(v) ||
        (e.cidade ?? '').toLowerCase().includes(v)
      ).slice(0, 8)
    )
  }, [searchVal, escolas])

  function selecionarEscola(nome: string) {
    setSearchVal(nome)
    setSugestoes([])
    // Navega direto para a escola selecionada
    router.push(`/comercial/escolas?q=${encodeURIComponent(nome)}&estado=${initialEstado}&classif=${classif}&view=${view}`)
  }

  const buildHref = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({
      q: initialQ, estado: initialEstado, classif, view,
      page: String(page), ...overrides,
    })
    params.forEach((v, k) => { if (!v) params.delete(k) })
    return `/comercial/escolas?${params.toString()}`
  }

  return (
    <form
      ref={formRef}
      className="mp-toolbar"
      style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: '.85rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap',
      }}
    >
      <input type="hidden" name="view" value={view} />
      {classif && <input type="hidden" name="classif" value={classif} />}

      {/* Search com autocomplete */}
      <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 420 }}>
        <Search size={14} style={{
          position: 'absolute', left: 10, top: '50%',
          transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
          zIndex: 1,
        }} />
        <input
          ref={inputRef}
          name="q"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Buscar escola por nome, cidade…"
          onFocus={() => setFocusSearch(true)}
          onBlur={() => setTimeout(() => { setFocusSearch(false); setSugestoes([]) }, 200)}
          autoComplete="off"
          style={{
            width: '100%', paddingLeft: 32, paddingRight: searchVal ? 32 : 12,
            paddingTop: 8, paddingBottom: 8,
            fontSize: '.82rem',
            border: `1.5px solid ${focusSearch ? '#4A7FDB' : '#e2e8f0'}`,
            borderRadius: 8, outline: 'none', color: '#0f172a',
            background: '#f8fafc',
            fontFamily: 'var(--font-inter,sans-serif)',
            boxShadow: focusSearch ? '0 0 0 3px rgba(74,127,219,.12)' : 'none',
            transition: 'border-color .15s, box-shadow .15s',
          }}
        />
        {/* Botão limpar busca */}
        {searchVal && (
          <button type="button" onClick={() => { setSearchVal(''); setSugestoes([]); inputRef.current?.focus() }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}

        {/* Dropdown de sugestões */}
        {sugestoes.length > 0 && focusSearch && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(15,23,42,.12)', zIndex: 50, overflow: 'hidden',
          }}>
            {sugestoes.map(e => (
              <div key={e.id} onMouseDown={() => selecionarEscola(e.nome)}
                style={{
                  padding: '.6rem 1rem', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '.65rem', borderBottom: '1px solid #f8fafc',
                  transition: 'background .1s',
                }}
                onMouseEnter={ev => (ev.currentTarget.style.background = '#fffbeb')}
                onMouseLeave={ev => (ev.currentTarget.style.background = '#fff')}
              >
                {/* Ícone escola */}
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.nome}
                  </div>
                  {(e.cidade || e.estado) && (
                    <div style={{ fontSize: '.68rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {e.cidade}{e.estado ? `/${e.estado}` : ''}
                    </div>
                  )}
                </div>
                {/* Ir direto para ficha */}
                <Link href={`/comercial/escolas/${e.id}`}
                  onMouseDown={ev => ev.stopPropagation()}
                  style={{ width: 24, height: 24, borderRadius: 6, background: '#4A7FDB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
                  title="Ver ficha">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </Link>
                {/* Editar diretamente */}
                <Link href={`/comercial/escolas/${e.id}/editar`}
                  onMouseDown={ev => ev.stopPropagation()}
                  style={{ width: 24, height: 24, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
                  title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estado */}
      <select
        name="estado"
        defaultValue={initialEstado}
        style={{
          padding: '8px 12px', fontSize: '.82rem',
          border: '1.5px solid #e2e8f0', borderRadius: 8,
          background: '#f8fafc', color: '#0f172a', outline: 'none',
          fontFamily: 'var(--font-inter,sans-serif)', cursor: 'pointer',
        }}
      >
        <option value="">Todos os estados</option>
        {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
      </select>

      <button
        type="submit"
        style={{
          background: '#0f172a', color: '#fff', padding: '8px 16px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          fontSize: '.82rem', fontWeight: 700,
          fontFamily: 'var(--font-montserrat,sans-serif)',
          transition: 'background .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0f172a')}
      >
        Filtrar
      </button>

      {(initialQ || initialEstado || classif) && (
        <Link href="/comercial/escolas" style={{
          fontSize: '.78rem', color: '#94a3b8', textDecoration: 'none',
          fontFamily: 'var(--font-inter,sans-serif)',
        }}>
          Limpar filtros
        </Link>
      )}

      {/* View toggle */}
      <div className="mp-view-toggle" style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2,
        background: '#f1f5f9', borderRadius: 8, padding: 3,
      }}>
        {[
          { v: 'table', icon: '☰', label: 'Lista' },
          { v: 'grid',  icon: '⊞', label: 'Cards' },
        ].map(t => (
          <Link key={t.v}
            href={buildHref({ view: t.v })}
            title={t.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 28, borderRadius: 6,
              fontSize: '.85rem', textDecoration: 'none',
              background: view === t.v ? '#fff' : 'transparent',
              color: view === t.v ? '#0f172a' : '#94a3b8',
              boxShadow: view === t.v ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              transition: 'all .15s',
            }}
          >
            {t.icon}
          </Link>
        ))}
      </div>
    </form>
  )
}
