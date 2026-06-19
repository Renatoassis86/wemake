import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import { LABEL } from '@/types/database'
import { DeleteRegistroBtn } from '@/components/comercial/DeleteRegistroBtn'

interface Props { searchParams: Promise<{ q?: string; classif?: string; page?: string }> }

export default async function RegistrosPage({ searchParams }: Props) {
  const params  = await searchParams
  const q       = params.q      ?? ''
  const classif = params.classif ?? ''
  const page    = parseInt(params.page ?? '1')
  const perPage = 30
  const from    = (page - 1) * perPage
  const to      = from + perPage - 1

  const supabase = await createClient()

  let query = supabase
    .from('registros')
    .select('*, escola:escolas(id,nome,cidade,estado)', { count: 'exact' })
    .order('data_contato', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q)       query = query.ilike('resumo', `%${q}%`)
  if (classif) query = query.eq('classificacao', classif)

  const { data: registros, count } = await query

  const totalPages = Math.ceil((count ?? 0) / perPage)

  const CLASSIF_COR: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    quente: { bg: '#fef2f2', text: '#dc2626', dot: '#dc2626', border: '#fca5a5' },
    morno:  { bg: '#fffbeb', text: '#4A7FDB', dot: '#f59e0b', border: '#fcd34d' },
    frio:   { bg: '#eff6ff', text: '#2563eb', dot: '#60a5fa', border: '#93c5fd' },
  }

  const MEIO_SVG: Record<string, React.ReactNode> = {
    presencial: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    whatsapp:   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    email:      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    telefone:   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6.29 6.29l1.62-1.34a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    videoconf:  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  }

  return (
    <div>
      <PageHeader
        title="Registros de Interação"
        subtitle={`${count ?? 0} registro${(count ?? 0) !== 1 ? 's' : ''}`}
        actions={
          <Link href="/comercial/registros/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#4A7FDB', color: '#fff', padding: '.45rem 1rem', borderRadius: 9999, fontSize: '.82rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(74,127,219,.3)', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            <Plus size={14} /> Novo Registro
          </Link>
        }
      />

      <div style={{ padding: '2rem 2.5rem' }}>

        {/* Filtros */}
        <form style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
            <input name="q" defaultValue={q} placeholder="Buscar no resumo..."
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: '.82rem', border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', color: '#0f172a', background: '#f8fafc', fontFamily: 'var(--font-inter,sans-serif)', boxSizing: 'border-box' }} />
          </div>
          {/* Filtro por classificação */}
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {['quente','morno','frio'].map(c => {
              const cor = CLASSIF_COR[c]
              return (
                <Link key={c}
                  href={`/comercial/registros?q=${q}&classif=${classif === c ? '' : c}`}
                  style={{
                    padding: '6px 14px', borderRadius: 9999, fontSize: '.72rem', fontWeight: 700,
                    textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '.05em',
                    background: classif === c ? cor.bg : '#f8fafc',
                    color: classif === c ? cor.text : '#64748b',
                    border: `1.5px solid ${classif === c ? cor.border : '#e2e8f0'}`,
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>
                  {c === 'quente' ? 'Quentes' : c === 'morno' ? 'Mornos' : 'Frios'}
                </Link>
              )
            })}
          </div>
          <button type="submit" style={{ background: '#0f172a', color: '#fff', padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Buscar
          </button>
          {(q || classif) && <Link href="/comercial/registros" style={{ fontSize: '.78rem', color: '#475569', textDecoration: 'none' }}>Limpar</Link>}
        </form>

        {/* Tabela */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          {registros && registros.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Escola', 'Data', 'Meio', 'Resumo', 'Interesse', 'Prontidão', 'Status', 'Potencial', ''].map(col => (
                      <th key={col} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.65)', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r: any, idx: number) => {
                    const cor = CLASSIF_COR[r.classificacao ?? 'frio'] ?? CLASSIF_COR.frio
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <Link href={`/comercial/escolas/${r.escola_id}`} style={{ fontWeight: 700, fontSize: '.82rem', color: '#0f172a', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(r.escola as any)?.nome ?? '—'}
                          </Link>
                          <div style={{ fontSize: '.68rem', color: '#475569' }}>{(r.escola as any)?.cidade}{(r.escola as any)?.estado ? `, ${(r.escola as any).estado}` : ''}</div>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{formatDate(r.data_contato)}</div>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={LABEL.meio_contato?.[r.meio_contato] ?? r.meio_contato}>
                            {MEIO_SVG[r.meio_contato] ?? MEIO_SVG.email}
                          </div>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle', maxWidth: 280 }}>
                          <div style={{ fontSize: '.82rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {r.resumo}
                          </div>
                          {r.contato_nome && <div style={{ fontSize: '.68rem', color: '#475569', marginTop: '.15rem' }}>{r.contato_nome}{r.contato_cargo ? ` (${r.contato_cargo})` : ''}</div>}
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '.7rem', color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>
                            {LABEL.interesse?.[r.interesse] ?? r.interesse}
                          </span>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '.68rem', background: '#f1f5f9', color: '#475569', padding: '.2rem .55rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {LABEL.prontidao?.[r.prontidao] ?? r.prontidao}
                          </span>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', background: cor.bg, color: cor.text, border: `1px solid ${cor.border}`, padding: '.2rem .6rem', borderRadius: 99, fontSize: '.65rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cor.dot, display: 'inline-block' }} />
                            {r.classificacao === 'quente' ? 'Quente' : r.classificacao === 'morno' ? 'Morno' : 'Frio'}
                          </div>
                          <div style={{ fontSize: '.62rem', color: '#475569', marginTop: '.2rem', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>
                            {r.probabilidade}%
                          </div>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem', fontWeight: 700, color: '#16a34a' }}>
                            {formatCurrency(r.potencial_financeiro ?? 0)}
                          </span>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                            <Link href={`/comercial/registros/novo?escola=${r.escola_id}&edit=${r.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', color: '#475569', textDecoration: 'none' }} title="Editar registro">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </Link>
                            <DeleteRegistroBtn registroId={r.id} escolaId={r.escola_id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto .75rem' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', color: '#0f172a', marginBottom: '.4rem' }}>Nenhum registro encontrado</h3>
              <Link href="/comercial/registros/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#4A7FDB', color: '#fff', padding: '.55rem 1.25rem', borderRadius: 9999, textDecoration: 'none', fontSize: '.85rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', marginTop: '.75rem' }}>
                <Plus size={14} /> Novo Registro
              </Link>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div style={{ padding: '.85rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                Página <strong style={{ color: '#0f172a' }}>{page}</strong> de <strong style={{ color: '#0f172a' }}>{totalPages}</strong>
              </span>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                {page > 1 && <Link href={`?page=${page - 1}&q=${q}&classif=${classif}`} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', fontSize: '.78rem', color: '#475569', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>← Anterior</Link>}
                {page < totalPages && <Link href={`?page=${page + 1}&q=${q}&classif=${classif}`} style={{ padding: '6px 14px', borderRadius: 7, background: '#4A7FDB', color: '#fff', fontSize: '.78rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Próxima →</Link>}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
