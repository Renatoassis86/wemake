import { createClient } from '@/lib/supabase/server'
import { buscarEscolasUnificadas } from '@/lib/escolas-unificadas'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import { LABEL } from '@/types/database'
import { EscolaSelector } from '@/components/ui/EscolaSelector'

export const dynamic = 'force-dynamic'

interface Props { searchParams: Promise<{ escola?: string }> }

// ── Etapas do funil em 2 linhas de 5 ────────────────────────────────────────
const ETAPAS = [
  { id: 'cadastro',     label: 'Cadastro',       desc: 'Escola registrada',              cor: '#6366f1', num: 1  },
  { id: 'prospeccao',   label: 'Prospecção',      desc: 'Primeiro contato',               cor: '#8b5cf6', num: 2  },
  { id: 'qualificacao', label: 'Qualificação',    desc: 'Diagnóstico e perfil',           cor: '#4A7FDB', num: 3  },
  { id: 'apresentacao', label: 'Apresentação',    desc: 'Apresentação Paideia',           cor: '#f59e0b', num: 4  },
  { id: 'proposta',     label: 'Proposta',        desc: 'Proposta enviada',               cor: '#10b981', num: 5  },
  { id: 'negociacao',   label: 'Negociação',      desc: 'Ajustes contratuais',            cor: '#14b8a6', num: 6  },
  { id: 'formulario',   label: 'Formulário',      desc: 'Pré-cadastro enviado',           cor: '#0ea5e9', num: 7  },
  { id: 'minuta',       label: 'Minuta',          desc: 'Minuta enviada e revisada',      cor: '#2563eb', num: 8  },
  { id: 'assinatura',   label: 'Assinatura',      desc: 'Contrato assinado',              cor: '#16a34a', num: 9  },
  { id: 'arquivado',    label: 'Parceria Ativa',  desc: 'Parceria iniciada',              cor: '#15803d', num: 10 },
]

const LINHA1 = ETAPAS.slice(0, 5)
const LINHA2 = ETAPAS.slice(5, 10)

const PRONTIDAO_STAGE: Record<string, string> = {
  parada:             'prospeccao',
  nova_reuniao:       'qualificacao',
  esperando_retorno:  'qualificacao',
  apresentacao:       'apresentacao',
  contrato_enviado:   'proposta',
  atualizar_contrato: 'negociacao',
  contrato_assinado:  'assinatura',
  parceiro_ativo:     'arquivado',
}

const INTERESSE_COR: Record<string, string> = {
  muito_baixo: '#94a3b8',
  baixo:       '#64748b',
  medio:       '#f59e0b',
  alto:        '#f97316',
  muito_alto:  '#ef4444',
}

