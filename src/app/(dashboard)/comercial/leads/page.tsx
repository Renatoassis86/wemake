import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency, formatDate, diasDesdeData } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import { LABEL } from '@/types/database'

interface Props {
  searchParams: Promise<{ q?: string; classif?: string; estado?: string }>
}

// Estilos locais reutilizáveis
const S = {
  page:    { padding: '2rem 2.5rem' } as React.CSSProperties,
  label:   { display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.06em', color: '#64748b', marginBottom: '.4rem' },
  card:    { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: '1.25rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)' } as React.CSSProperties,
}

const CLASSIF_COR = {
  quente: { bg: '#fef2f2', text: '#dc2626', dot: '#dc2626', border: '#fca5a5' },
  morno:  { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b', border: '#fcd34d' },
  frio:   { bg: '#eff6ff', text: '#2563eb', dot: '#60a5fa', border: '#93c5fd' },
} as Record<string, { bg: string; text: string; dot: string; border: string }>

export default async function LeadsPage({ searchParams }: Props) {
  const params  = await searchParams
  const q       = params.q       ?? ''
  const classif = params.classif ?? ''
  const estado  = params.estado  ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('escolas_resumo')
    .select('*')
    .eq('ativa', true)
    .order('nome')

  if (q)       query = query.ilike('nome', `%${q}%`)
  if (estado)  query = query.eq('estado', estado)
  if (classif) query = query.eq('classificacao_atual', classif)

  const { data: escolas } = await query

  const [
    { count: nQ },
    { count: nM },
    { count: nF },
    { data: estadosRaw },
  ] = await Promise.all([
    supabase.from('escolas_resumo').select('*', { count: 'exact', head: true }).eq('ativa', true).eq('classificacao_atual', 'quente'),
    supabase.from('escolas_resumo').select('*', { count: 'exact', head: true }).eq('ativa', true).eq('classificacao_atual', 'morno'),
    supabase.from('escolas_resumo').select('*', { count: 'exact', head: true }).eq('ativa', true).eq('classificacao_atual', 'frio'),
    supabase.from('escolas').select('estado').eq('ativa', true).not('estado', 'is', null),
  ])

  const estados = [...new Set(estadosRaw?.map((e: any) => e.estado).filter(Boolean))].sort() as string[]

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${escolas?.length ?? 0} leads`}
        actions={
          <Link href="/comercial/escolas/nova" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            background: '#d97706', color: '#fff', padding: '.45rem 1rem',
            borderRadius: 9999, fontSize: '.82rem', fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 4px 12px rgba(217,119,6,.3)',
            fontFamily: 'var(--font-montserrat,sans-serif)',
          }}>
            <Plus size={14} /> Novo Lead
          </Link>
        }
      />

      <div style={S.page}>

        {/* KPIs de funil */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Quentes', value: nQ ?? 0, classif: 'quente' },
            { label: 'Mornos',  value: nM ?? 0, classif: 'morno'  },
            { label: 'Frios',   value: nF ?? 0, classif: 'frio'   },
          ].map(k => {
            const cor = CLASSIF_COR[k.classif]
            const active = classif === k.classif
            return (
              <Link key={k.classif}
                href={`/comercial/leads?classif=${active ? '' : k.classif}&q=${q}&estado=${estado}`}
                style={{
                  display: 'block', textDecoration: 'none',
                  background: active ? cor.bg : '#fff',
                  border: `1.5px solid ${active ? cor.border : '#e2e8f0'}`,
                  borderTop: `3px solid ${cor.dot}`,
                  borderRadius: 14, padding: '1.25rem 1.5rem',
                  boxShadow: active ? `0 4px 16px ${cor.dot}20` : '0 1px 4px rgba(0,0,0,.04)',
                  transition: 'all .2s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: cor.text, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.35rem' }}>
                      {k.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: active ? cor.text : '#0f172a' }}>
                      {k.value}
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Filtros */}
        <form style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
            <input name="q" defaultValue={q} placeholder="Buscar escola, cidade..."
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: '.82rem', border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', color: '#0f172a', background: '#f8fafc', fontFamily: 'var(--font-inter,sans-serif)', boxSizing: 'border-box' }} />
          </div>
          <select name="estado" defaultValue={estado} style={{ padding: '9px 12px', fontSize: '.82rem', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#0f172a', outline: 'none', fontFamily: 'var(--font-inter,sans-serif)' }}>
            <option value="">Todos os estados</option>
            {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          {classif && <input type="hidden" name="classif" value={classif} />}
          <button type="submit" style={{ background: '#0f172a', color: '#fff', padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Filtrar
          </button>
          {(q || estado || classif) && (
            <Link href="/comercial/leads" style={{ fontSize: '.78rem', color: '#475569', textDecoration: 'none', fontFamily: 'var(--font-inter,sans-serif)' }}>Limpar</Link>
          )}
        </form>

        {/* Grid de leads */}
        {escolas && escolas.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
            {escolas.map((e: any) => {
              const cor = CLASSIF_COR[e.classificacao_atual ?? 'frio'] ?? CLASSIF_COR.frio
              const diasSemContato = diasDesdeData(e.ultimo_contato)
              const atrasado = diasSemContato != null && diasSemContato > 14
              return (
                <div key={e.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${cor.dot}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)', transition: 'box-shadow .2s' }}>
                  <div style={{ padding: '1.25rem 1.5rem' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/comercial/escolas/${e.id}`} style={{ fontWeight: 700, fontSize: '.9rem', color: '#0f172a', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>
                          {e.nome}
                        </Link>
                        <div style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                          {e.cidade}{e.estado ? `, ${e.estado}` : ''}
                        </div>
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                        background: cor.bg, color: cor.text, border: `1px solid ${cor.border}`,
                        padding: '.2rem .65rem', borderRadius: 99,
                        fontSize: '.65rem', fontWeight: 700, flexShrink: 0, marginLeft: '.5rem',
                        fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.05em',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cor.dot, display: 'inline-block' }} />
                        {e.classificacao_atual === 'quente' ? 'Quente' : e.classificacao_atual === 'morno' ? 'Morno' : 'Frio'}
                      </span>
                    </div>

                    {/* Métricas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '.65rem .85rem' }}>
                        <div style={{ fontSize: '.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, marginBottom: '.2rem' }}>Alunos</div>
                        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{e.total_alunos ?? 0}</div>
                      </div>
                      <div style={{ background: '#fffbeb', borderRadius: 8, padding: '.65rem .85rem', border: '1px solid #fef3c7' }}>
                        <div style={{ fontSize: '.6rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, marginBottom: '.2rem' }}>Potencial</div>
                        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#d97706' }}>{formatCurrency(e.potencial_financeiro ?? 0)}</div>
                      </div>
                    </div>

                    {/* Probabilidade */}
                    {e.probabilidade_atual != null && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                          <span style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Probabilidade</span>
                          <span style={{ fontSize: '.68rem', fontWeight: 800, color: cor.text, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{e.probabilidade_atual}%</span>
                        </div>
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 2, background: cor.dot, width: `${e.probabilidade_atual}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Contato e ações */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '.85rem', borderTop: '1px solid #f1f5f9', gap: '.5rem' }}>
                      <div style={{ fontSize: '.68rem', color: atrasado ? '#dc2626' : '#94a3b8', fontWeight: atrasado ? 700 : 400, fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {e.ultimo_contato
                          ? atrasado ? `${diasSemContato}d sem contato` : `Contato: ${formatDate(e.ultimo_contato)}`
                          : 'Sem interações'}
                      </div>
                      <div style={{ display: 'flex', gap: '.35rem' }}>
                        <Link href={`/comercial/registros/novo?escola=${e.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: '#d97706', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 700 }} title="Novo registro">+</Link>
                        <Link href={`/comercial/escolas/${e.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', color: '#475569', textDecoration: 'none', fontSize: '.75rem', fontWeight: 700 }} title="Ver ficha">→</Link>
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto .75rem' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', color: '#0f172a', marginBottom: '.4rem' }}>
              {q ? `Nenhum resultado para "${q}"` : 'Nenhum lead encontrado'}
            </h3>
            <p style={{ fontSize: '.85rem', color: '#475569', marginBottom: '1.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
              Cadastre escolas para começar a gerenciar seus leads.
            </p>
            <Link href="/comercial/escolas/nova" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#d97706', color: '#fff', padding: '.55rem 1.25rem', borderRadius: 9999, textDecoration: 'none', fontSize: '.85rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              <Plus size={14} /> Cadastrar Lead
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
