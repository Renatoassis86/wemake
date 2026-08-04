import { getFilaPriorizacao, bucketConfessionalidade } from '@/lib/priorizacao'
import Link from 'next/link'
import { PriorizacaoSearch } from './PriorizacaoSearch'
import { DeleteEscolaBtn } from '@/components/comercial/DeleteEscolaBtn'
import {
  AlertTriangle, CheckCircle2, Users, Building2,
  Pencil, MessageCircle, ChevronRight, MapPin, GraduationCap,
  Target, ArrowRight, FileDown
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const PER_PAGE = 25

interface Props {
  searchParams: Promise<{ uf?: string; q?: string; page?: string; perfil?: string }>
}

const CONFESS_CORES: Record<string, { bg: string; text: string; border: string }> = {
  'Confessional':   { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  'Em transição':   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'Em estudo':      { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Não considera':  { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
}

// ─── Helpers de estilo ────────────────────────────────────────────────────────

const STAGE_CORES: Record<string, { bg: string; text: string; border: string }> = {
  prospeccao:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  qualificacao: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  apresentacao: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  proposta:     { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  negociacao:   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  fechamento:   { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  ganho:        { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
  perdido:      { bg: '#F8FAFC', text: '#64748B', border: '#CBD5E1' },
}

const STAGE_LABELS: Record<string, string> = {
  prospeccao:   'Prospecção',
  qualificacao: 'Qualificação',
  apresentacao: 'Apresentação',
  proposta:     'Proposta',
  negociacao:   'Negociação',
  fechamento:   'Fechamento ⚡',
  ganho:        'Ganho',
  perdido:      'Perdido',
}

function StageBadge({ stage }: { stage: string | null }) {
  if (!stage) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 99,
      fontSize: '.65rem', fontWeight: 600,
      background: '#F8FAFC', color: '#94A3B8',
      border: '1px solid #E2E8F0',
      fontFamily: 'var(--font-montserrat, sans-serif)',
      letterSpacing: '.03em',
    }}>
      Nunca contatada
    </span>
  )
  const cor = STAGE_CORES[stage] ?? STAGE_CORES.prospeccao
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 99,
      fontSize: '.65rem', fontWeight: 700,
      background: cor.bg, color: cor.text,
      border: `1px solid ${cor.border}`,
      fontFamily: 'var(--font-montserrat, sans-serif)',
      letterSpacing: '.03em',
    }}>
      {STAGE_LABELS[stage] ?? stage}
    </span>
  )
}

function KpiCard({
  label, value, sub, icon: Icon, cor, urgente
}: {
  label: string
  value: number | string
  sub?: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  cor: string
  urgente?: boolean
}) {
  return (
    <div style={{
      background: urgente
        ? 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)'
        : 'white',
      border: `1.5px solid ${urgente ? '#FCA5A5' : '#E2E8F0'}`,
      borderRadius: 14, padding: '1.25rem 1.5rem',
      display: 'flex', flexDirection: 'column', gap: '.5rem',
      boxShadow: urgente
        ? '0 2px 12px rgba(220,38,38,.08)'
        : '0 1px 4px rgba(0,0,0,.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      {urgente && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 4, height: '100%', background: '#DC2626', borderRadius: '0 14px 14px 0',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.08em', color: '#94A3B8',
          fontFamily: 'var(--font-montserrat, sans-serif)',
        }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: cor + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      <div style={{
        fontSize: '2rem', fontWeight: 800, color: urgente ? '#B91C1C' : '#0F172A',
        fontFamily: 'var(--font-montserrat, sans-serif)', lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: '.7rem', color: '#64748B',
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>{sub}</div>
      )}
    </div>
  )
}

// ─── Mini bar chart (sem recharts — SSR seguro) ───────────────────────────────

