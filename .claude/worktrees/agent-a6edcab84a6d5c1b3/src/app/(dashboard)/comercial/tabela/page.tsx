import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatDate, formatCurrency, diasDesdeData } from '@/lib/utils'
import { LABEL } from '@/types/database'

// Ranking numérico de classificação (quente > morno > frio)
const CLASSIF_RANK: Record<string, number> = { quente: 3, morno: 2, frio: 1 }

const CLASSIF_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  quente: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', dot: '#dc2626' },
  morno:  { bg: '#fffbeb', text: '#4A7FDB', border: '#fcd34d', dot: '#f59e0b' },
  frio:   { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd', dot: '#60a5fa' },
}

export default async function TabelaPage() {
  const supabase = await createClient()

  const [{ data: escolas }, { data: registros }] = await Promise.all([
    supabase.from('escolas_resumo').select('*').eq('ativa', true),
    supabase.from('registros')
      .select('escola_id, data_contato, meio_contato, prontidao, classificacao, probabilidade, resumo')
      .order('data_contato', { ascending: false }),
  ])

  // Agrupar registros por escola (já ordenados do mais recente para o mais antigo)
  const regMap: Record<string, any[]> = {}
  registros?.forEach((r: any) => {
    if (!regMap[r.escola_id]) regMap[r.escola_id] = []
    regMap[r.escola_id].push(r)
  })

  const rows = (escolas ?? []).map((e: any) => {
    const regs        = regMap[e.id] ?? []
    const ultimoReg   = regs[0]   // mais recente
    const classifAtual = ultimoReg?.classificacao ?? e.classificacao_atual ?? 'frio'
    const probAtual    = ultimoReg?.probabilidade  ?? e.probabilidade_atual ?? 0
    return {
      ...e,
      classifAtual,
      probAtual,
      prontidaoAtual:   ultimoReg?.prontidao ?? null,
      ultimoMeio:       ultimoReg?.meio_contato ?? null,
      ultimaData:       ultimoReg?.data_contato ?? null,
      totalInteracoes:  regs.length,
      ultimoResumo:     ultimoReg?.resumo ?? null,
      rankScore:        (CLASSIF_RANK[classifAtual] ?? 1) * 1000 + probAtual,
    }
  })

  // Ordenar por ranking (quente > morno > frio, depois por probabilidade)
  rows.sort((a, b) => b.rankScore - a.rankScore)

  const totalQuentes = rows.filter(r => r.classifAtual === 'quente').length
  const totalMornos  = rows.filter(r => r.classifAtual === 'morno').length
  const totalFrios   = rows.filter(r => r.classifAtual === 'frio').length
  const potencialTotal = rows.reduce((acc, r) => acc + (r.potencial_financeiro ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Tabela Geral de Escolas"
        subtitle={`${rows.length} escola${rows.length !== 1 ? 's' : ''} · Rankeado por classificação do lead`}
        actions={
          <Link href="/comercial/escolas/nova" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            padding: '.45rem 1rem', borderRadius: 9999, background: '#4A7FDB',
            color: '#fff', textDecoration: 'none', fontSize: '.78rem', fontWeight: 700,
            fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 12px rgba(74,127,219,.3)',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova Escola
          </Link>
        }
      />

      <div style={{ padding: '1.5rem 1.75rem' }}>

        {/* ── KPIs ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: '.85rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Escolas',   value: rows.length,                  cor: '#4A7FDB', bg: '#fffbeb', border: '#fcd34d' },
            { label: 'Leads Quentes',   value: totalQuentes,                 cor: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
            { label: 'Leads Mornos',    value: totalMornos,                  cor: '#4A7FDB', bg: '#fffbeb', border: '#fcd34d' },
            { label: 'Leads Frios',     value: totalFrios,                   cor: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
            { label: 'Potencial Total', value: formatCurrency(potencialTotal), cor: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderTop: `3px solid ${k.cor}`, borderRadius: 14, padding: '.9rem 1rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)', minWidth: 0 }}>
              <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* ── Tabela rankeada ───────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>

          {/* Legenda de ranking */}
          <div style={{ padding: '.85rem 1.5rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Ranking
            </span>
            {[
              { label: 'Quentes', cor: '#dc2626', n: totalQuentes },
              { label: 'Mornos',  cor: '#4A7FDB', n: totalMornos  },
              { label: 'Frios',   cor: '#2563eb', n: totalFrios   },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.75rem', fontFamily: 'var(--font-inter,sans-serif)', color: '#64748b' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.cor }} />
                <strong style={{ color: r.cor }}>{r.n}</strong> {r.label}
              </div>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
              Ordenado por: Quente → Morno → Frio + Probabilidade de fechamento
            </div>
          </div>

          {rows.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['#', 'Lead', 'Escola', 'Localidade', 'Contato', 'Alunos', 'Potencial', 'Classificação', 'Prob.', 'Prontidão', 'Interações', 'Último Contato', 'Último Resumo', 'Ações'].map(col => (
                      <th key={col} style={{ padding: '.65rem .9rem', textAlign: col === 'Alunos' || col === 'Potencial' || col === 'Prob.' || col === '#' ? 'center' : 'left', fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any, idx: number) => {
                    const cs         = CLASSIF_STYLE[r.classifAtual] ?? CLASSIF_STYLE.frio
                    const diasSem    = diasDesdeData(r.ultimaData)
                    const atrasado   = diasSem != null && diasSem > 14
                    const meioLabel  = r.ultimoMeio ? (LABEL.meio_contato?.[r.ultimoMeio] ?? r.ultimoMeio) : '—'
                    const prontLabel = r.prontidaoAtual ? (LABEL.prontidao?.[r.prontidaoAtual] ?? r.prontidaoAtual) : '—'

                    return (
                      <tr key={r.id} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#fff' : '#fafafa',
                        transition: 'background .12s',
                      }}>
                        {/* Ranking */}
                        <td style={{ padding: '.8rem .9rem', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', margin: '0 auto',
                            background: idx < 3 ? (idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#4A7FDB') : '#f1f5f9',
                            color: idx < 3 ? '#fff' : '#64748b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '.72rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)',
                          }}>
                            {idx + 1}
                          </div>
                        </td>

                        {/* Lead badge */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '.25rem',
                            background: cs.bg, color: cs.text, border: `1px solid ${cs.border}`,
                            padding: '.2rem .6rem', borderRadius: 99,
                            fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '.04em', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap',
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cs.dot, display: 'inline-block' }} />
                            {r.classifAtual === 'quente' ? 'Quente' : r.classifAtual === 'morno' ? 'Morno' : 'Frio'}
                          </span>
                        </td>

                        {/* Nome */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle' }}>
                          <Link href={`/comercial/escolas/${r.id}`} style={{ fontWeight: 700, fontSize: '.82rem', color: '#0f172a', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap', display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.nome}
                          </Link>
                          {r.escola_paideia && (
                            <span style={{ fontSize: '.58rem', fontWeight: 700, background: '#ccfbf1', color: '#134e4a', padding: '.05rem .35rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase' }}>Paideia</span>
                          )}
                        </td>

                        {/* Localidade */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle', fontSize: '.78rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'nowrap' }}>
                          {r.cidade || '—'}{r.estado ? `, ${r.estado}` : ''}
                        </td>

                        {/* Contato */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle' }}>
                          {r.contato_nome ? (
                            <div>
                              <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{r.contato_nome}</div>
                              <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{r.telefone || r.email || r.contato_cargo || '—'}</div>
                            </div>
                          ) : <span style={{ color: '#cbd5e1', fontSize: '.78rem' }}>—</span>}
                        </td>

                        {/* Alunos */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{r.total_alunos ?? 0}</div>
                        </td>

                        {/* Potencial */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>{formatCurrency(r.potencial_financeiro ?? 0)}</div>
                        </td>

                        {/* Classificação */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle' }}>
                          {/* Barra de probabilidade */}
                          <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>
                            {LABEL.interesse?.[r.classificacao_atual ?? ''] ?? r.classifAtual}
                          </div>
                        </td>

                        {/* Probabilidade */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem' }}>
                            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, color: cs.text }}>{r.probAtual}%</div>
                            <div style={{ width: 40, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 2, background: cs.dot, width: `${r.probAtual}%` }} />
                            </div>
                          </div>
                        </td>

                        {/* Prontidão */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '.68rem', background: '#f1f5f9', color: '#475569', padding: '.2rem .55rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {prontLabel === '—' ? '—' : prontLabel.substring(0, 22)}
                          </span>
                        </td>

                        {/* Interações */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: r.totalInteracoes > 0 ? '#0f172a' : '#cbd5e1' }}>
                            {r.totalInteracoes}
                          </div>
                        </td>

                        {/* Último contato */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '.75rem', fontWeight: atrasado ? 700 : 400, color: atrasado ? '#dc2626' : '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {r.ultimaData ? (atrasado ? `${diasSem}d atrás` : formatDate(r.ultimaData)) : '—'}
                          </div>
                          {r.ultimoMeio && <div style={{ fontSize: '.65rem', color: '#475569', marginTop: '.1rem' }}>{meioLabel}</div>}
                        </td>

                        {/* Último resumo */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle', maxWidth: 220 }}>
                          <div style={{ fontSize: '.72rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {r.ultimoResumo || '—'}
                          </div>
                        </td>

                        {/* Ações */}
                        <td style={{ padding: '.8rem .9rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                            {/* + Registro */}
                            <Link href={`/comercial/registros/novo?escola=${r.id}`}
                              title="Novo registro"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: '#4A7FDB', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </Link>
                            {/* Ver ficha */}
                            <Link href={`/comercial/escolas/${r.id}`}
                              title="Ver ficha"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', color: '#475569', textDecoration: 'none', flexShrink: 0 }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </Link>
                            {/* Editar */}
                            <Link href={`/comercial/escolas/${r.id}/editar`}
                              title="Editar escola"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: '#eff6ff', color: '#2563eb', textDecoration: 'none', flexShrink: 0 }}>
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
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto .75rem' }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', color: '#0f172a', marginBottom: '.4rem' }}>Nenhuma escola cadastrada</h3>
              <p style={{ fontSize: '.85rem', color: '#475569', marginBottom: '1.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                Cadastre a primeira escola para começar a rankear seus leads.
              </p>
              <Link href="/comercial/escolas/nova" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#4A7FDB', color: '#fff', padding: '.55rem 1.25rem', borderRadius: 9999, textDecoration: 'none', fontSize: '.85rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Cadastrar Escola
              </Link>
            </div>
          )}

          {/* Footer com totais */}
          {rows.length > 0 && (
            <div style={{ padding: '.85rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
              <div style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                <strong style={{ color: '#0f172a' }}>{rows.length}</strong> escolas ·{' '}
                <strong style={{ color: '#dc2626' }}>{totalQuentes}</strong> quentes ·{' '}
                <strong style={{ color: '#4A7FDB' }}>{totalMornos}</strong> mornos ·{' '}
                <strong style={{ color: '#2563eb' }}>{totalFrios}</strong> frios
              </div>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Potencial total: {formatCurrency(potencialTotal)}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
