'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PipelineKanban } from './PipelineKanban'
import { AdicionarNegociacaoBtn } from './AdicionarNegociacaoBtn'
import { formatCurrency } from '@/lib/utils'

const ACTIVE_STAGES = ['prospeccao','qualificacao','apresentacao','proposta','negociacao','fechamento']

const STAGE_COLORS: Record<string, string> = {
  prospeccao:   '#6366f1',
  qualificacao: '#8b5cf6',
  apresentacao: '#4A7FDB',
  proposta:     '#f59e0b',
  negociacao:   '#0ea5e9',
  fechamento:   '#16a34a',
}

interface Escola { id: string; nome: string; cidade: string | null; estado: string | null }

interface Props {
  escolas: Escola[]
  userId: string
  viewMode: string
  filtroResp: string
}

export function PipelineBoard({ escolas, userId, viewMode, filtroResp }: Props) {
  const [negociacoes, setNegociacoes] = useState<any[]>([])
  const [profiles, setProfiles]       = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [erroDb, setErroDb]           = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErroDb(null)
    const supabase = createClient()

    // Busca negociações — sem nenhum filtro para ver TUDO que o RLS permite
    const { data: negs, error: errNegs, count } = await supabase
      .from('negociacoes')
      .select('*, escola:escolas(id, nome, cidade, estado), responsavel:profiles!negociacoes_responsavel_id_fkey(id, full_name, role)', { count: 'exact' })
      .order('created_at', { ascending: false })

    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .in('role', ['gerente','supervisor','consultor'])
      .order('full_name')

    if (errNegs) {
      setErroDb(`Erro ao carregar: ${errNegs.message}`)
      setNegociacoes([])
    } else {
      const VALIDOS = ['prospeccao','qualificacao','apresentacao','proposta','negociacao','fechamento','ganho','perdido']
      const normalizados = (negs ?? []).map((n: any) => ({
        ...n,
        stage: VALIDOS.includes(n.stage) ? n.stage : 'prospeccao'
      }))
      setNegociacoes(normalizados)
    }

    setProfiles(profs ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { carregar() }, [carregar])

  // Aplica filtro de responsável no cliente
  const negsFiltradas = filtroResp
    ? negociacoes.filter(n => n.responsavel_id === filtroResp)
    : negociacoes

  // Separa ativas dos stages especiais
  const kanbanNegs = negsFiltradas.filter(n => ACTIVE_STAGES.includes(n.stage))
  const ganhos     = negsFiltradas.filter(n => n.stage === 'ganho')
  const perdidos   = negsFiltradas.filter(n => n.stage === 'perdido')
  const totalValor = kanbanNegs.reduce((acc, n) => acc + (n.valor_estimado ?? 0), 0)

  // Agrupamento por consultor
  const byConsultor: Record<string, { profile: any; negs: any[] }> = {}
  negociacoes.forEach(n => {
    const pid  = n.responsavel_id ?? 'sem'
    const nome = n.responsavel?.full_name ?? 'Sem Responsável'
    if (!byConsultor[pid]) byConsultor[pid] = { profile: { id: pid, full_name: nome }, negs: [] }
    byConsultor[pid].negs.push(n)
  })
  const consultorStats = Object.values(byConsultor)
    .map(d => ({
      ...d,
      ativos:    d.negs.filter(n => ACTIVE_STAGES.includes(n.stage)).length,
      ganhos:    d.negs.filter(n => n.stage === 'ganho').length,
      potencial: d.negs.reduce((acc, n) => acc + (n.valor_estimado ?? 0), 0),
    }))
    .sort((a, b) => b.potencial - a.potencial)

  return (
    <div>
      {/* ── Barra de filtro ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Filtrar:</span>
          <Link href={`/comercial/pipeline?view=${viewMode}`}
            style={{ padding: '4px 12px', borderRadius: 9999, textDecoration: 'none', fontSize: '.72rem', fontWeight: 700, background: !filtroResp ? '#0f172a' : '#f1f5f9', color: !filtroResp ? '#fff' : '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Todos
          </Link>
          {profiles.map(p => (
            <Link key={p.id} href={`/comercial/pipeline?view=${viewMode}&responsavel=${p.id}`}
              style={{ padding: '4px 12px', borderRadius: 9999, textDecoration: 'none', fontSize: '.72rem', fontWeight: 700, background: filtroResp === p.id ? '#4A7FDB' : '#f1f5f9', color: filtroResp === p.id ? '#fff' : '#475569', fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: filtroResp === p.id ? '0 2px 8px rgba(74,127,219,.3)' : 'none' }}>
              {p.full_name.split(' ')[0]}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
          {loading && <div style={{ width: 14, height: 14, border: '2px solid #e2e8f0', borderTopColor: '#4A7FDB', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />}
          <span style={{ background: '#0f172a', color: '#f59e0b', fontSize: '.65rem', fontWeight: 800, padding: '.2rem .6rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            {kanbanNegs.length} ativas
          </span>
          {totalValor > 0 && (
            <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '.65rem', fontWeight: 800, padding: '.2rem .6rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', border: '1px solid #86efac' }}>
              {formatCurrency(totalValor)}
            </span>
          )}
          <button onClick={carregar} title="Recarregar" style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          </button>
        </div>
      </div>

      {/* ── Erro de banco ── */}
      {erroDb && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '.85rem 1.1rem', marginBottom: '1rem', fontSize: '.8rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>
          <strong>Erro RLS:</strong> {erroDb}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {viewMode === 'kanban' && (
        <>
          {/* Banner "pipeline vazio" apenas quando não há dados E não está carregando */}
          {!loading && !erroDb && kanbanNegs.length === 0 && (
            <div style={{ background: '#fffbeb', border: '1.5px dashed #fde68a', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A7FDB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="18" rx="2"/><rect x="9" y="3" width="6" height="18" rx="2"/><rect x="16" y="3" width="6" height="18" rx="2"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, fontSize: '.82rem', color: '#92400e' }}>
                  {filtroResp ? 'Nenhuma negociação para este consultor' : 'Nenhuma escola no pipeline'}
                </div>
                <div style={{ fontSize: '.72rem', color: '#2563b8', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
                  {negociacoes.length > 0
                    ? `Há ${negociacoes.length} negociações no banco mas nenhuma corresponde ao filtro atual — clique em "Todos" para ver todas.`
                    : 'Adicione escolas para acompanhar as negociações nos quadros abaixo.'}
                </div>
              </div>
              {!filtroResp && <AdicionarNegociacaoBtn escolas={escolas} userId={userId} onSuccess={carregar} />}
            </div>
          )}

          {/* Quadros Kanban — SEMPRE visíveis */}
          <PipelineKanban
            negociacoes={kanbanNegs}
            stages={ACTIVE_STAGES}
            userId={userId}
            onUpdate={carregar}
          />

          {/* Ganhos / Perdidos */}
          {(ganhos.length > 0 || perdidos.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
              {[
                { label: 'Ganhos',   items: ganhos,   cor: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
                { label: 'Perdidos', items: perdidos, cor: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
              ].map(group => (
                <div key={group.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '.65rem 1.25rem', background: group.bg, borderBottom: `1px solid ${group.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: group.cor, fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {group.label === 'Ganhos' ? '✓ ' : '✗ '}{group.label}
                    </span>
                    <span style={{ background: group.cor, color: '#fff', fontSize: '.6rem', fontWeight: 800, padding: '.1rem .45rem', borderRadius: 99 }}>{group.items.length}</span>
                  </div>
                  <div style={{ padding: '1rem 1.25rem' }}>
                    {group.items.map((n: any) => (
                      <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 600, fontSize: '.8rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{n.escola?.nome?.substring(0, 28) ?? '—'}</span>
                        {n.valor_estimado && <span style={{ color: group.cor, fontWeight: 700, fontFamily: 'var(--font-cormorant,serif)', fontSize: '.9rem' }}>{formatCurrency(n.valor_estimado)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CONSULTOR VIEW ── */}
      {viewMode === 'consultor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {consultorStats.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.85rem' }}>Nenhuma negociação cadastrada.</div>
          )}
          {consultorStats.map(({ profile: prof, negs: negsList, ativos: a, ganhos: g, potencial }) => (
            <div key={prof.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
              <div style={{ background: '#0f172a', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#4A7FDB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.8rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                  {prof.full_name.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '.9rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{prof.full_name}</div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  {[['Ativas', a], ['Ganhos', g], ['Potencial', formatCurrency(potencial)]].map(([l, v]) => (
                    <div key={String(l)} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{l}</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1 }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', overflowX: 'auto' }}>
                {ACTIVE_STAGES.map(stg => {
                  const cor   = STAGE_COLORS[stg] ?? '#64748b'
                  const items = negsList.filter((n: any) => n.stage === stg)
                  return (
                    <div key={stg} style={{ minWidth: 160, flex: 1, borderRight: '1px solid #f1f5f9' }}>
                      <div style={{ padding: '.55rem .9rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: cor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{stg}</span>
                        <span style={{ background: cor + '20', color: cor, fontSize: '.58rem', fontWeight: 800, padding: '.1rem .35rem', borderRadius: 99 }}>{items.length}</span>
                      </div>
                      <div style={{ padding: '.55rem', minHeight: 72, display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                        {items.length === 0
                          ? <div style={{ textAlign: 'center', padding: '.75rem .25rem', fontSize: '.65rem', color: '#cbd5e1' }}>—</div>
                          : items.map((n: any) => (
                            <Link key={n.id} href={`/comercial/escolas/${n.escola_id}`}
                              style={{ display: 'block', textDecoration: 'none', background: '#fff', border: '1px solid #e2e8f0', borderLeft: `3px solid ${cor}`, borderRadius: 7, padding: '.45rem .6rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '.7rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                                {n.escola?.nome?.substring(0, 20) ?? '—'}
                              </div>
                            </Link>
                          ))
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
