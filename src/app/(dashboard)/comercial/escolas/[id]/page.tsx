import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LABEL } from '@/types/database'
import { EscolaDetailClient } from '@/components/comercial/EscolaDetailClient'
import { DeleteEscolaBtn } from '@/components/comercial/DeleteEscolaBtn'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6.29 6.29l1.62-1.34a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const IconGlobe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconMessage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const IconTrendUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

const IconCurrency = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <path d="M9 22V12h6v10"/>
    <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>
  </svg>
)

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const IconTarget = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconMap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/>
    <line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
)

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

// ─── Classification badge helpers ─────────────────────────────────────────────

const ClassifIcon = ({ classificacao }: { classificacao: string | null }) => {
  if (!classificacao) return null
  if (classificacao === 'quente') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1">
        <path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z"/>
        <path d="M12 12c0 3-2 4-2 7a2 2 0 0 0 4 0c0-3-2-4-2-7z" fill="white" stroke="none"/>
      </svg>
    )
  }
  if (classificacao === 'morno') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M8 12 Q10 8 12 12 Q14 16 16 12" fill="none"/>
    </svg>
  )
}

const classifStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
  quente: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5', label: 'Quente' },
  morno:  { bg: '#fffbeb', color: '#4A7FDB', border: '#fcd34d', label: 'Morno'  },
  frio:   { bg: '#eff6ff', color: '#2563eb', border: '#93c5fd', label: 'Frio'   },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EscolaDetalhe({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: escola },
    { data: registros },
    { data: negociacoes },
    { data: tarefas },
    { data: notas },
    { data: contrato },
  ] = await Promise.all([
    supabase.from('escolas_resumo').select('*').eq('id', id).single(),
    supabase.from('registros').select('*, responsavel:profiles(full_name)').eq('escola_id', id).order('data_contato', { ascending: false }),
    supabase.from('negociacoes').select('*, responsavel:profiles!negociacoes_responsavel_id_fkey(full_name)').eq('escola_id', id).order('updated_at', { ascending: false }),
    supabase.from('tarefas').select('*').eq('escola_id', id).eq('status', 'pendente').order('vencimento'),
    supabase.from('notas_escola').select('*').eq('escola_id', id).order('fixada', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('contratos').select('*').eq('escola_id', id).single(),
  ])

  if (!escola) notFound()

  const e = escola as any
  const pot = e.potencial_financeiro ?? 0
  const totalAlunos = e.total_alunos ?? 0
  const porte = pot < 100_000 ? 'Pequena' : pot < 300_000 ? 'Média' : 'Grande'
  const classif = e.classificacao_atual as string | null
  const classifStyle = classif ? classifStyles[classif] : null
  const perfil = LABEL.perfil_pedagogico?.[e.perfil_pedagogico] ?? e.perfil_pedagogico
  const origem = LABEL.origem_lead?.[e.origem_lead] ?? e.origem_lead
  const cidade = `${e.cidade ?? ''}${e.estado ? `, ${e.estado}` : ''}`

  const alunosData = [
    { label: 'Infantil', val: e.qtd_infantil },
    { label: 'Fund. I',  val: e.qtd_fund1    },
    { label: 'Fund. II', val: e.qtd_fund2    },
    { label: 'Médio',    val: e.qtd_medio    },
    { label: 'Total',    val: totalAlunos    },
  ]

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const labelStyle: React.CSSProperties = {
    fontSize: '.65rem',
    color: '#475569',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    fontFamily: 'var(--font-montserrat, sans-serif)',
    marginBottom: '.3rem',
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface, #fff)',
    border: '1px solid var(--border, #e2e8f0)',
    borderRadius: 12,
    overflow: 'hidden',
  }

  const cardHeaderStyle: React.CSSProperties = {
    padding: '1rem 1.25rem .75rem',
    borderBottom: '1px solid var(--border, #e2e8f0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '.78rem',
    fontWeight: 700,
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    fontFamily: 'var(--font-montserrat, sans-serif)',
  }

  const cardBodyStyle: React.CSSProperties = {
    padding: '1.25rem',
  }

  const badgeBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.3rem',
    padding: '.25rem .65rem',
    borderRadius: 999,
    fontSize: '.72rem',
    fontWeight: 600,
    fontFamily: 'var(--font-montserrat, sans-serif)',
    letterSpacing: '.03em',
  }

  const kpiRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '.6rem 0',
    borderBottom: '1px solid var(--border, #e2e8f0)',
    gap: '.75rem',
  }

  const kpiLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    fontSize: '.82rem',
    color: '#64748b',
    fontFamily: 'var(--font-inter, sans-serif)',
  }

  const kpiValueStyle: React.CSSProperties = {
    fontSize: '.85rem',
    fontWeight: 700,
    color: '#0f172a',
    fontFamily: 'var(--font-montserrat, sans-serif)',
    textAlign: 'right',
  }

  const actionBtnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '.5rem',
    padding: '.65rem 1rem',
    borderRadius: 8,
    fontSize: '.83rem',
    fontWeight: 600,
    fontFamily: 'var(--font-montserrat, sans-serif)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'opacity .15s',
    border: 'none',
    width: '100%',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '.68rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontFamily: 'var(--font-montserrat, sans-serif)',
    marginBottom: '.5rem',
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'var(--font-inter, sans-serif)' }}>

      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)',
        padding: '2rem 2rem 1.75rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 260, height: 260,
            borderRadius: '50%', background: 'rgba(74,127,219,.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: -40, left: '30%', width: 180, height: 180,
            borderRadius: '50%', background: 'rgba(59,130,246,.06)',
          }} />
        </div>

        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto' }}>
          {/* breadcrumb */}
          <div style={{
            display: 'flex', gap: '.4rem', alignItems: 'center',
            fontSize: '.72rem', color: 'rgba(255,255,255,.45)',
            marginBottom: '1rem', fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            <Link href="/comercial/escolas" style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none' }}>
              Escolas
            </Link>
            <span style={{ color: 'rgba(255,255,255,.25)' }}>/</span>
            <span style={{ color: 'rgba(255,255,255,.7)' }}>{e.nome}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* left: name + city + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'var(--font-cormorant, serif)',
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-.01em',
              }}>
                {e.nome}
              </h1>
              {cidade && (
                <p style={{
                  margin: '.35rem 0 .9rem',
                  fontSize: '.88rem',
                  color: 'rgba(255,255,255,.55)',
                  fontFamily: 'var(--font-inter, sans-serif)',
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {cidade}
                </p>
              )}
              <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {perfil && (
                  <span style={{
                    ...badgeBase,
                    background: 'rgba(255,255,255,.1)',
                    color: 'rgba(255,255,255,.85)',
                    border: '1px solid rgba(255,255,255,.15)',
                  }}>
                    {perfil}
                  </span>
                )}
                {classifStyle && (
                  <span style={{
                    ...badgeBase,
                    background: classifStyle.bg,
                    color: classifStyle.color,
                    border: `1px solid ${classifStyle.border}`,
                  }}>
                    <ClassifIcon classificacao={classif} />
                    {classifStyle.label}
                  </span>
                )}
                {e.escola_paideia && (
                  <span style={{
                    ...badgeBase,
                    background: 'rgba(74,127,219,.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(74,127,219,.35)',
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Paideia
                  </span>
                )}
              </div>
            </div>

            {/* right: action buttons — Editar e Excluir apenas */}
            <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center', flexShrink: 0 }}>
              <Link
                href={`/comercial/escolas/${id}/editar`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.45rem',
                  background: 'rgba(255,255,255,.08)',
                  color: 'rgba(255,255,255,.85)',
                  padding: '.6rem 1rem',
                  borderRadius: 8,
                  fontSize: '.82rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-montserrat, sans-serif)',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,.18)',
                  letterSpacing: '.02em',
                }}
              >
                <IconEdit />
                Editar
              </Link>
              <DeleteEscolaBtn escolaId={id} escolaNome={e.nome} variant="hero" />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div style={{ padding: '1.75rem 2rem', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '1.5rem',
          alignItems: 'start',
        }}>

          {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

            {/* Card: Visao Geral */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardTitleStyle}>Visao Geral</span>
              </div>
              <div style={{ ...cardBodyStyle, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>

                {/* Endereco */}
                <div>
                  <div style={sectionLabelStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <IconPin /> Endereco
                    </span>
                  </div>
                  <div style={{ fontSize: '.83rem', lineHeight: 1.7, color: '#334155' }}>
                    {e.rua ? (
                      <>
                        <div>{e.rua}{e.numero ? `, ${e.numero}` : ''}</div>
                        {e.bairro && <div>{e.bairro}</div>}
                        <div style={{ color: '#64748b' }}>{e.cidade}{e.estado ? `/${e.estado}` : ''}</div>
                        {e.cep && <div style={{ color: '#475569', fontSize: '.78rem' }}>CEP {e.cep}</div>}
                      </>
                    ) : (
                      <span style={{ color: '#475569' }}>Nao informado</span>
                    )}
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <div style={sectionLabelStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <IconPhone /> Contato
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {e.telefone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.83rem', color: '#334155' }}>
                        <IconPhone /> {e.telefone}
                      </span>
                    )}
                    {e.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.83rem', color: '#334155' }}>
                        <IconMail /> {e.email}
                      </span>
                    )}
                    {e.site && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.83rem' }}>
                        <IconGlobe />
                        <a href={e.site} target="_blank" rel="noreferrer" style={{ color: '#4A7FDB', textDecoration: 'none' }}>
                          Visitar site
                        </a>
                      </span>
                    )}
                    {!e.telefone && !e.email && (
                      <span style={{ color: '#475569', fontSize: '.83rem' }}>Nao informado</span>
                    )}
                  </div>
                </div>

                {/* Responsavel + Origem */}
                <div>
                  <div style={sectionLabelStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <IconUser /> Responsavel
                    </span>
                  </div>
                  <div style={{ fontSize: '.83rem', color: '#334155', marginBottom: '.75rem' }}>
                    {e.responsavel_nome ?? <span style={{ color: '#475569' }}>Nao atribuido</span>}
                  </div>
                  {origem && (
                    <>
                      <div style={{ ...sectionLabelStyle, marginTop: '.5rem' }}>Origem</div>
                      <div style={{ fontSize: '.83rem', color: '#334155' }}>{origem}</div>
                    </>
                  )}
                  {e.contato_nome && (
                    <>
                      <div style={{ ...sectionLabelStyle, marginTop: '.75rem' }}>Contato Principal</div>
                      <div style={{ fontSize: '.83rem', fontWeight: 600, color: '#0f172a' }}>{e.contato_nome}</div>
                      {(e.contato_cargo || e.diretor_nome) && (
                        <div style={{ fontSize: '.78rem', color: '#64748b', marginTop: '.15rem' }}>
                          {e.contato_cargo}{e.diretor_nome ? ` · Dir. ${e.diretor_nome}` : ''}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card: Alunos & Potencial */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardTitleStyle}>Alunos & Potencial</span>
              </div>
              <div style={cardBodyStyle}>

                {/* KPI boxes — Segmentos Detalhados */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  
                  {/* Infantil */}
                  <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 14, padding: '1rem' }}>
                    <div style={{ ...labelStyle, color: '#ea580c', fontSize: '.65rem' }}>Ed. Infantil</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem', marginTop: '.4rem' }}>
                      {[
                        { l: 'Inf 2', v: e.qtd_infantil2 },
                        { l: 'Inf 3', v: e.qtd_infantil3 },
                        { l: 'Inf 4', v: e.qtd_infantil4 },
                        { l: 'Inf 5', v: e.qtd_infantil5 },
                      ].map(s => (
                        <div key={s.l} style={{ textAlign: 'center', background: 'rgba(255,255,255,.6)', borderRadius: 6, padding: '.3rem' }}>
                          <div style={{ fontSize: '.6rem', color: '#9a3412', fontWeight: 700 }}>{s.l}</div>
                          <div style={{ fontSize: '.9rem', fontWeight: 800, color: '#ea580c', fontFamily: 'var(--font-cormorant,serif)' }}>{s.v ?? 0}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '.75rem', textAlign: 'center', borderTop: '1px dashed #fed7aa', paddingTop: '.5rem' }}>
                      <span style={{ fontSize: '.65rem', fontWeight: 700, color: '#9a3412' }}>Total: {e.qtd_infantil ?? 0}</span>
                    </div>
                  </div>

                  {/* Fund I */}
                  <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '1rem' }}>
                    <div style={{ ...labelStyle, color: '#2563eb', fontSize: '.65rem' }}>Fund. I (1º-5º)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem', marginTop: '.4rem' }}>
                      {[
                        { l: '1º A', v: e.qtd_fund1_ano1 },
                        { l: '2º A', v: e.qtd_fund1_ano2 },
                        { l: '3º A', v: e.qtd_fund1_ano3 },
                        { l: '4º A', v: e.qtd_fund1_ano4 },
                        { l: '5º A', v: e.qtd_fund1_ano5 },
                      ].map(s => (
                        <div key={s.l} style={{ textAlign: 'center', background: 'rgba(255,255,255,.6)', borderRadius: 6, padding: '.3rem' }}>
                          <div style={{ fontSize: '.6rem', color: '#1e40af', fontWeight: 700 }}>{s.l}</div>
                          <div style={{ fontSize: '.9rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-cormorant,serif)' }}>{s.v ?? 0}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '.75rem', textAlign: 'center', borderTop: '1px dashed #bfdbfe', paddingTop: '.5rem' }}>
                      <span style={{ fontSize: '.65rem', fontWeight: 700, color: '#1e40af' }}>Total: {e.qtd_fund1 ?? 0}</span>
                    </div>
                  </div>

                  {/* Fund II e Médio (Resumo) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 12, padding: '.85rem', flex: 1 }}>
                      <div style={{ ...labelStyle, color: '#7c3aed', fontSize: '.6rem', marginBottom: '.25rem' }}>Fund. II (6º-9º)</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-cormorant,serif)', textAlign: 'center' }}>
                        {e.qtd_fund2 ?? 0}
                      </div>
                    </div>
                    <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '.85rem', flex: 1 }}>
                      <div style={{ ...labelStyle, color: '#dc2626', fontSize: '.6rem', marginBottom: '.25rem' }}>Ens. Médio (1-3)</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', fontFamily: 'var(--font-cormorant,serif)', textAlign: 'center' }}>
                        {e.qtd_medio ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Total Geral */}
                  <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ ...labelStyle, color: 'rgba(255,255,255,.5)', fontSize: '.65rem' }}>Total de Alunos</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-cormorant,serif)', lineHeight: 1 }}>
                      {totalAlunos}
                    </div>
                    <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.4)', marginTop: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      Capacidade Total
                    </div>
                  </div>
                </div>

                {/* Potencial financeiro bar */}
                <div style={{
                  background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                  border: '1px solid #fcd34d',
                  borderRadius: 10,
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}>
                  <div>
                    <div style={{ ...labelStyle, color: '#92400e', marginBottom: '.2rem' }}>Potencial Financeiro Estimado</div>
                    <div style={{
                      fontFamily: 'var(--font-cormorant, serif)',
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      color: '#4A7FDB',
                      lineHeight: 1,
                    }}>
                      {formatCurrency(pot)}
                    </div>
                  </div>
                  {e.probabilidade_atual != null && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ ...labelStyle, color: '#92400e', marginBottom: '.2rem' }}>Probabilidade</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'flex-end' }}>
                        <div style={{
                          width: 80, height: 6, background: '#fde68a', borderRadius: 999, overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${e.probabilidade_atual}%`, height: '100%',
                            background: 'linear-gradient(90deg, #f59e0b, #4A7FDB)',
                            borderRadius: 999,
                          }} />
                        </div>
                        <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#4A7FDB', fontFamily: 'var(--font-montserrat, sans-serif)' }}>
                          {e.probabilidade_atual}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs: EscolaDetailClient */}
            <EscolaDetailClient
              escolaId={id}
              registros={registros ?? []}
              negociacoes={negociacoes ?? []}
              tarefas={tarefas ?? []}
              notas={notas ?? []}
              contrato={contrato}
            />
          </div>

          {/* ── RIGHT COLUMN (sticky) ────────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Card: Indicadores */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardTitleStyle}>Indicadores</span>
              </div>
              <div style={{ ...cardBodyStyle, padding: '.5rem 1.25rem .75rem' }}>
                {[
                  {
                    icon: <IconMessage />,
                    label: 'Interacoes',
                    value: String(registros?.length ?? 0),
                  },
                  {
                    icon: <IconTrendUp />,
                    label: 'Probabilidade',
                    value: e.probabilidade_atual != null ? `${e.probabilidade_atual}%` : '—',
                  },
                  {
                    icon: <IconCurrency />,
                    label: 'Potencial',
                    value: formatCurrency(pot),
                  },
                  {
                    icon: <IconUsers />,
                    label: 'Total Alunos',
                    value: String(totalAlunos),
                  },
                  {
                    icon: <IconBuilding />,
                    label: 'Porte',
                    value: porte,
                  },
                  {
                    icon: <IconCalendar />,
                    label: 'Ultimo Contato',
                    value: formatDate(e.ultimo_contato) ?? '—',
                  },
                  {
                    icon: <IconTarget />,
                    label: 'Classificacao',
                    value: classif ? classifStyle!.label : '—',
                  },
                ].map(({ icon, label, value }, idx, arr) => (
                  <div key={label} style={{
                    ...kpiRowStyle,
                    borderBottom: idx < arr.length - 1 ? '1px solid var(--border, #e2e8f0)' : 'none',
                  }}>
                    <span style={kpiLabelStyle}>{icon}{label}</span>
                    <span style={kpiValueStyle}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Acoes Rapidas */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardTitleStyle}>Acoes Rapidas</span>
              </div>
              <div style={{ ...cardBodyStyle, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>

                <Link
                  href={`/comercial/registros/novo?escola=${id}`}
                  style={{
                    ...actionBtnBase,
                    background: 'linear-gradient(135deg, #4A7FDB, #2563b8)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(74,127,219,.25)',
                  }}
                >
                  <IconPlus /> Registrar Interacao
                </Link>

                <Link
                  href={`/comercial/jornada-visual?escola=${id}`}
                  style={{
                    ...actionBtnBase,
                    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                    color: '#e2e8f0',
                  }}
                >
                  <IconMap /> Ver Jornada Visual
                </Link>

                <Link
                  href={`/comercial/contratos?escola=${id}`}
                  style={{
                    ...actionBtnBase,
                    background: 'transparent',
                    color: '#334155',
                    border: '1.5px solid var(--border, #e2e8f0)',
                  }}
                >
                  <IconFileText /> Jornada Contratual
                </Link>

                <Link
                  href={`/comercial/escolas/${id}/editar`}
                  style={{
                    ...actionBtnBase,
                    background: 'transparent',
                    color: '#64748b',
                    border: '1.5px solid transparent',
                  }}
                >
                  <IconEdit /> Editar Dados
                </Link>

                {/* Separador */}
                <div style={{ height: 1, background: '#f1f5f9', margin: '.25rem 0' }} />

                {/* Excluir escola */}
                <DeleteEscolaBtn escolaId={id} escolaNome={e.nome} variant="sidebar" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