// ── Ícones SVG monocromáticos para meios de contato ─────────────────────────
function IconMeio({ tipo, size = 18, cor = 'currentColor' }: { tipo: string; size?: number; cor?: string }) {
  const s = { width: size, height: size, display: 'block' as const }
  const base = { fill: 'none', stroke: cor, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (tipo === 'presencial') return (
    <svg viewBox="0 0 24 24" style={s} {...base}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
  if (tipo === 'whatsapp') return (
    <svg viewBox="0 0 24 24" style={s} {...base}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
  if (tipo === 'email') return (
    <svg viewBox="0 0 24 24" style={s} {...base}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
  if (tipo === 'telefone') return (
    <svg viewBox="0 0 24 24" style={s} {...base}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
  if (tipo === 'videoconf') return (
    <svg viewBox="0 0 24 24" style={s} {...base}>
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" style={s} {...base}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconArrowRight({ size = 14, cor = '#cbd5e1' }: { size?: number; cor?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={cor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

function IconCalendar({ size = 13, cor = '#0ea5e9' }: { size?: number; cor?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconEdit({ size = 13, cor = '#64748b' }: { size?: number; cor?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function IconFlag({ size = 16, cor = '#4A7FDB' }: { size?: number; cor?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  )
}

export default async function JornadaVisualPage({ searchParams }: Props) {
  const params = await searchParams
  const escolaId = params.escola ?? ''
  const supabase = await createClient()

  const escolas = await buscarEscolasUnificadas(supabase)

  let escola: any = null
  let registros: any[] = []
  let contrato: any = null
  let negociacoes: any[] = []

  if (escolaId) {
    const [{ data: e }, { data: r }, { data: c }, { data: n }] = await Promise.all([
      supabase.from('escolas_resumo').select('*').eq('id', escolaId).single(),
      supabase.from('registros').select('*, responsavel:profiles(full_name)').eq('escola_id', escolaId).order('data_contato'),
      supabase.from('contratos').select('*').eq('escola_id', escolaId).single(),
      supabase.from('negociacoes').select('*').eq('escola_id', escolaId).order('created_at'),
    ])
    escola = e; registros = r ?? []; contrato = c; negociacoes = n ?? []
  }

  const ultimaInteracao = registros[registros.length - 1]
  const ultimaNegociacao = negociacoes.filter((n: any) => n.ativa).sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]

  const etapaAtual = contrato?.contrato_arquivado ? 'arquivado'
    : contrato?.contrato_assinado ? 'assinatura'
    : contrato?.formulario_enviado ? 'formulario'
    : ultimaNegociacao ? ultimaNegociacao.stage
    : ultimaInteracao ? (PRONTIDAO_STAGE[ultimaInteracao.prontidao] ?? 'qualificacao')
    : escolaId ? 'cadastro'
    : ''

  const idxAtual = ETAPAS.findIndex(e => e.id === etapaAtual)
  const progresso = idxAtual >= 0 ? Math.round(((idxAtual + 1) / ETAPAS.length) * 100) : 0
  const progressoCor = idxAtual >= ETAPAS.length - 1 ? '#16a34a' : '#4A7FDB'

  const etapasContratuais = [
    { label: 'Formulário enviado',  done: !!contrato?.formulario_enviado  },
    { label: 'Formulário recebido', done: !!contrato?.formulario_recebido },
    { label: 'Minuta enviada',      done: !!contrato?.minuta_enviada      },
    { label: 'Retorno da minuta',   done: !!contrato?.retorno_minuta      },
    { label: 'Minuta atualizada',   done: !!contrato?.minuta_atualizada   },
    { label: 'Contrato enviado',    done: !!contrato?.contrato_enviado    },
    { label: 'Contrato assinado',   done: !!contrato?.contrato_assinado   },
    { label: 'Contrato arquivado',  done: !!contrato?.contrato_arquivado  },
  ]

  return (
    <div>
      <PageHeader
        title="Jornada Comercial"
        subtitle="Infográfico visual do processo completo"
        actions={
          escolaId && escola ? (
            <Link href={`/comercial/escolas/${escolaId}`} className="btn btn-ghost btn-sm">
              Ver Ficha Completa
            </Link>
          ) : undefined
        }
      />

      <div style={{ padding: '1.5rem' }}>

        {/* ── Barra de seleção de escola ──────────────────────────────────── */}
        <div style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: '.75rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <div style={{ flex: 1 }}>
            <EscolaSelector
              escolas={escolas ?? []}
              escolaId={escolaId}
              basePath="/comercial/jornada-visual"
              placeholder="— Escolha uma escola para visualizar sua jornada —"
              extraButton={escolaId ? (
                <Link href={`/comercial/registros/novo?escola=${escolaId}`} className="btn btn-primary btn-sm">
                  + Nova Interação
                </Link>
              ) : undefined}
            />
          </div>
        </div>

        {escola ? (
          <>
            {/* ── Hero da escola ─────────────────────────────────────────── */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
              borderRadius: 16,
              padding: '2rem 2.25rem',
              marginBottom: '2rem',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Ornamento de fundo */}
              <div style={{
                position: 'absolute', right: -40, top: -40,
                width: 260, height: 260,
                borderRadius: '50%',
                background: 'rgba(74,127,219,.06)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', right: 60, bottom: -60,
                width: 180, height: 180,
                borderRadius: '50%',
                background: 'rgba(99,102,241,.05)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{
                    fontSize: '.6rem', fontWeight: 700, letterSpacing: '.12em',
                    color: '#4A7FDB', marginBottom: '.5rem',
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                    textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: '.4rem',
                  }}>
                    <svg viewBox="0 0 24 24" width={10} height={10} fill="#4A7FDB" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Jornada Comercial
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--font-cormorant,serif)',
                    fontSize: '2rem', fontWeight: 700,
                    lineHeight: 1.15, marginBottom: '.5rem',
                    letterSpacing: '-.01em',
                  }}>
                    {escola.nome}
                  </h2>
                  <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    {escola.cidade}{escola.estado ? `, ${escola.estado}` : ''}
                    {escola.perfil_pedagogico ? ` · ${LABEL.perfil_pedagogico?.[escola.perfil_pedagogico] ?? escola.perfil_pedagogico}` : ''}
                  </div>
                </div>

                {/* Mini KPIs */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {([
                    ['Interações', String(registros.length),            false],
                    ['Potencial',  formatCurrency(escola.potencial_financeiro ?? 0), true],
                    ['Alunos',     String(escola.total_alunos ?? 0),    false],
                  ] as [string, string, boolean][]).map(([label, val, amber]) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,.06)',
                      border: '1px solid rgba(255,255,255,.1)',
                      borderRadius: 10,
                      padding: '.7rem 1.1rem',
                      textAlign: 'center',
                      minWidth: 80,
                    }}>
                      <div style={{
                        fontSize: '.58rem', color: 'rgba(255,255,255,.4)',
                        textTransform: 'uppercase', letterSpacing: '.08em',
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                        marginBottom: '.25rem',
                      }}>
                        {label}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-cormorant,serif)',
                        fontSize: '1.45rem', fontWeight: 700, lineHeight: 1,
                        color: amber ? '#f59e0b' : '#fff',
                      }}>
                        {val}
                      </div>
                    </div>
                  ))}
                  {escola.classificacao_atual && (
                    <div style={{
                      background: 'rgba(255,255,255,.06)',
                      border: '1px solid rgba(255,255,255,.1)',
                      borderRadius: 10,
                      padding: '.7rem 1.1rem',
                      textAlign: 'center',
                      minWidth: 80,
                    }}>
                      <div style={{
                        fontSize: '.58rem', color: 'rgba(255,255,255,.4)',
                        textTransform: 'uppercase', letterSpacing: '.08em',
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                        marginBottom: '.35rem',
                      }}>
                        Classificação
                      </div>
                      <span className={`badge badge-${escola.classificacao_atual}`} style={{ fontSize: '.72rem' }}>
                        {escola.classificacao_atual === 'quente' ? 'Quente'
                          : escola.classificacao_atual === 'morno' ? 'Morno'
                          : 'Frio'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── FUNIL DE ETAPAS ────────────────────────────────────────── */}
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              marginBottom: '2rem',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(15,23,42,.06)',
            }}>
              {/* Header do card */}
              <div style={{
                padding: '1.1rem 1.75rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  fontSize: '.82rem', fontWeight: 700, color: '#0f172a',
                  textTransform: 'uppercase', letterSpacing: '.06em',
                }}>
                  Funil de Progresso Comercial
                </span>
                <span style={{
                  fontSize: '.75rem', color: '#64748b',
                  fontFamily: 'var(--font-inter,sans-serif)',
                }}>
                  {idxAtual >= 0
                    ? `Etapa ${idxAtual + 1} de ${ETAPAS.length} — ${ETAPAS[idxAtual]?.label}`
                    : 'Início da jornada'}
                </span>
              </div>

              <div style={{ padding: '1.5rem 1.75rem' }}>

                {/* Barra de progresso */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                    <span style={{
                      fontSize: '.7rem', fontWeight: 600, color: '#64748b',
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                    }}>
                      Progresso da Jornada
                    </span>
                    <span style={{
                      fontSize: '.75rem', fontWeight: 800, color: progressoCor,
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                    }}>
                      {progresso}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: idxAtual >= ETAPAS.length - 1
                        ? 'linear-gradient(90deg, #16a34a, #15803d)'
                        : 'linear-gradient(90deg, #4A7FDB, #f59e0b)',
                      width: `${progresso}%`,
                      transition: 'width 1s ease',
                      boxShadow: `0 0 8px ${progressoCor}50`,
                    }} />
                  </div>
                </div>

                {/* Linha 1 — etapas 1 a 5 */}
                <div style={{ position: 'relative', marginBottom: '.5rem' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '.25rem',
                    position: 'relative',
                  }}>
                    {LINHA1.map((etapa, li) => {
                      const idx   = ETAPAS.findIndex(e => e.id === etapa.id)
                      const done  = idxAtual >= idx
                      const atual = etapaAtual === etapa.id
                      const isLast = li === LINHA1.length - 1

                      return (
                        <div key={etapa.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {/* Círculo */}
                            <div style={{
                              width: 52, height: 52, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              position: 'relative',
                              background: done ? etapa.cor : '#f1f5f9',
                              border: atual
                                ? `3px solid ${etapa.cor}`
                                : done
                                  ? `2px solid ${etapa.cor}`
                                  : '2px solid #e2e8f0',
                              boxShadow: atual
                                ? `0 0 0 5px ${etapa.cor}22, 0 8px 24px ${etapa.cor}35`
                                : done
                                  ? `0 4px 12px ${etapa.cor}30`
                                  : 'none',
                              transform: atual ? 'scale(1.1)' : 'scale(1)',
                              transition: 'all .3s',
                            }}>
                              {/* Anel pulsante para etapa atual */}
                              {atual && (
                                <div style={{
                                  position: 'absolute', inset: -7,
                                  borderRadius: '50%',
                                  border: `2px solid ${etapa.cor}`,
                                  animation: 'jv-pulse 2s ease-in-out infinite',
                                }} />
                              )}
                              {/* Conteúdo: check ou número */}
                              {done && !atual ? (
                                <div style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <IconCheck size={18} />
                                </div>
                              ) : (
                                <span style={{
                                  fontFamily: 'var(--font-montserrat,sans-serif)',
                                  fontSize: '.85rem', fontWeight: 800,
                                  color: atual ? '#fff' : '#94a3b8',
                                  lineHeight: 1,
                                }}>
                                  {etapa.num}
                                </span>
                              )}
                            </div>

                            {/* Label */}
                            <div style={{
                              marginTop: '.65rem',
                              textAlign: 'center',
                              fontFamily: 'var(--font-montserrat,sans-serif)',
                              fontSize: '.68rem',
                              fontWeight: atual ? 800 : done ? 700 : 500,
                              color: done ? '#0f172a' : '#94a3b8',
                              lineHeight: 1.3,
                            }}>
                              {etapa.label}
                            </div>
                            <div style={{
                              textAlign: 'center',
                              fontFamily: 'var(--font-inter,sans-serif)',
                              fontSize: '.58rem',
                              color: done ? '#64748b' : '#cbd5e1',
                              marginTop: '.2rem',
                              lineHeight: 1.4,
                              maxWidth: 88,
                            }}>
                              {etapa.desc}
                            </div>
                            {/* Data de cadastro na primeira etapa */}
                            {done && idx === 0 && escola.created_at && (
                              <div style={{
                                marginTop: '.3rem',
                                fontSize: '.58rem', fontWeight: 700,
                                color: etapa.cor,
                                fontFamily: 'var(--font-montserrat,sans-serif)',
                              }}>
                                {formatDate(escola.created_at)}
                              </div>
                            )}
                          </div>

                          {/* Seta conectora entre etapas (exceto última da linha) */}
                          {!isLast && (
                            <div style={{ flexShrink: 0, padding: '0 .1rem', marginTop: '-2rem' }}>
                              <IconArrowRight
                                size={14}
                                cor={idxAtual >= idx + 1 ? '#4A7FDB' : '#e2e8f0'}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Conector de retorno entre as linhas */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  padding: '.25rem 1.5rem .25rem 0',
                  gap: '.4rem',
                  marginBottom: '.25rem',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #e2e8f0)' }} />
                  <svg viewBox="0 0 36 18" width={36} height={18} fill="none">
                    <path d="M2 2 H34 Q35 2 35 3 V15 Q35 16 34 16 H2" stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" fill="none"/>
                    <polyline points="8,10 2,16 8,22" stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" transform="translate(0,-6)"/>
                  </svg>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #e2e8f0)' }} />
                </div>

                {/* Linha 2 — etapas 6 a 10 */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '.25rem',
                    position: 'relative',
                  }}>
                    {LINHA2.map((etapa, li) => {
                      const idx   = ETAPAS.findIndex(e => e.id === etapa.id)
                      const done  = idxAtual >= idx
                      const atual = etapaAtual === etapa.id
                      const isLast = li === LINHA2.length - 1

                      return (
                        <div key={etapa.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: 52, height: 52, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              position: 'relative',
                              background: done ? etapa.cor : '#f1f5f9',
                              border: atual
                                ? `3px solid ${etapa.cor}`
                                : done
                                  ? `2px solid ${etapa.cor}`
                                  : '2px solid #e2e8f0',
                              boxShadow: atual
                                ? `0 0 0 5px ${etapa.cor}22, 0 8px 24px ${etapa.cor}35`
                                : done
                                  ? `0 4px 12px ${etapa.cor}30`
                                  : 'none',
                              transform: atual ? 'scale(1.1)' : 'scale(1)',
                              transition: 'all .3s',
                            }}>
                              {atual && (
                                <div style={{
                                  position: 'absolute', inset: -7,
                                  borderRadius: '50%',
                                  border: `2px solid ${etapa.cor}`,
                                  animation: 'jv-pulse 2s ease-in-out infinite',
                                }} />
                              )}
                              {done && !atual ? (
                                <div style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <IconCheck size={18} />
                                </div>
                              ) : (
                                <span style={{
                                  fontFamily: 'var(--font-montserrat,sans-serif)',
                                  fontSize: '.85rem', fontWeight: 800,
                                  color: atual ? '#fff' : '#94a3b8',
                                  lineHeight: 1,
                                }}>
                                  {etapa.num}
                                </span>
                              )}
                            </div>

                            <div style={{
                              marginTop: '.65rem',
                              textAlign: 'center',
                              fontFamily: 'var(--font-montserrat,sans-serif)',
                              fontSize: '.68rem',
                              fontWeight: atual ? 800 : done ? 700 : 500,
                              color: done ? '#0f172a' : '#94a3b8',
                              lineHeight: 1.3,
                            }}>
                              {etapa.label}
                            </div>
                            <div style={{
                              textAlign: 'center',
                              fontFamily: 'var(--font-inter,sans-serif)',
                              fontSize: '.58rem',
                              color: done ? '#64748b' : '#cbd5e1',
                              marginTop: '.2rem',
                              lineHeight: 1.4,
                              maxWidth: 88,
                            }}>
                              {etapa.desc}
                            </div>
                          </div>

                          {!isLast && (
                            <div style={{ flexShrink: 0, padding: '0 .1rem', marginTop: '-2rem' }}>
                              <IconArrowRight
                                size={14}
                                cor={idxAtual >= idx + 1 ? '#4A7FDB' : '#e2e8f0'}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* ── CONTEÚDO PRINCIPAL: Timeline + Sidebar ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

              {/* ── TIMELINE DE INTERAÇÕES ──────────────────────────────── */}
              <div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '1.5rem',
                }}>
                  <h3 style={{
                    fontFamily: 'var(--font-cormorant,serif)',
                    fontSize: '1.25rem', fontWeight: 700, color: '#0f172a',
                    display: 'flex', alignItems: 'baseline', gap: '.5rem',
                  }}>
                    Histórico de Interações
                    <span style={{
                      fontSize: '.78rem', fontWeight: 400, color: '#94a3b8',
                      fontFamily: 'var(--font-inter,sans-serif)',
                    }}>
                      {registros.length} registro{registros.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                  <Link
                    href={`/comercial/registros/novo?escola=${escolaId}`}
                    className="btn btn-primary btn-sm"
                  >
                    + Nova Interação
                  </Link>
                </div>

                {registros.length > 0 ? (
                  <div style={{ position: 'relative' }}>
                    {/* Trilho vertical */}
                    <div style={{
                      position: 'absolute', left: 20, top: 20, bottom: 20,
                      width: 2,
                      background: 'linear-gradient(to bottom, #e2e8f0 0%, #f1f5f9 100%)',
                      zIndex: 0,
                    }} />

                    {registros.map((r: any, idx: number) => {
                      const isLast      = idx === registros.length - 1
                      const corInteresse = INTERESSE_COR[r.interesse] ?? '#94a3b8'
                      const meioLabel   = LABEL.meio_contato?.[r.meio_contato] ?? r.meio_contato

                      return (
                        <div
                          key={r.id}
                          style={{
                            display: 'flex', gap: '1.1rem',
                            marginBottom: isLast ? 0 : '1.5rem',
                            position: 'relative', zIndex: 1,
                          }}
                        >
                          {/* Marcador circular */}
                          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '.2rem' }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: '50%',
                              background: `${corInteresse}18`,
                              border: `2px solid ${corInteresse}50`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: `0 4px 10px ${corInteresse}22`,
                              color: corInteresse,
                            }}>
                              <IconMeio tipo={r.meio_contato} size={16} cor={corInteresse} />
                            </div>
                            <div style={{
                              marginTop: '.25rem',
                              fontSize: '.52rem', fontWeight: 800,
                              color: '#94a3b8',
                              fontFamily: 'var(--font-montserrat,sans-serif)',
                              background: '#f8fafc',
                              borderRadius: 99, padding: '.05rem .3rem',
                              border: '1px solid #e2e8f0',
                            }}>
                              #{idx + 1}
                            </div>
                          </div>

                          {/* Card */}
                          <div style={{
                            flex: 1,
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderLeft: `4px solid ${corInteresse}`,
                            borderRadius: 12,
                            padding: '1rem 1.25rem',
                            boxShadow: '0 2px 10px rgba(15,23,42,.05)',
                          }}>
                            {/* Header do card */}
                            <div style={{
                              display: 'flex', justifyContent: 'space-between',
                              alignItems: 'flex-start', marginBottom: '.7rem',
                              flexWrap: 'wrap', gap: '.5rem',
                            }}>
                              <div>
                                <div style={{
                                  display: 'flex', alignItems: 'center',
                                  gap: '.5rem', flexWrap: 'wrap', marginBottom: '.2rem',
                                }}>
                                  <span style={{
                                    fontWeight: 700, fontSize: '.88rem', color: '#0f172a',
                                    fontFamily: 'var(--font-montserrat,sans-serif)',
                                  }}>
                                    {meioLabel}
                                  </span>
                                  {r.contato_nome && (
                                    <span style={{ fontSize: '.76rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                                      com <strong style={{ color: '#334155' }}>{r.contato_nome}</strong>
                                      {r.contato_cargo ? ` (${r.contato_cargo})` : ''}
                                    </span>
                                  )}
                                </div>
                                <div style={{
                                  fontSize: '.7rem', color: '#94a3b8',
                                  fontFamily: 'var(--font-inter,sans-serif)',
                                }}>
                                  {new Date(r.data_contato + 'T12:00:00').toLocaleDateString('pt-BR', {
                                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                                  })}
                                  {r.responsavel?.full_name && (
                                    <span> · <strong>{r.responsavel.full_name}</strong></span>
                                  )}
                                </div>
                              </div>

                              {/* Badges de métricas + botão editar */}
                              <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className={`badge badge-${r.classificacao}`} style={{ fontSize: '.63rem' }}>
                                  {r.classificacao === 'quente' ? 'Quente' : r.classificacao === 'morno' ? 'Morno' : 'Frio'}
                                </span>
                                <span style={{
                                  fontSize: '.65rem', fontWeight: 800,
                                  fontFamily: 'var(--font-montserrat,sans-serif)',
                                  background: `${corInteresse}15`, color: corInteresse,
                                  border: `1px solid ${corInteresse}40`,
                                  padding: '.15rem .5rem', borderRadius: 99,
                                }}>
                                  {r.probabilidade}%
                                </span>
                                {r.potencial_financeiro > 0 && (
                                  <span className="badge badge-amber" style={{ fontSize: '.63rem' }}>
                                    {formatCurrency(r.potencial_financeiro)}
                                  </span>
                                )}
                                <Link
                                  href={`/comercial/registros/${r.id}/editar`}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                                    fontSize: '.65rem', fontWeight: 600,
                                    color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)',
                                    background: '#f8fafc', border: '1px solid #e2e8f0',
                                    borderRadius: 6, padding: '.2rem .55rem',
                                    textDecoration: 'none',
                                  }}
                                >
                                  <IconEdit size={11} cor="#64748b" />
                                  Editar
                                </Link>
                              </div>
                            </div>

                            {/* Resumo */}
                            <p style={{
                              fontSize: '.84rem', color: '#334155', lineHeight: 1.7,
                              marginBottom: '.85rem',
                              fontFamily: 'var(--font-inter,sans-serif)',
                              background: '#f8fafc', borderRadius: 8,
                              padding: '.75rem .9rem',
                              borderLeft: `3px solid ${corInteresse}40`,
                              margin: '0 0 .85rem 0',
                            }}>
                              {r.resumo}
                            </p>

                            {/* Chips de diagnóstico */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.6rem' }}>
                              <span style={{
                                fontSize: '.65rem', fontWeight: 600,
                                fontFamily: 'var(--font-montserrat,sans-serif)',
                                background: `${corInteresse}12`, color: corInteresse,
                                border: `1px solid ${corInteresse}30`,
                                padding: '.2rem .6rem', borderRadius: 99,
                              }}>
                                Interesse: {LABEL.interesse?.[r.interesse] ?? r.interesse}
                              </span>
                              <span style={{
                                fontSize: '.65rem', fontWeight: 600,
                                fontFamily: 'var(--font-montserrat,sans-serif)',
                                background: '#dbeafe', color: '#1e40af',
                                border: '1px solid #bfdbfe',
                                padding: '.2rem .6rem', borderRadius: 99,
                              }}>
                                {LABEL.prontidao?.[r.prontidao] ?? r.prontidao}
                              </span>
                              <span style={{
                                fontSize: '.65rem', fontWeight: 600,
                                fontFamily: 'var(--font-montserrat,sans-serif)',
                                background: '#ccfbf1', color: '#134e4a',
                                border: '1px solid #99f6e4',
                                padding: '.2rem .6rem', borderRadius: 99,
                              }}>
                                Abertura: {LABEL.abertura?.[r.abertura] ?? r.abertura}
                              </span>
                            </div>

                            {/* Encaminhamentos */}
                            {r.encaminhamentos?.length > 0 && (
                              <div style={{ marginTop: '.5rem' }}>
                                <div style={{
                                  fontSize: '.6rem', fontWeight: 700, color: '#94a3b8',
                                  textTransform: 'uppercase', letterSpacing: '.06em',
                                  marginBottom: '.3rem',
                                  fontFamily: 'var(--font-montserrat,sans-serif)',
                                }}>
                                  Encaminhamentos
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem' }}>
                                  {r.encaminhamentos.map((enc: string) => (
                                    <span key={enc} style={{
                                      fontSize: '.63rem', fontWeight: 600,
                                      fontFamily: 'var(--font-montserrat,sans-serif)',
                                      background: '#fef3c7', color: '#92400e',
                                      border: '1px solid #fcd34d',
                                      padding: '.15rem .5rem', borderRadius: 99,
                                      display: 'inline-flex', alignItems: 'center', gap: '.25rem',
                                    }}>
                                      <IconCheck size={10} />
                                      {enc.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Próximo contato */}
                            {r.proximo_contato && (
                              <div style={{
                                marginTop: '.65rem',
                                display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                                fontSize: '.7rem', fontWeight: 700, color: '#0ea5e9',
                                fontFamily: 'var(--font-montserrat,sans-serif)',
                                background: '#f0f9ff', border: '1px solid #bae6fd',
                                borderRadius: 6, padding: '.25rem .65rem',
                              }}>
                                <IconCalendar size={12} cor="#0ea5e9" />
                                Próximo contato: {formatDate(r.proximo_contato)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Marcador final — status atual */}
                    <div style={{ display: 'flex', gap: '1.1rem', marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
                      <div style={{ flexShrink: 0, paddingTop: '.2rem' }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: '50%',
                          background: etapaAtual === 'arquivado'
                            ? 'linear-gradient(135deg, #16a34a, #15803d)'
                            : 'linear-gradient(135deg, #4A7FDB, #2563b8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: etapaAtual === 'arquivado'
                            ? '0 4px 14px #16a34a40'
                            : '0 4px 14px #4A7FDB40',
                        }}>
                          <IconFlag size={16} cor="#fff" />
                        </div>
                      </div>
                      <div style={{
                        flex: 1,
                        background: etapaAtual === 'arquivado' ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${etapaAtual === 'arquivado' ? '#86efac' : '#fcd34d'}`,
                        borderLeft: `4px solid ${etapaAtual === 'arquivado' ? '#16a34a' : '#4A7FDB'}`,
                        borderRadius: 12,
                        padding: '1rem 1.25rem',
                      }}>
                        <div style={{
                          fontWeight: 700, fontSize: '.85rem',
                          color: etapaAtual === 'arquivado' ? '#15803d' : '#92400e',
                          fontFamily: 'var(--font-montserrat,sans-serif)',
                          marginBottom: '.25rem',
                        }}>
                          {etapaAtual === 'arquivado'
                            ? 'Parceria Ativa — Contrato Arquivado'
                            : `Status atual: ${ETAPAS.find(e => e.id === etapaAtual)?.label ?? 'Em andamento'}`}
                        </div>
                        <div style={{
                          fontSize: '.76rem', color: '#64748b',
                          fontFamily: 'var(--font-inter,sans-serif)',
                        }}>
                          {etapaAtual === 'arquivado'
                            ? 'A escola é uma parceira ativa do Parceria Educacional.'
                            : 'A jornada comercial está em andamento.'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    background: '#f8fafc', borderRadius: 16,
                    border: '2px dashed #e2e8f0',
                  }}>
                    <svg viewBox="0 0 24 24" width={48} height={48} fill="none" stroke="#cbd5e1" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto .75rem' }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/>
                      <line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    <h3 style={{
                      fontFamily: 'var(--font-cormorant,serif)',
                      fontSize: '1.2rem', fontWeight: 700, color: '#0f172a',
                      marginBottom: '.4rem',
                    }}>
                      Nenhuma interação registrada
                    </h3>
                    <p style={{
                      fontSize: '.82rem', color: '#94a3b8',
                      fontFamily: 'var(--font-inter,sans-serif)',
                      maxWidth: 340, margin: '0 auto .75rem',
                    }}>
                      Registre o primeiro contato com esta escola para iniciar a jornada comercial.
                    </p>
                    <Link href={`/comercial/registros/novo?escola=${escolaId}`} className="btn btn-primary btn-sm">
                      Registrar Primeiro Contato
                    </Link>
                  </div>
                )}
              </div>

              {/* ── TIMELINE DE NEGOCIAÇÕES ─────────────────────────────── */}
              {negociacoes && negociacoes.length > 0 && (
                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e2e8f0' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '1.5rem',
                  }}>
                    <h3 style={{
                      fontFamily: 'var(--font-cormorant,serif)',
                      fontSize: '1.25rem', fontWeight: 700, color: '#0f172a',
                      display: 'flex', alignItems: 'baseline', gap: '.5rem',
                    }}>
                      Histórico de Negociações
                      <span style={{
                        fontSize: '.78rem', fontWeight: 400, color: '#94a3b8',
                        fontFamily: 'var(--font-inter,sans-serif)',
                      }}>
                        {negociacoes.length} negociação{negociacoes.length !== 1 ? 's' : ''}
                      </span>
                    </h3>
                  </div>

                  <div style={{ position: 'relative' }}>
                    {/* Trilho vertical */}
                    <div style={{
                      position: 'absolute', left: 20, top: 20, bottom: 20,
                      width: 2,
                      background: 'linear-gradient(to bottom, #e2e8f0 0%, #f1f5f9 100%)',
                      zIndex: 0,
                    }} />

                    {negociacoes.map((neg: any, idx: number) => {
                      const isLast = idx === negociacoes.length - 1
                      const stageInfo = ETAPAS.find(e => e.id === neg.stage)

                      return (
                        <div
                          key={neg.id}
                          style={{
                            display: 'flex', gap: '1.1rem',
                            marginBottom: isLast ? 0 : '1.5rem',
                            position: 'relative', zIndex: 1,
                          }}
                        >
                          {/* Marcador circular */}
                          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '.2rem' }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: '50%',
                              background: `${stageInfo?.cor}18`,
                              border: `2px solid ${stageInfo?.cor}50`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: `0 4px 10px ${stageInfo?.cor}22`,
                              color: stageInfo?.cor,
                              fontSize: '1rem', fontWeight: 700,
                            }}>
                              {stageInfo?.num}
                            </div>
                            <div style={{
                              marginTop: '.25rem',
                              fontSize: '.52rem', fontWeight: 800,
                              color: '#94a3b8',
                              fontFamily: 'var(--font-montserrat,sans-serif)',
                              background: '#f8fafc',
                              borderRadius: 99, padding: '.05rem .3rem',
                              border: '1px solid #e2e8f0',
                            }}>
                              #{idx + 1}
                            </div>
                          </div>

                          {/* Card */}
                          <div style={{
                            flex: 1,
                            background: neg.ativa ? '#fff' : '#f8fafc',
                            border: `1px solid ${neg.ativa ? '#e2e8f0' : '#cbd5e1'}`,
                            borderLeft: `4px solid ${stageInfo?.cor}`,
                            borderRadius: 12,
                            padding: '1rem 1.25rem',
                            boxShadow: '0 2px 10px rgba(15,23,42,.05)',
                            opacity: neg.ativa ? 1 : 0.7,
                          }}>
                            {/* Header do card */}
                            <div style={{
                              display: 'flex', justifyContent: 'space-between',
                              alignItems: 'flex-start', marginBottom: '.7rem',
                              flexWrap: 'wrap', gap: '.5rem',
                            }}>
                              <div>
                                <div style={{
                                  fontWeight: 700, fontSize: '.88rem', color: '#0f172a',
                                  fontFamily: 'var(--font-montserrat,sans-serif)',
                                  marginBottom: '.2rem',
                                }}>
                                  {neg.titulo || stageInfo?.label}
                                </div>
                                <div style={{
                                  fontSize: '.7rem', color: '#94a3b8',
                                  fontFamily: 'var(--font-inter,sans-serif)',
                                }}>
                                  {new Date(neg.created_at).toLocaleDateString('pt-BR', {
                                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                                  })}
                                </div>
                              </div>

                              {/* Badges */}
                              <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: '.65rem', fontWeight: 700,
                                  fontFamily: 'var(--font-montserrat,sans-serif)',
                                  background: `${stageInfo?.cor}15`, color: stageInfo?.cor,
                                  border: `1px solid ${stageInfo?.cor}40`,
                                  padding: '.15rem .5rem', borderRadius: 99,
                                }}>
                                  {stageInfo?.label}
                                </span>
                                {neg.valor_estimado && (
                                  <span className="badge badge-amber" style={{ fontSize: '.63rem' }}>
                                    {formatCurrency(neg.valor_estimado)}
                                  </span>
                                )}
                                {!neg.ativa && (
                                  <span style={{
                                    fontSize: '.63rem', fontWeight: 700,
                                    fontFamily: 'var(--font-montserrat,sans-serif)',
                                    background: '#f5f3ff', color: '#7c3aed',
                                    border: '1px solid #c4b5fd',
                                    padding: '.15rem .5rem', borderRadius: 99,
                                  }}>
                                    Finalizada
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Conteúdo */}
                            {neg.observacoes && (
                              <div style={{
                                fontSize: '.82rem', color: '#334155',
                                marginBottom: '.7rem',
                                fontFamily: 'var(--font-inter,sans-serif)',
                                lineHeight: 1.5,
                              }}>
                                {neg.observacoes}
                              </div>
                            )}

                            {/* Footer com métricas */}
                            <div style={{
                              display: 'flex', gap: '1rem',
                              fontSize: '.75rem', color: '#64748b',
                              fontFamily: 'var(--font-inter,sans-serif)',
                              borderTop: '1px solid #f1f5f9', paddingTop: '.75rem',
                            }}>
                              {neg.probabilidade && (
                                <div>
                                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Probabilidade:</span> {neg.probabilidade}%
                                </div>
                              )}
                              {neg.previsao_fechamento && (
                                <div>
                                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Prev. fechamento:</span> {formatDate(neg.previsao_fechamento)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── SIDEBAR DIREITA ─────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Card 1: Jornada Contratual — stepper vertical */}
                <div style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(15,23,42,.05)',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '.9rem 1.25rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                      fontSize: '.75rem', fontWeight: 700, color: '#0f172a',
                      textTransform: 'uppercase', letterSpacing: '.06em',
                    }}>
                      Jornada Contratual
                    </span>
                    <span style={{
                      fontSize: '.65rem', fontWeight: 700,
                      color: etapasContratuais.filter(e => e.done).length === 8 ? '#15803d' : '#4A7FDB',
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                      background: etapasContratuais.filter(e => e.done).length === 8 ? '#f0fdf4' : '#fffbeb',
                      border: `1px solid ${etapasContratuais.filter(e => e.done).length === 8 ? '#86efac' : '#fcd34d'}`,
                      borderRadius: 99, padding: '.15rem .55rem',
                    }}>
                      {etapasContratuais.filter(e => e.done).length} / 8
                    </span>
                  </div>

                  {/* Stepper */}
                  <div style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                      {/* Trilho do stepper */}
                      <div style={{
                        position: 'absolute', left: 11, top: 12, bottom: 12,
                        width: 2, background: '#f1f5f9', zIndex: 0,
                      }} />

                      {etapasContratuais.map((item, i) => {
                        const isLast = i === etapasContratuais.length - 1
                        return (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '.7rem',
                            position: 'relative', zIndex: 1,
                            paddingBottom: isLast ? 0 : '.85rem',
                          }}>
                            {/* Círculo do stepper */}
                            <div style={{
                              flexShrink: 0,
                              width: 24, height: 24, borderRadius: '50%',
                              background: item.done ? '#16a34a' : '#fff',
                              border: `2px solid ${item.done ? '#16a34a' : '#e2e8f0'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: item.done ? '0 2px 8px #16a34a30' : 'none',
                              color: item.done ? '#fff' : 'transparent',
                              transition: 'all .25s',
                            }}>
                              {item.done && <IconCheck size={11} />}
                            </div>
                            {/* Label */}
                            <span style={{
                              fontSize: '.76rem',
                              fontFamily: 'var(--font-inter,sans-serif)',
                              fontWeight: item.done ? 600 : 400,
                              color: item.done ? '#15803d' : '#94a3b8',
                              textDecoration: item.done ? 'line-through' : 'none',
                              textDecorationColor: '#86efac',
                            }}>
                              {item.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Valor do contrato */}
                    {contrato?.valor_total_calculado > 0 && (
                      <div style={{
                        marginTop: '1.1rem',
                        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                        border: '1px solid #fcd34d',
                        borderRadius: 10,
                        padding: '.85rem 1rem',
                        textAlign: 'center',
                      }}>
                        <div style={{
                          fontSize: '.58rem', fontWeight: 700, color: '#92400e',
                          textTransform: 'uppercase', letterSpacing: '.1em',
                          fontFamily: 'var(--font-montserrat,sans-serif)',
                          marginBottom: '.3rem',
                        }}>
                          Valor Total do Contrato
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-cormorant,serif)',
                          fontSize: '1.5rem', fontWeight: 700, color: '#2563b8',
                          lineHeight: 1,
                        }}>
                          {formatCurrency(contrato.valor_total_calculado)}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      href={`/comercial/contratos?escola=${escolaId}`}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', display: 'flex' }}
                    >
                      Editar Jornada Contratual
                    </Link>
                  </div>
                </div>

                {/* Card 2: Dados & Ações */}
                <div style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(15,23,42,.05)',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '.9rem 1.25rem',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                      fontSize: '.75rem', fontWeight: 700, color: '#0f172a',
                      textTransform: 'uppercase', letterSpacing: '.06em',
                    }}>
                      Dados da Escola
                    </span>
                  </div>

                  <div style={{ padding: '1rem 1.25rem' }}>
                    {/* Mini-KPIs de segmentos */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '.5rem', marginBottom: '.75rem',
                    }}>
                      {([
                        ['Infantil',  escola.qtd_infantil],
                        ['Fund. I',   escola.qtd_fund1],
                        ['Fund. II',  escola.qtd_fund2],
                        ['Médio',     escola.qtd_medio],
                      ] as [string, number | null][]).map(([label, val]) => (
                        <div key={label} style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8, padding: '.55rem .75rem',
                        }}>
                          <div style={{
                            fontSize: '.6rem', color: '#94a3b8',
                            fontFamily: 'var(--font-montserrat,sans-serif)',
                            fontWeight: 600, textTransform: 'uppercase',
                            letterSpacing: '.05em', marginBottom: '.2rem',
                          }}>
                            {label}
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-montserrat,sans-serif)',
                            fontSize: '.95rem', fontWeight: 800, color: '#0f172a',
                            lineHeight: 1,
                          }}>
                            {val ?? 0}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total de alunos em destaque */}
                    <div style={{
                      background: '#0f172a', borderRadius: 10,
                      padding: '.65rem 1rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: '.75rem',
                    }}>
                      <span style={{
                        fontSize: '.68rem', fontWeight: 700, color: 'rgba(255,255,255,.5)',
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                        textTransform: 'uppercase', letterSpacing: '.07em',
                      }}>
                        Total de Alunos
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-cormorant,serif)',
                        fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1,
                      }}>
                        {escola.total_alunos ?? 0}
                      </span>
                    </div>

                    {/* Potencial financeiro */}
                    <div style={{
                      background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                      border: '1px solid #fcd34d',
                      borderRadius: 10, padding: '.65rem 1rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: '1rem',
                    }}>
                      <span style={{
                        fontSize: '.68rem', fontWeight: 700, color: '#92400e',
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                        textTransform: 'uppercase', letterSpacing: '.07em',
                      }}>
                        Potencial
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-cormorant,serif)',
                        fontSize: '1.35rem', fontWeight: 700, color: '#2563b8', lineHeight: 1,
                      }}>
                        {formatCurrency(escola.potencial_financeiro ?? 0)}
                      </span>
                    </div>

                    {/* Botões de ação */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      <Link
                        href={`/comercial/escolas/${escolaId}`}
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'center', display: 'flex' }}
                      >
                        Ver Ficha Completa
                      </Link>
                      <Link
                        href={`/comercial/escolas/${escolaId}/editar`}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'center', display: 'flex' }}
                      >
                        Editar Escola
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          /* ── Estado vazio — nenhuma escola selecionada ────────────────── */
          <div style={{
            textAlign: 'center', padding: '6rem 1rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#f1f5f9', border: '2px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/>
                <line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-cormorant,serif)',
              fontSize: '1.6rem', color: '#0f172a', fontWeight: 700,
            }}>
              Selecione uma escola
            </h2>
            <p style={{
              color: '#94a3b8', maxWidth: 400,
              fontFamily: 'var(--font-inter,sans-serif)',
              fontSize: '.88rem', lineHeight: 1.65, margin: 0,
            }}>
              Escolha uma escola na barra acima para visualizar sua jornada comercial completa, do primeiro contato até a parceria ativa.
            </p>
          </div>
        )}
      </div>

      {/* Animações */}
      <style>{`
        @keyframes jv-pulse {
          0%, 100% { transform: scale(1); opacity: .55; }
          50%       { transform: scale(1.18); opacity: .18; }
        }
      `}</style>
    </div>
  )
}

