import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArquivarPropostaBtn } from '@/components/comercial/ArquivarPropostaBtn'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string; arquivadas?: string }>
}

const STATUS_COR: Record<string, { bg: string; text: string; border: string }> = {
  ativa:    { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  expirada: { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
  aceita:   { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  recusada: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
}

const inputStyle: React.CSSProperties = {
  padding: '.55rem .85rem', fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#0f172a', outline: 'none',
}

export default async function PropostasPage({ searchParams }: Props) {
  const params      = await searchParams
  const q           = params.q ?? ''
  const arquivadas  = params.arquivadas === '1'

  const supabase = await createClient()

  let query = supabase
    .from('propostas')
    .select('*')
    .order('created_at', { ascending: false })

  query = arquivadas ? query.not('arquivada_em', 'is', null) : query.is('arquivada_em', null)
  if (q) query = query.ilike('escola_nome', `%${q}%`)

  const { data: propostas } = await query

  const hoje = new Date()

  return (
    <div>
      <PageHeader
        title="Propostas"
        subtitle={`${propostas?.length ?? 0} proposta${(propostas?.length ?? 0) !== 1 ? 's' : ''} ${arquivadas ? 'arquivada' + ((propostas?.length ?? 0) !== 1 ? 's' : '') : 'ativa' + ((propostas?.length ?? 0) !== 1 ? 's' : '')}`}
        actions={
          <Link href="/calculadora" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            background: '#4A7FDB', color: '#fff', padding: '.45rem 1rem',
            borderRadius: 9999, fontSize: '.82rem', fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 4px 12px rgba(74,127,219,.3)',
            fontFamily: 'var(--font-montserrat,sans-serif)',
          }}>
            + Gerar Proposta
          </Link>
        }
      />

      <div className="mp-page-padding-x" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Toolbar: busca + toggle ativas/arquivadas ──────────── */}
        <div className="mp-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
          <form style={{ display: 'flex', gap: '.5rem', flex: 1, minWidth: 240 }}>
            {arquivadas && <input type="hidden" name="arquivadas" value="1" />}
            <input name="q" defaultValue={q} placeholder="Buscar por escola..." style={{ ...inputStyle, flex: 1 }} />
            <button type="submit" style={{ ...inputStyle, background: '#0f172a', color: '#fff', fontWeight: 700, cursor: 'pointer', border: 'none' }}>
              Buscar
            </button>
          </form>
          <Link
            href={arquivadas ? '/comercial/propostas' : `/comercial/propostas?arquivadas=1${q ? `&q=${q}` : ''}`}
            style={{
              padding: '.55rem .9rem', borderRadius: 8, textDecoration: 'none',
              border: `1.5px solid ${arquivadas ? '#4A7FDB' : '#e2e8f0'}`,
              background: arquivadas ? '#eff6ff' : '#fff',
              color: arquivadas ? '#2563eb' : '#475569',
              fontSize: '.78rem', fontWeight: 700, whiteSpace: 'nowrap',
              fontFamily: 'var(--font-montserrat,sans-serif)',
            }}
          >
            {arquivadas ? '← Ver propostas ativas' : 'Ver arquivadas'}
          </Link>
        </div>

        {/* ── Tabela ──────────────────────────────────────────────── */}
        {propostas && propostas.length > 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
            <div className="mp-escolas-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="mp-escolas-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Escola', 'Tipo', 'Valor/aluno/ano', 'Validade', 'Status', 'Views', 'Criada em', ''].map(col => (
                      <th key={col} style={{
                        padding: '.7rem 1rem', textAlign: col === 'Valor/aluno/ano' || col === 'Views' ? 'right' : 'left',
                        fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                        color: 'rgba(255,255,255,.65)', whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {propostas.map((p: any, idx: number) => {
                    const expirada = p.validade && new Date(p.validade) < hoje
                    const cor = STATUS_COR[p.status] ?? STATUS_COR.ativa
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <Link href={`/comercial/propostas/${p.id}/editar`} style={{ fontWeight: 700, fontSize: '.875rem', color: '#0f172a', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                            {p.escola_nome}
                          </Link>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {p.tipo === 'curriculo_comodato' ? 'Currículo + Comodato' : 'Somente Currículo'}
                          </span>
                        </td>
                        <td style={{ padding: '.85rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                            {formatCurrency(p.valor_aluno_ano ?? 0)}
                          </span>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '.78rem', color: expirada ? '#dc2626' : '#64748b', fontWeight: expirada ? 700 : 400, fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {expirada ? '⚠ ' : ''}{formatDate(p.validade)}
                          </span>
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                            background: cor.bg, color: cor.text, border: `1px solid ${cor.border}`,
                            padding: '.2rem .6rem', borderRadius: 99,
                            fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
                            fontFamily: 'var(--font-montserrat,sans-serif)',
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '.85rem 1rem', textAlign: 'right', verticalAlign: 'middle', fontSize: '.8rem', color: '#475569' }}>
                          {p.visualizacoes ?? 0}
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle', fontSize: '.78rem', color: '#94a3b8' }}>
                          {formatDate(p.created_at)}
                        </td>
                        <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '.35rem', justifyContent: 'flex-end' }}>
                            <a href={`/proposta/${p.token}`} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, borderRadius: 7,
                              background: '#f1f5f9', color: '#475569', textDecoration: 'none',
                            }} title="Ver proposta">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </a>
                            <Link href={`/comercial/propostas/${p.id}/editar`} style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, borderRadius: 7,
                              background: '#eff6ff', color: '#2563eb', textDecoration: 'none',
                            }} title="Editar proposta">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </Link>
                            <ArquivarPropostaBtn propostaId={p.id} escolaNome={p.escola_nome} arquivada={arquivadas} variant="row" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', color: '#0f172a', marginBottom: '.4rem' }}>
              {q ? `Nenhum resultado para "${q}"` : arquivadas ? 'Nenhuma proposta arquivada' : 'Nenhuma proposta gerada ainda'}
            </h3>
            <p style={{ fontSize: '.85rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
              {!arquivadas && !q && 'Gere a primeira proposta na Calculadora.'}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