function MiniBarChart({
  title, data, colorHex
}: {
  title: string
  data: { label: string; count: number }[]
  colorHex: string
}) {
  if (data.length === 0) return null
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{
      background: 'white', border: '1.5px solid #E2E8F0',
      borderRadius: 14, padding: '1.25rem 1.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,.04)',
    }}>
      <div style={{
        fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '.08em', color: '#64748B', marginBottom: '1rem',
        fontFamily: 'var(--font-montserrat, sans-serif)',
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        {data.map(({ label, count }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={{
              width: 84, fontSize: '.65rem', fontWeight: 700, color: '#475569',
              fontFamily: 'var(--font-montserrat, sans-serif)', flexShrink: 0, textAlign: 'right',
              lineHeight: 1.2,
            }}>{label}</div>
            <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((count / max) * 100)}%`,
                background: colorHex,
                borderRadius: 99,
                transition: 'width .3s',
              }} />
            </div>
            <div style={{
              width: 24, fontSize: '.65rem', fontWeight: 700, color: '#475569',
              fontFamily: 'var(--font-montserrat, sans-serif)', flexShrink: 0,
            }}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tabela de Escolas ─────────────────────────────────────────────────────────

function TabelaEscolas({
  escolas,
}: {
  escolas: (Awaited<ReturnType<typeof getFilaPriorizacao>>['elegiveis'][number] & { rank: number })[]
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#0F172A' }}>
            {['#', 'Escola', 'UF / Cidade', 'Alunos', 'Proposta', 'Situação Comercial', 'Ações'].map(col => (
              <th key={col} style={{
                padding: col === '#' ? '.7rem .9rem' : '.7rem 1rem',
                textAlign: col === '#' || col === 'Alunos' || col === 'Proposta' ? 'center' : 'left',
                fontSize: '.62rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.1em',
                color: 'rgba(255,255,255,.55)',
                fontFamily: 'var(--font-montserrat, sans-serif)',
                borderBottom: '2px solid rgba(255,255,255,.06)',
                whiteSpace: 'nowrap',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {escolas.length === 0 && (
            <tr>
              <td colSpan={7} style={{
                padding: '2.5rem', textAlign: 'center',
                color: '#94A3B8', fontSize: '.85rem',
                fontFamily: 'var(--font-inter, sans-serif)',
              }}>
                Nenhuma escola encontrada para este filtro.
              </td>
            </tr>
          )}
          {escolas.map((escola, idx) => (
            <tr key={escola.id} style={{
              background: escola.acaoUrgente
                ? 'linear-gradient(90deg, #FFF5F5 0%, #FFFBFB 100%)'
                : idx % 2 === 0 ? 'white' : '#FAFAFA',
              borderBottom: `1px solid ${escola.acaoUrgente ? '#FECACA' : '#F1F5F9'}`,
              transition: 'background .1s',
            }}>
              {/* # */}
              <td style={{
                padding: '.65rem .9rem', textAlign: 'center',
                fontSize: '.7rem', fontWeight: 800, color: '#CBD5E1',
                fontFamily: 'var(--font-montserrat, sans-serif)',
                width: 44,
              }}>
                {escola.acaoUrgente
                  ? <span title="Ação urgente" style={{ color: '#DC2626', fontSize: '.9rem' }}>⚡</span>
                  : escola.rank
                }
              </td>

              {/* Escola */}
              <td style={{ padding: '.65rem 1rem', maxWidth: 280 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Link href={`/comercial/escolas/${escola.id}`} style={{
                    fontSize: '.82rem', fontWeight: 700, color: '#0F172A',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                    display: 'flex', alignItems: 'center', gap: '.35rem',
                  }}>
                    {escola.nome}
                    {escola.origem_lead === 'banco_leads' && (
                      <span style={{
                        fontSize: '.55rem', fontWeight: 800,
                        background: '#EFF6FF', color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        padding: '1px 6px', borderRadius: 99,
                        letterSpacing: '.05em', textTransform: 'uppercase',
                        fontFamily: 'var(--font-montserrat, sans-serif)',
                      }}>Lead</span>
                    )}
                    {escola.perfilPesquisa?.confessionalidade && (() => {
                      const bucket = bucketConfessionalidade(escola.perfilPesquisa.confessionalidade)
                      const cor = CONFESS_CORES[bucket] ?? CONFESS_CORES['Não considera']
                      return (
                        <span title={`Confessionalidade (pesquisa comercial): ${escola.perfilPesquisa.confessionalidade}`} style={{
                          fontSize: '.55rem', fontWeight: 800,
                          background: cor.bg, color: cor.text,
                          border: `1px solid ${cor.border}`,
                          padding: '1px 6px', borderRadius: 99,
                          letterSpacing: '.05em', textTransform: 'uppercase',
                          fontFamily: 'var(--font-montserrat, sans-serif)',
                          whiteSpace: 'nowrap',
                        }}>{bucket}</span>
                      )
                    })()}
                  </Link>
                  {escola.responsavel_nome && (
                    <span style={{
                      fontSize: '.67rem', color: '#94A3B8',
                      fontFamily: 'var(--font-inter, sans-serif)',
                    }}>
                      Resp.: {escola.responsavel_nome}
                    </span>
                  )}
                </div>
              </td>

              {/* UF / Cidade */}
              <td style={{ padding: '.65rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <MapPin size={11} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <span style={{
                    fontSize: '.75rem', color: '#475569',
                    fontFamily: 'var(--font-inter, sans-serif)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
                  }}>
                    {[escola.cidade, escola.estado].filter(Boolean).join(' — ') || '—'}
                  </span>
                </div>
              </td>

              {/* Alunos */}
              <td style={{ padding: '.65rem 1rem', textAlign: 'center' }}>
                <div title={escola.alunosEstimado ? 'Estimativa da pesquisa comercial — ainda não confirmada no cadastro' : undefined} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                  background: escola.alunosEfetivo >= 500
                    ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)'
                    : escola.alunosEfetivo >= 200
                    ? '#F0FDF4'
                    : '#FAFAFA',
                  border: escola.alunosEstimado
                    ? '1px dashed #C4B5FD'
                    : escola.alunosEfetivo >= 500
                    ? '1px solid #BFDBFE'
                    : escola.alunosEfetivo >= 200
                    ? '1px solid #BBF7D0'
                    : '1px solid #E2E8F0',
                  borderRadius: 8, padding: '3px 8px',
                }}>
                  <GraduationCap size={11} style={{
                    color: escola.alunosEstimado ? '#7C3AED'
                      : escola.alunosEfetivo >= 500 ? '#1D4ED8'
                      : escola.alunosEfetivo >= 200 ? '#15803D' : '#94A3B8',
                  }} />
                  <span style={{
                    fontSize: '.75rem', fontWeight: 700,
                    color: escola.alunosEstimado ? '#7C3AED'
                      : escola.alunosEfetivo >= 500 ? '#1D4ED8'
                      : escola.alunosEfetivo >= 200 ? '#15803D' : '#64748B',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                  }}>
                    {escola.alunosEstimado && '~'}{escola.alunosEfetivo.toLocaleString('pt-BR')}
                  </span>
                </div>
              </td>

              {/* Proposta */}
              <td style={{ padding: '.65rem 1rem', textAlign: 'center' }}>
                {escola.propostaEnviada ? (
                  <span title="Já existe proposta gerada para esta escola" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.25rem',
                    fontSize: '.65rem', fontWeight: 700,
                    background: '#F0FDF4', color: '#15803D',
                    border: '1px solid #BBF7D0',
                    padding: '2px 8px', borderRadius: 99,
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                  }}>
                    <CheckCircle2 size={11} /> Enviada
                  </span>
                ) : (
                  <span style={{
                    fontSize: '.65rem', color: '#CBD5E1',
                    fontFamily: 'var(--font-inter, sans-serif)',
                  }}>—</span>
                )}
              </td>

              {/* Estágio */}
              <td style={{ padding: '.65rem 1rem' }}>
                <StageBadge stage={escola.negociacao_stage} />
              </td>

              {/* Ações */}
              <td style={{ padding: '.65rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  {/* Registrar interação */}
                  <Link
                    href={`/comercial/escolas/${escola.id}`}
                    title="Ver escola / registrar interação"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: 7,
                      background: '#F8FAFC', border: '1px solid #E2E8F0',
                      color: '#475569', textDecoration: 'none',
                      transition: 'all .15s',
                    }}
                  >
                    <Pencil size={13} />
                  </Link>

                  {/* WhatsApp */}
                  {escola.whatsapp_url && (
                    <a
                      href={escola.whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir WhatsApp"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: 7,
                        background: '#F0FDF4', border: '1px solid #BBF7D0',
                        color: '#15803D', textDecoration: 'none',
                        transition: 'all .15s',
                      }}
                    >
                      <MessageCircle size={13} />
                    </a>
                  )}

                  {/* Editar */}
                  <Link
                    href={`/comercial/escolas/${escola.id}/editar`}
                    title="Editar escola"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: 7,
                      background: '#FFFBEB', border: '1px solid #FDE68A',
                      color: '#92400E', textDecoration: 'none',
                      transition: 'all .15s',
                    }}
                  >
                    <ArrowRight size={13} />
                  </Link>

                  {/* Excluir */}
                  <DeleteEscolaBtn escolaId={escola.id} escolaNome={escola.nome} variant="icon" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default async function PriorizacaoPage({ searchParams }: Props) {
  const params = await searchParams
  const ufAtivo = params.uf ?? ''
  const q = (params.q ?? '').trim()
  const page = Math.max(1, parseInt(params.page ?? '1') || 1)
  const somentePerfil = params.perfil === '1'

  const {
    elegiveis, filaCompletarCadastro, clientesAtivos, acaoUrgente,
    distribuicaoPorEstado, distribuicaoPorEstagio, distribuicaoPorPerfil,
    distribuicaoPorConfessionalidade, totalRespostasPesquisa,
    totalComAlunosCadastrados, totalSemAlunosCadastrados,
  } = await getFilaPriorizacao()

  // Lista de UFs para filtro (sempre a partir da fila completa, sem filtros aplicados)
  const ufs = [...new Set(elegiveis.map(e => e.estado).filter(Boolean) as string[])].sort()

  // Numera a posição de prioridade antes de filtrar/paginar, para manter o rank estável
  const elegiveisComRank = elegiveis.map((e, i) => ({ ...e, rank: i + 1 }))

  const qLower = q.toLowerCase()
  const elegiveisFiltrados = elegiveisComRank.filter(e => {
    if (ufAtivo && e.estado !== ufAtivo) return false
    if (somentePerfil && !e.perfilPesquisa?.confessionalidade) return false
    if (qLower && !e.nome.toLowerCase().includes(qLower) && !(e.cidade ?? '').toLowerCase().includes(qLower)) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(elegiveisFiltrados.length / PER_PAGE))
  const pageAtual = Math.min(page, totalPages)
  const elegiveisPaginados = elegiveisFiltrados.slice((pageAtual - 1) * PER_PAGE, pageAtual * PER_PAGE)

  // Preserva os filtros ativos ao trocar de UF/página/perfil
  const buildHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams({ uf: ufAtivo, q, perfil: somentePerfil ? '1' : '', ...overrides })
    ;[...p.keys()].forEach(k => { if (!p.get(k)) p.delete(k) })
    const qs = p.toString()
    return `/comercial/priorizacao${qs ? `?${qs}` : ''}`
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 16, padding: '1.75rem 2rem',
        marginBottom: '1.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
        boxShadow: '0 4px 20px rgba(15,23,42,.15)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.35rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #4A7FDB, #5FE3D0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={20} strokeWidth={2.5} style={{ color: 'white' }} />
            </div>
            <h1 style={{
              fontSize: '1.3rem', fontWeight: 800, color: 'white', margin: 0,
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              Fila de Abordagem Priorizada
            </h1>
          </div>
          <p style={{
            fontSize: '.8rem', color: 'rgba(255,255,255,.5)', margin: 0,
            fontFamily: 'var(--font-inter, sans-serif)',
          }}>
            {(ufAtivo || q)
              ? `${elegiveisFiltrados.length} de ${elegiveis.length} escolas — ordenadas por porte (alunos), do maior para o menor`
              : `${elegiveis.length} escolas — ordenadas por porte (alunos), do maior para o menor`
            }
          </p>
        </div>
        <a
          href="/api/priorizacao-export"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
            color: 'rgba(255,255,255,.8)', padding: '.6rem 1.1rem', borderRadius: 9,
            fontSize: '.78rem', fontWeight: 600, textDecoration: 'none',
            fontFamily: 'var(--font-montserrat, sans-serif)',
            transition: 'all .15s',
          }}
        >
          <FileDown size={15} />
          Exportar Excel
        </a>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}>
        <KpiCard
          label="Fila de Abordagem"
          value={elegiveis.length}
          sub="Escolas aguardando contato ou em andamento"
          icon={Users}
          cor="#4A7FDB"
        />
        <KpiCard
          label="Ação Urgente"
          value={acaoUrgente}
          sub="Em fechamento ou contrato pendente de assinatura"
          icon={AlertTriangle}
          cor="#DC2626"
          urgente={acaoUrgente > 0}
        />
        <KpiCard
          label="Completar Cadastro"
          value={filaCompletarCadastro.length}
          sub={`Sem porte no cadastro (${totalSemAlunosCadastrados} de ${totalComAlunosCadastrados + totalSemAlunosCadastrados}) — algumas com estimativa da pesquisa`}
          icon={Building2}
          cor="#F59E0B"
        />
        <KpiCard
          label="Parceiras Ativas"
          value={clientesAtivos.length}
          sub="Contratos assinados"
          icon={CheckCircle2}
          cor="#10B981"
        />
      </div>

      {/* ── Gráficos ──────────────────────────────────────────────────────── */}
      {(distribuicaoPorEstado.length > 0 || distribuicaoPorEstagio.length > 0 || distribuicaoPorPerfil.length > 0) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}>
          <MiniBarChart
            title="Top 10 Estados — Fila de Abordagem"
            data={distribuicaoPorEstado.map(d => ({ label: d.estado, count: d.count }))}
            colorHex="#4A7FDB"
          />
          <MiniBarChart
            title="Escolas por Estágio no Funil"
            data={distribuicaoPorEstagio.map(d => ({ label: d.label, count: d.count }))}
            colorHex="#5FE3D0"
          />
          <MiniBarChart
            title="Escolas por Perfil Pedagógico"
            data={distribuicaoPorPerfil.map(d => ({ label: d.label, count: d.count }))}
            colorHex="#B45309"
          />
          {distribuicaoPorConfessionalidade.length > 0 && (
            <div>
              <MiniBarChart
                title="Confessionalidade Cristã (Pesquisa Comercial)"
                data={distribuicaoPorConfessionalidade.map(d => ({ label: d.valor, count: d.count }))}
                colorHex="#7C3AED"
              />
              <div style={{
                fontSize: '.68rem', color: '#94A3B8', marginTop: '.4rem', textAlign: 'right',
                fontFamily: 'var(--font-inter, sans-serif)',
              }}>
                Resposta real de {totalRespostasPesquisa} escolas — as demais ainda não responderam
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Busca ─────────────────────────────────────────────────────────── */}
      <PriorizacaoSearch q={q} uf={ufAtivo} perfil={somentePerfil} />

      {/* ── Filtro por UF + Perfil de pesquisa ───────────────────────────── */}
      {ufs.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap',
          marginBottom: '1rem',
        }}>
          <span style={{
            fontSize: '.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase',
            letterSpacing: '.08em', fontFamily: 'var(--font-montserrat, sans-serif)',
            flexShrink: 0,
          }}>Filtrar por UF:</span>
          <a href={buildHref({ uf: '', page: '' })} style={{
            padding: '4px 12px', borderRadius: 99, fontSize: '.72rem', fontWeight: 700,
            textDecoration: 'none', fontFamily: 'var(--font-montserrat, sans-serif)',
            background: !ufAtivo ? 'linear-gradient(135deg, #4A7FDB, #5FE3D0)' : '#F1F5F9',
            color: !ufAtivo ? 'white' : '#475569',
            border: !ufAtivo ? 'none' : '1px solid #E2E8F0',
          }}>Todos</a>
          {ufs.map(uf => (
            <a key={uf} href={buildHref({ uf, page: '' })} style={{
              padding: '4px 12px', borderRadius: 99, fontSize: '.72rem', fontWeight: 700,
              textDecoration: 'none', fontFamily: 'var(--font-montserrat, sans-serif)',
              background: ufAtivo === uf ? 'linear-gradient(135deg, #4A7FDB, #5FE3D0)' : '#F1F5F9',
              color: ufAtivo === uf ? 'white' : '#475569',
              border: ufAtivo === uf ? 'none' : '1px solid #E2E8F0',
            }}>{uf}</a>
          ))}
          <span style={{ width: 1, height: 18, background: '#E2E8F0', margin: '0 .25rem' }} />
          <a href={buildHref({ perfil: somentePerfil ? '' : '1', page: '' })} title="Mostrar apenas escolas com resposta real na pesquisa comercial (confessionalidade)" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.3rem',
            padding: '4px 12px', borderRadius: 99, fontSize: '.72rem', fontWeight: 700,
            textDecoration: 'none', fontFamily: 'var(--font-montserrat, sans-serif)',
            background: somentePerfil ? 'linear-gradient(135deg, #7C3AED, #A78BFA)' : '#F1F5F9',
            color: somentePerfil ? 'white' : '#475569',
            border: somentePerfil ? 'none' : '1px solid #E2E8F0',
          }}>Com perfil de pesquisa</a>
        </div>
      )}

      {/* ── Tabela Principal ──────────────────────────────────────────────── */}
      <div style={{
        background: 'white',
        border: '1.5px solid #E2E8F0',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: '2rem',
        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
      }}>
        <TabelaEscolas escolas={elegiveisPaginados} />

        {/* Paginação */}
        {elegiveisFiltrados.length > 0 && totalPages > 1 && (
          <div style={{
            padding: '.85rem 1.25rem',
            borderTop: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '.75rem',
            background: '#FAFAFA',
          }}>
            <span style={{ fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Página <strong style={{ color: '#0F172A' }}>{pageAtual}</strong> de <strong style={{ color: '#0F172A' }}>{totalPages}</strong>
              {' '}— <strong style={{ color: '#0F172A' }}>{elegiveisFiltrados.length}</strong> escolas encontradas
            </span>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {pageAtual > 1 && (
                <a href={buildHref({ page: String(pageAtual - 1) })} style={{
                  padding: '6px 14px', borderRadius: 7, border: '1px solid #E2E8F0',
                  background: '#fff', fontSize: '.78rem', color: '#475569', textDecoration: 'none',
                  fontFamily: 'var(--font-montserrat, sans-serif)',
                }}>
                  ← Anterior
                </a>
              )}
              {pageAtual < totalPages && (
                <a href={buildHref({ page: String(pageAtual + 1) })} style={{
                  padding: '6px 14px', borderRadius: 7, background: '#4A7FDB', color: '#fff',
                  fontSize: '.78rem', fontWeight: 700, textDecoration: 'none',
                  fontFamily: 'var(--font-montserrat, sans-serif)',
                }}>
                  Próxima →
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Seção: Completar Cadastro ─────────────────────────────────────── */}
      {filaCompletarCadastro.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '.6rem',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: '#F59E0B',
            }} />
            <h2 style={{
              fontSize: '.9rem', fontWeight: 700, color: '#92400E', margin: 0,
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              Completar Cadastro ({filaCompletarCadastro.length})
            </h2>
            <span style={{
              fontSize: '.7rem', color: '#64748B',
              fontFamily: 'var(--font-inter, sans-serif)',
            }}>
              — escolas sem dados de porte preenchidos
            </span>
          </div>
          <div style={{
            background: 'white', border: '1.5px solid #FDE68A',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,.04)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#92400E' }}>
                    {['Escola', 'UF / Cidade', 'Situação Comercial', 'Ações'].map(col => (
                      <th key={col} style={{
                        padding: '.65rem 1rem', textAlign: 'left',
                        fontSize: '.62rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '.1em',
                        color: 'rgba(255,255,255,.7)',
                        fontFamily: 'var(--font-montserrat, sans-serif)',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filaCompletarCadastro.map((escola, idx) => (
                    <tr key={escola.id} style={{
                      background: idx % 2 === 0 ? 'white' : '#FFFBEB',
                      borderBottom: '1px solid #FEF3C7',
                    }}>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <Link href={`/comercial/escolas/${escola.id}`} style={{
                          fontSize: '.82rem', fontWeight: 600, color: '#0F172A',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-montserrat, sans-serif)',
                        }}>
                          {escola.nome}
                        </Link>
                      </td>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <span style={{
                          fontSize: '.75rem', color: '#64748B',
                          fontFamily: 'var(--font-inter, sans-serif)',
                        }}>
                          {[escola.cidade, escola.estado].filter(Boolean).join(' — ') || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <StageBadge stage={escola.negociacao_stage} />
                      </td>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <Link
                            href={`/comercial/escolas/${escola.id}/editar`}
                            title="Completar dados da escola"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, borderRadius: 6,
                              background: '#FFFBEB', border: '1px solid #FDE68A',
                              color: '#92400E', textDecoration: 'none',
                            }}
                          >
                            <Pencil size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Seção: Parceiras Ativas ───────────────────────────────────────── */}
      {clientesAtivos.length > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '.6rem',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: '#10B981',
            }} />
            <h2 style={{
              fontSize: '.9rem', fontWeight: 700, color: '#065F46', margin: 0,
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              Parceiras Ativas ({clientesAtivos.length})
            </h2>
            <span style={{
              fontSize: '.7rem', color: '#64748B',
              fontFamily: 'var(--font-inter, sans-serif)',
            }}>
              — contratos assinados
            </span>
          </div>
          <div style={{
            background: 'white', border: '1.5px solid #A7F3D0',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,.04)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#065F46' }}>
                    {['Escola', 'UF / Cidade', 'Alunos', 'Ações'].map(col => (
                      <th key={col} style={{
                        padding: '.65rem 1rem', textAlign: 'left',
                        fontSize: '.62rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '.1em',
                        color: 'rgba(255,255,255,.7)',
                        fontFamily: 'var(--font-montserrat, sans-serif)',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientesAtivos.map((escola, idx) => (
                    <tr key={escola.id} style={{
                      background: idx % 2 === 0 ? 'white' : '#F0FDF4',
                      borderBottom: '1px solid #D1FAE5',
                    }}>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                          <Link href={`/comercial/escolas/${escola.id}`} style={{
                            fontSize: '.82rem', fontWeight: 600, color: '#065F46',
                            textDecoration: 'none',
                            fontFamily: 'var(--font-montserrat, sans-serif)',
                          }}>
                            {escola.nome}
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <span style={{
                          fontSize: '.75rem', color: '#64748B',
                          fontFamily: 'var(--font-inter, sans-serif)',
                        }}>
                          {[escola.cidade, escola.estado].filter(Boolean).join(' — ') || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <span style={{
                          fontSize: '.75rem', fontWeight: 700, color: '#065F46',
                          fontFamily: 'var(--font-montserrat, sans-serif)',
                        }}>
                          {escola.total_alunos.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <Link
                          href={`/comercial/escolas/${escola.id}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 6,
                            background: '#F0FDF4', border: '1px solid #A7F3D0',
                            color: '#065F46', textDecoration: 'none',
                          }}
                        >
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
