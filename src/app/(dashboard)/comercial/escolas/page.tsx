import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency, formatDate, diasDesdeData } from '@/lib/utils'
import { Plus, MapPin, Users, ChevronRight } from 'lucide-react'
import { LABEL } from '@/types/database'
import { EscolasToolbar } from './EscolasToolbar'
import { MigrarLeadsBtn } from '@/components/comercial/MigrarLeadsBtn'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string; estado?: string; page?: string; view?: string; classif?: string }>
}

const CLASSIF_COR: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  quente: { bg: '#fef2f2', text: '#dc2626', dot: '#dc2626', border: '#fca5a5' },
  morno:  { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b', border: '#fcd34d' },
  frio:   { bg: '#eff6ff', text: '#2563eb', dot: '#60a5fa', border: '#93c5fd' },
}

export default async function EscolasPage({ searchParams }: Props) {
  const params  = await searchParams
  const q       = params.q       ?? ''
  const estado  = params.estado  ?? ''
  const classif = params.classif ?? ''
  const view    = params.view    ?? 'table'
  const page    = parseInt(params.page ?? '1')
  const perPage = 20
  const from    = (page - 1) * perPage
  const to      = from + perPage - 1

  const supabase = await createClient()

  // Query principal — busca diretamente da tabela escolas para garantir dados frescos
  let query = supabase
    .from('escolas')
    .select('*', { count: 'exact' })
    .eq('ativa', true)
    .range(from, to)
    .order('nome')

  if (q)       query = query.ilike('nome', `%${q}%`)
  if (estado)  query = query.eq('estado', estado)
  if (classif) query = query.eq('classificacao_atual', classif)

  const { data: escolas, count } = await query

  // KPIs e estados em paralelo — usando tabela escolas direto
  const [
    { count: nQ },
    { count: nM },
    { count: nF },
    { data: estadosRaw },
  ] = await Promise.all([
    supabase.from('escolas').select('*', { count: 'exact', head: true }).eq('ativa', true).eq('classificacao_atual', 'quente'),
    supabase.from('escolas').select('*', { count: 'exact', head: true }).eq('ativa', true).eq('classificacao_atual', 'morno'),
    supabase.from('escolas').select('*', { count: 'exact', head: true }).eq('ativa', true).eq('classificacao_atual', 'frio'),
    supabase.from('escolas').select('estado').eq('ativa', true).not('estado', 'is', null),
  ])

  const estados   = [...new Set(estadosRaw?.map((e: any) => e.estado).filter(Boolean))].sort() as string[]
  const totalPages = Math.ceil((count ?? 0) / perPage)
  const totalEscolas = (nQ ?? 0) + (nM ?? 0) + (nF ?? 0)

  // SVGs monocromáticos para os KPIs (sem emojis)
  const kpiIcon = (classif: string, color: string) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {classif === 'quente'
        ? <><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><polyline points="12 6 12 12 16 14"/></>
        : classif === 'morno'
        ? <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>
        : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
      }
    </svg>
  )

  const kpis = [
    { label: 'Quentes',  value: nQ ?? 0, classif: 'quente', pct: totalEscolas ? Math.round(((nQ ?? 0) / totalEscolas) * 100) : 0 },
    { label: 'Mornos',   value: nM ?? 0, classif: 'morno',  pct: totalEscolas ? Math.round(((nM ?? 0) / totalEscolas) * 100) : 0 },
    { label: 'Frios',    value: nF ?? 0, classif: 'frio',   pct: totalEscolas ? Math.round(((nF ?? 0) / totalEscolas) * 100) : 0 },
  ]

  return (
    <div>
      <PageHeader
        title="Escolas / Parceiros"
        subtitle={`${count ?? 0} resultado${(count ?? 0) !== 1 ? 's' : ''}`}
        actions={
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {/* Importar do banco de leads */}
            <MigrarLeadsBtn />
            <Link href="/comercial/escolas/nova" style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              background: '#d97706', color: '#fff', padding: '.45rem 1rem',
              borderRadius: 9999, fontSize: '.82rem', fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 4px 12px rgba(217,119,6,.3)',
              fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              <Plus size={14} /> Nova Escola
            </Link>
          </div>
        }
      />

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── KPI pills clicáveis ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {kpis.map(k => {
            const cor = CLASSIF_COR[k.classif]
            const isActive = classif === k.classif
            return (
              <Link
                key={k.classif}
                href={`/comercial/escolas?classif=${isActive ? '' : k.classif}&q=${q}&estado=${estado}&view=${view}`}
                style={{
                  display: 'block', textDecoration: 'none',
                  background: isActive ? cor.bg : '#fff',
                  border: `1.5px solid ${isActive ? cor.border : '#e2e8f0'}`,
                  borderRadius: 14, padding: '1.1rem 1.25rem',
                  boxShadow: isActive ? `0 4px 20px ${cor.dot}20` : '0 1px 3px rgba(0,0,0,.05)',
                  transition: 'all .2s',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Barra de accent */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: cor.dot, borderRadius: '14px 14px 0 0',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '.4rem',
                      marginBottom: '.4rem',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: cor.dot,
                        boxShadow: `0 0 0 3px ${cor.dot}25`,
                      }} />
                      <span style={{
                        fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '.07em', color: cor.text,
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                      }}>
                        {k.label}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-cormorant,serif)',
                      fontSize: '2rem', fontWeight: 800, lineHeight: 1,
                      color: isActive ? cor.text : '#0f172a',
                    }}>
                      {k.value}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '.25rem', opacity: isActive ? 1 : .45 }}>
                      {kpiIcon(k.classif, cor.dot)}
                    </div>
                    <div style={{
                      fontSize: '.72rem', fontWeight: 700, color: cor.text,
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                    }}>
                      {k.pct}%
                    </div>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div style={{ marginTop: '.85rem', height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: cor.dot,
                    width: `${k.pct}%`,
                    transition: 'width .6s ease',
                  }} />
                </div>

                {isActive && (
                  <div style={{
                    position: 'absolute', top: '.6rem', right: '.6rem',
                    background: cor.dot, color: '#fff',
                    fontSize: '.55rem', fontWeight: 800, padding: '.1rem .35rem',
                    borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)',
                    textTransform: 'uppercase', letterSpacing: '.05em',
                  }}>
                    Filtrado
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* ── Toolbar (Client Component) ───────────────────────── */}
        <EscolasToolbar
          q={q} estado={estado} classif={classif}
          view={view} page={page} estados={estados}
          escolas={(escolas ?? []).map((e: any) => ({ id: e.id, nome: e.nome, cidade: e.cidade, estado: e.estado }))}
        />

        {/* ── Conteúdo ─────────────────────────────────────────── */}
        {escolas && escolas.length > 0 ? (

          view === 'grid' ? (
            /* ── Grid de cards ─────────────────────────────────── */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1rem' }}>
              {escolas.map((e: any) => {
                const cor = CLASSIF_COR[e.classificacao_atual ?? 'frio']
                const diasSemContato = diasDesdeData(e.ultimo_contato)
                return (
                  <Link key={e.id} href={`/comercial/escolas/${e.id}`} style={{
                    textDecoration: 'none', display: 'block',
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderTop: `3px solid ${cor.dot}`,
                    borderRadius: 14,
                    boxShadow: '0 2px 8px rgba(15,23,42,.05)',
                    transition: 'all .2s', overflow: 'hidden',
                  }}
                  >
                    <div style={{ padding: '1.1rem 1.25rem' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.85rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'var(--font-montserrat,sans-serif)',
                            fontWeight: 700, fontSize: '.9rem', color: '#0f172a',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: '.2rem',
                          }}>
                            {e.nome}
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '.25rem',
                            fontSize: '.72rem', color: '#64748b',
                            fontFamily: 'var(--font-inter,sans-serif)',
                          }}>
                            <MapPin size={11} />
                            {e.cidade}{e.estado ? `, ${e.estado}` : ''}
                          </div>
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '.25rem',
                          background: cor.bg, color: cor.text,
                          border: `1px solid ${cor.border}`,
                          padding: '.2rem .55rem', borderRadius: 99,
                          fontSize: '.62rem', fontWeight: 700,
                          fontFamily: 'var(--font-montserrat,sans-serif)',
                          textTransform: 'uppercase', letterSpacing: '.05em',
                          flexShrink: 0, marginLeft: '.5rem',
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: cor.dot }} />
                          {e.classificacao_atual === 'quente' ? 'Quente' : e.classificacao_atual === 'morno' ? 'Morno' : 'Frio'}
                        </div>
                      </div>

                      {/* Badges de perfil */}
                      <div style={{ display: 'flex', gap: '.35rem', marginBottom: '.9rem', flexWrap: 'wrap' }}>
                        {e.escola_paideia && (
                          <span style={{ fontSize: '.6rem', fontWeight: 700, background: '#ccfbf1', color: '#134e4a', padding: '.15rem .5rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                            Paideia
                          </span>
                        )}
                        {e.perfil_pedagogico && (
                          <span style={{ fontSize: '.6rem', background: '#f1f5f9', color: '#475569', padding: '.15rem .5rem', borderRadius: 99, fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {LABEL.perfil_pedagogico?.[e.perfil_pedagogico] ?? e.perfil_pedagogico}
                          </span>
                        )}
                      </div>

                      {/* Métricas */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.9rem' }}>
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '.5rem .75rem' }}>
                          <div style={{ fontSize: '.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700 }}>Alunos</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{e.total_alunos ?? 0}</div>
                        </div>
                        <div style={{ background: '#fffbeb', borderRadius: 8, padding: '.5rem .75rem', border: '1px solid #fef3c7' }}>
                          <div style={{ fontSize: '.6rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700 }}>Potencial</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#d97706', lineHeight: 1.2 }}>{formatCurrency(e.potencial_financeiro ?? 0)}</div>
                        </div>
                      </div>

                      {/* Probabilidade */}
                      {e.probabilidade_atual != null && (
                        <div style={{ marginBottom: '.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                            <span style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Probabilidade de fechamento</span>
                            <span style={{ fontSize: '.68rem', fontWeight: 800, color: cor.text, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{e.probabilidade_atual}%</span>
                          </div>
                          <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: cor.dot, width: `${e.probabilidade_atual}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingTop: '.75rem', borderTop: '1px solid #f1f5f9',
                      }}>
                        <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                          {e.ultimo_contato
                            ? diasSemContato != null && diasSemContato > 14
                              ? <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠ {diasSemContato}d sem contato</span>
                              : `Contato: ${formatDate(e.ultimo_contato)}`
                            : 'Sem interações'
                          }
                        </div>
                        <ChevronRight size={14} style={{ color: '#cbd5e1' }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            /* ── Tabela premium ─────────────────────────────────── */
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      {['Escola', 'Localidade', 'Contato', 'Alunos', 'Potencial', 'Status', 'Último contato', ''].map(col => (
                        <th key={col} style={{
                          padding: '.7rem 1rem', textAlign: col === 'Alunos' || col === 'Potencial' ? 'right' : 'left',
                          fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                          color: 'rgba(255,255,255,.65)', whiteSpace: 'nowrap',
                          fontFamily: 'var(--font-montserrat,sans-serif)', borderBottom: 'none',
                        }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {escolas.map((e: any, idx: number) => {
                      const cor = CLASSIF_COR[e.classificacao_atual ?? 'frio']
                      const diasSemContato = diasDesdeData(e.ultimo_contato)
                      const atrasado = diasSemContato != null && diasSemContato > 14
                      return (
                        <tr key={e.id} style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#fff' : '#fafafa',
                          transition: 'background .12s',
                        }}
                        >
                          {/* Nome */}
                          <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
                              <Link href={`/comercial/escolas/${e.id}`} style={{
                                fontWeight: 700, fontSize: '.875rem', color: '#0f172a',
                                textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)',
                                transition: 'color .15s',
                              }}
                              >
                                {e.nome}
                              </Link>
                              {e.escola_paideia && (
                                <span style={{ fontSize: '.58rem', fontWeight: 700, background: '#ccfbf1', color: '#134e4a', padding: '.1rem .4rem', borderRadius: 99, width: 'fit-content', fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                  Paideia
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Localidade */}
                          <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.82rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                              <MapPin size={12} style={{ color: '#475569', flexShrink: 0 }} />
                              {e.cidade}{e.estado ? `, ${e.estado}` : '—'}
                            </div>
                          </td>

                          {/* Contato */}
                          <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                            {e.contato_nome ? (
                              <div>
                                <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{e.contato_nome}</div>
                                <div style={{ fontSize: '.7rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{e.contato_cargo}</div>
                              </div>
                            ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>

                          {/* Alunos */}
                          <td style={{ padding: '.85rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '.3rem' }}>
                              <Users size={12} style={{ color: '#475569' }} />
                              <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                                {e.total_alunos ?? 0}
                              </span>
                            </div>
                          </td>

                          {/* Potencial */}
                          <td style={{ padding: '.85rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                            <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>
                              {formatCurrency(e.potencial_financeiro ?? 0)}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                              background: cor.bg, color: cor.text,
                              border: `1px solid ${cor.border}`,
                              padding: '.25rem .65rem', borderRadius: 99,
                              fontSize: '.65rem', fontWeight: 700,
                              fontFamily: 'var(--font-montserrat,sans-serif)',
                              textTransform: 'uppercase', letterSpacing: '.05em',
                            }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: cor.dot }} />
                              {e.classificacao_atual === 'quente' ? 'Quente' : e.classificacao_atual === 'morno' ? 'Morno' : 'Frio'}
                            </div>
                          </td>

                          {/* Último contato */}
                          <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                            <span style={{
                              fontSize: '.75rem', fontWeight: atrasado ? 700 : 400,
                              color: atrasado ? '#dc2626' : '#94a3b8',
                              fontFamily: 'var(--font-inter,sans-serif)',
                            }}>
                              {e.ultimo_contato
                                ? atrasado ? `⚠ ${diasSemContato}d atrás` : formatDate(e.ultimo_contato)
                                : '—'}
                            </span>
                          </td>

                          {/* Ações */}
                          <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', gap: '.35rem', justifyContent: 'flex-end' }}>
                              <Link href={`/comercial/registros/novo?escola=${e.id}`} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: 7,
                                background: '#d97706', color: '#fff', textDecoration: 'none',
                                fontSize: '1rem', fontWeight: 700,
                                transition: 'background .15s',
                              }} title="Novo registro"
                              >
                                +
                              </Link>
                              {/* Ver ficha */}
                              <Link href={`/comercial/escolas/${e.id}`} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: 7,
                                background: '#f1f5f9', color: '#475569', textDecoration: 'none',
                                transition: 'all .15s',
                              }} title="Ver ficha">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </Link>
                              {/* Editar escola */}
                              <Link href={`/comercial/escolas/${e.id}/editar`} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: 7,
                                background: '#eff6ff', color: '#2563eb', textDecoration: 'none',
                                transition: 'all .15s',
                              }} title="Editar escola">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div style={{
                  padding: '.85rem 1.25rem',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#fafafa',
                }}>
                  <span style={{ fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    Página <strong style={{ color: '#0f172a' }}>{page}</strong> de <strong style={{ color: '#0f172a' }}>{totalPages}</strong>
                    {' '}— <strong style={{ color: '#0f172a' }}>{count}</strong> escolas no total
                  </span>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    {page > 1 && (
                      <Link href={`?page=${page - 1}&q=${q}&estado=${estado}&classif=${classif}&view=${view}`}
                        style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', fontSize: '.78rem', color: '#475569', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        ← Anterior
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link href={`?page=${page + 1}&q=${q}&estado=${estado}&classif=${classif}&view=${view}`}
                        style={{ padding: '6px 14px', borderRadius: 7, background: '#d97706', color: '#fff', fontSize: '.78rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 2px 8px rgba(217,119,6,.25)' }}>
                        Próxima →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* Empty state */
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
            padding: '4rem 2rem', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(15,23,42,.05)',
          }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', color: '#0f172a', marginBottom: '.4rem' }}>
              {q ? `Nenhum resultado para "${q}"` : 'Nenhuma escola cadastrada'}
            </h3>
            <p style={{ fontSize: '.85rem', color: '#475569', marginBottom: '1.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
              {q ? 'Tente ajustar os filtros ou cadastre uma nova escola.' : 'Comece cadastrando a primeira escola parceira.'}
            </p>
            <Link href="/comercial/escolas/nova" style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              background: '#d97706', color: '#fff', padding: '.55rem 1.25rem',
              borderRadius: 9999, textDecoration: 'none',
              fontSize: '.85rem', fontWeight: 700,
              fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: '0 4px 14px rgba(217,119,6,.3)',
            }}>
              <Plus size={14} /> Nova Escola
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
