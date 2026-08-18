import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buscarEscolasUnificadas } from '@/lib/escolas-unificadas'
import { upsertNegociacao } from '@/lib/actions'
import { getFunilContratacao, FASE_LABELS, FASE_FUNIL_ORDEM, type FaseFunil, type LeadTemperatura } from '@/lib/funil-contratacao'
import { META_RECEITA } from '@/lib/metas'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EscolaSelector } from '@/components/ui/EscolaSelector'
import { FunilVisual } from '@/components/comercial/FunilVisual'
import { STAGE_OPTIONS } from '@/types/database'

interface Props { searchParams: Promise<{ escola?: string; fase?: string; q?: string }> }

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
  marginBottom: '1.5rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)',
}
const secHdr = (color = '#4A7FDB'): React.CSSProperties => ({
  padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9',
  background: '#fafafa', display: 'flex', alignItems: 'center', gap: '.65rem',
})
const dot = (c = '#4A7FDB'): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: c,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})
const secTitle: React.CSSProperties = {
  fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a',
}
const body: React.CSSProperties = { padding: '1.5rem 1.75rem' }
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.06em', color: '#64748b', marginBottom: '.45rem',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '.7rem .9rem', fontSize: '.875rem',
  fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
}
const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 1.5rem' }

const FASE_COR: Record<FaseFunil, { bg: string; text: string; border: string }> = {
  negociacao:        { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  proposta_enviada:  { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
  minuta:            { bg: '#fdf4ff', text: '#a21caf', border: '#e9d5ff' },
  contrato_enviado:  { bg: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd' },
  contrato_assinado: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  implantacao:       { bg: '#f5f3ff', text: '#7c3aed', border: '#c4b5fd' },
  parceiro_ativo:    { bg: '#ecfdf5', text: '#059669', border: '#6ee7b7' },
}

const TEMP_COR: Record<LeadTemperatura, { bg: string; text: string; border: string; dot: string; label: string }> = {
  quente: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', dot: '#dc2626', label: 'Quente' },
  morno:  { bg: '#fffbeb', text: '#b45309', border: '#fcd34d', dot: '#f59e0b', label: 'Morno' },
  frio:   { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd', dot: '#60a5fa', label: 'Frio' },
}

function TemperaturaBadge({ temperatura, score }: { temperatura: LeadTemperatura; score: number }) {
  const cor = TEMP_COR[temperatura]
  return (
    <span title={`Lead score: ${score}/100`} style={{
      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
      background: cor.bg, color: cor.text, border: `1px solid ${cor.border}`,
      padding: '.2rem .55rem', borderRadius: 99,
      fontSize: '.62rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cor.dot, display: 'inline-block' }} />
      {cor.label} · {score}
    </span>
  )
}

function FaseBadge({ fase }: { fase: FaseFunil }) {
  const cor = FASE_COR[fase]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.25rem',
      background: cor.bg, color: cor.text, border: `1px solid ${cor.border}`,
      padding: '.2rem .6rem', borderRadius: 99,
      fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
      fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap',
    }}>
      {FASE_LABELS[fase]}
    </span>
  )
}

export default async function FunilContratacaoPage({ searchParams }: Props) {
  const params   = await searchParams
  const escolaId = params.escola ?? ''
  const faseFiltro = (params.fase ?? '') as FaseFunil | ''
  const q = (params.q ?? '').toLowerCase()

  const supabase = await createClient()
  const admin = createAdminClient()

  const [{ linhas, kpis }, escolasSelect, { data: usuariosAtivos }] = await Promise.all([
    getFunilContratacao(),
    buscarEscolasUnificadas(supabase),
    admin.from('usuarios').select('id, nome_completo').eq('ativo', true).order('nome_completo'),
  ])

  let escolaSelecionada: { id: string; nome: string; cidade: string | null; estado: string | null } | null = null
  let negociacaoAtual: { id: string; stage: string; valor_estimado: number | null; observacoes: string | null; responsavel_id: string | null } | null = null

  if (escolaId) {
    const [{ data: e }, { data: n }] = await Promise.all([
      supabase.from('escolas').select('id, nome, cidade, estado').eq('id', escolaId).single(),
      admin.from('negociacoes').select('id, stage, valor_estimado, observacoes, responsavel_id').eq('escola_id', escolaId).eq('ativa', true).maybeSingle(),
    ])
    escolaSelecionada = e
    negociacaoAtual = n
  }

  const linhasFiltradas = linhas.filter(l => {
    if (faseFiltro && l.fase_funil !== faseFiltro) return false
    if (q && !l.escola_nome.toLowerCase().includes(q)) return false
    return true
  })

  const pctReceita = Math.min(100, Math.round((kpis.valorContratadoTotal / META_RECEITA) * 100))

  return (
    <div>
      <PageHeader title="Funil de Contratação" subtitle="Da negociação ao contrato assinado — visão consolidada por escola" />

      <div style={{ padding: '2rem 2.5rem' }}>

        {/* ── KPIs ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Escolas em Funil',   value: kpis.totalEscolasEmFunil, sub: 'ativas no funil', cor: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
            { label: 'Valor em Pipeline',  value: formatCurrency(kpis.valorPipelineTotal), sub: 'negociações abertas', cor: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
            { label: 'Valor Contratado',   value: formatCurrency(kpis.valorContratadoTotal), sub: 'contratos assinados', cor: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
            { label: 'Em Implantação',     value: kpis.emImplantacao, sub: 'pós-arquivamento', cor: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
            { label: 'Meta de Receita 2027', value: `${pctReceita}%`, sub: formatCurrency(META_RECEITA), cor: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 14, padding: '1.1rem 1.25rem', borderTop: `3px solid ${k.cor}` }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.35rem' }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, color: '#0f172a' }}>{k.value}</div>
              <div style={{ fontSize: '.7rem', color: '#64748b', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Funil visual + classificação de leads ─────────── */}
        <div style={card}>
          <div style={secHdr('#0f172a')}>
            <div>
              <div style={secTitle}>Funil de Vendas</div>
              <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.1rem' }}>
                Cada etapa soma as escolas nela ou em qualquer etapa mais avançada. Cor = temperatura do lead (modelo de lead scoring — probabilidade da negociação, engajamento, recência e sinal de compra).
              </div>
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <FunilVisual
              estagios={FASE_FUNIL_ORDEM.map((fase, idx) => {
                const faseComOuMaisAvancadas = FASE_FUNIL_ORDEM.slice(idx)
                const acumulado = faseComOuMaisAvancadas.reduce((acc, f) => ({
                  total:  acc.total  + kpis.porFase[f],
                  quente: acc.quente + kpis.porFaseTemperatura[f].quente,
                  morno:  acc.morno  + kpis.porFaseTemperatura[f].morno,
                  frio:   acc.frio   + kpis.porFaseTemperatura[f].frio,
                }), { total: 0, quente: 0, morno: 0, frio: 0 })
                return { fase, label: FASE_LABELS[fase], ...acumulado }
              })}
            />
          </div>
        </div>

        {/* ── Distribuição por fase ─────────────────────────── */}
        <div style={{ ...card }}>
          <div style={secHdr('#0f172a')}>
            <div style={secTitle}>Distribuição por Fase</div>
          </div>
          <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
            {(Object.keys(FASE_LABELS) as FaseFunil[]).map(fase => (
              <Link key={fase} href={faseFiltro === fase ? '/comercial/funil-contratacao' : `/comercial/funil-contratacao?fase=${fase}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.55rem .9rem',
                  borderRadius: 10, background: faseFiltro === fase ? '#0f172a' : '#f8fafc',
                  border: `1.5px solid ${faseFiltro === fase ? '#0f172a' : '#e2e8f0'}`,
                }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: faseFiltro === fase ? '#fff' : '#334155', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    {FASE_LABELS[fase]}
                  </span>
                  <span style={{
                    fontSize: '.72rem', fontWeight: 800, color: faseFiltro === fase ? '#fff' : '#0f172a',
                    fontFamily: 'var(--font-cormorant,serif)',
                  }}>
                    {kpis.porFase[fase]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Seletor de escola + formulário rápido de negociação ── */}
        <div style={card}>
          <div style={secHdr()}>
            <div style={secTitle}>Registrar / Atualizar Negociação</div>
          </div>
          <div style={{ padding: '1.25rem 1.75rem' }}>
            <EscolaSelector
              escolas={escolasSelect ?? []}
              escolaId={escolaId}
              basePath="/comercial/funil-contratacao"
              placeholder="— Escolha uma escola para registrar a negociação —"
              extraButton={escolaSelecionada ? (
                <>
                  <Link href={`/comercial/contratos?escola=${escolaId}`} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: '.8rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                    Editar Contrato Completo →
                  </Link>
                  <Link href={`/comercial/jornada?escola=${escolaId}`} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: '.8rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                    Ver Jornada →
                  </Link>
                </>
              ) : undefined}
            />
          </div>

          {escolaSelecionada && (
            <form action={upsertNegociacao} style={{ padding: '0 1.75rem 1.75rem' }}>
              <input type="hidden" name="id" value={negociacaoAtual?.id ?? ''} />
              <input type="hidden" name="escola_id" value={escolaId} />
              <input type="hidden" name="ativa" value="true" />

              <div style={{ ...g2, marginBottom: '1.25rem' }}>
                <div>
                  <label style={lbl}>Estágio</label>
                  <select name="stage" defaultValue={negociacaoAtual?.stage ?? 'prospeccao'} style={{ ...inp, cursor: 'pointer' }}>
                    {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Valor Total Estimado (R$/ano)</label>
                  <input name="valor_estimado" type="number" min="0" step="0.01" style={inp}
                    defaultValue={negociacaoAtual?.valor_estimado ?? ''} placeholder="Ex: 67550.00" />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={lbl}>Responsável</label>
                <select name="responsavel_id" defaultValue={negociacaoAtual?.responsavel_id ?? ''} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">— Selecione —</option>
                  {(usuariosAtivos ?? []).map((u: { id: string; nome_completo: string }) => (
                    <option key={u.id} value={u.id}>{u.nome_completo}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={lbl}>Observações da negociação</label>
                <textarea name="observacoes" rows={3} style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                  defaultValue={negociacaoAtual?.observacoes ?? ''}
                  placeholder="Histórico de negociação, condições especiais, motivo de recusa..." />
              </div>

              <button type="submit" style={{ background: 'linear-gradient(135deg, #4A7FDB, #2563b8)', color: '#fff', padding: '.7rem 2rem', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: '.875rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 14px rgba(74,127,219,.35)' }}>
                Salvar Negociação
              </button>
            </form>
          )}
        </div>

        {/* ── Tabela principal ──────────────────────────────── */}
        <div style={card}>
          <div style={{ ...secHdr('#6366f1'), justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={secTitle}>Escolas em Processo Comercial</div>
              <div style={{ fontSize: '.66rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.25rem', maxWidth: 520 }}>
                Alunos/Cidade vêm do cadastro da escola, Reuniões e 1º Contato vêm dos Registros, Valor vem da Proposta/Negociação e Fase vem do Contrato — clique em "Editar" para atualizar a negociação, ou use os links "Contrato Completo" / "Jornada" para os demais dados.
              </div>
            </div>
            <form style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
              {faseFiltro && <input type="hidden" name="fase" value={faseFiltro} />}
              <input name="q" defaultValue={params.q ?? ''} placeholder="Buscar por escola..." style={{ ...inp, width: 220, padding: '.4rem .7rem', fontSize: '.78rem' }} />
            </form>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {linhasFiltradas.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Escola', 'Contato', 'Cidade/UF', 'Responsável', 'Alunos', 'Segmentos', '1º Contato', 'Reuniões', 'Valor/Desconto', 'Fase', 'Lead', 'Observação', ''].map(col => (
                      <th key={col} style={{ padding: '.7rem 1rem', textAlign: 'left', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.65)', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhasFiltradas.map((l, idx) => (
                    <tr key={l.escola_id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle', maxWidth: 200 }}>
                        <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.escola_nome}
                        </div>
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.78rem', color: '#475569' }}>{l.contato_nome ?? '—'}</td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {l.cidade ?? '—'}{l.estado ? `/${l.estado}` : ''}
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.78rem', color: '#475569', whiteSpace: 'nowrap' }}>{l.responsavel_nome ?? '—'}</td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.82rem', color: '#0f172a', fontWeight: 700, textAlign: 'center' }}>{l.alunos_cadastro || '—'}</td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>{l.segmentos_ativos.join(', ') || '—'}</td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.78rem', color: '#334155', maxWidth: 200 }}
                        title={l.primeiro_contato_resumo ?? ''}>
                        {l.primeiro_contato ? (
                          <>
                            <div>{formatDate(l.primeiro_contato)}</div>
                            {l.primeiro_contato_resumo && (
                              <div style={{ fontSize: '.65rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {l.primeiro_contato_resumo}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link href={`/comercial/registros/novo?escola=${l.escola_id}`} style={{ fontSize: '.68rem', fontWeight: 700, color: '#b45309', textDecoration: 'none' }}>
                            + registrar
                          </Link>
                        )}
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.78rem', color: '#334155', whiteSpace: 'nowrap' }}>
                        {l.reunioes_total > 0 ? (
                          <>
                            <strong>{l.reunioes_total}</strong>
                            {l.ultima_interacao && <span style={{ color: '#94a3b8' }}> · {formatDate(l.ultima_interacao)}</span>}
                          </>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '.9rem', fontWeight: 700, color: '#0f172a' }}>
                          {l.proposta_valor_aluno_ano
                            ? `${formatCurrency(l.proposta_valor_aluno_ano)}/aluno`
                            : l.negociacao_valor_estimado
                              ? formatCurrency(l.negociacao_valor_estimado)
                              : l.contrato_valor_total > 0 ? formatCurrency(l.contrato_valor_total) : '—'}
                        </div>
                        {l.proposta_desconto_pct != null && l.proposta_desconto_pct > 0 && (
                          <div style={{ fontSize: '.65rem', color: '#b45309' }}>{l.proposta_desconto_pct}% desconto</div>
                        )}
                      </td>
                      <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                        <FaseBadge fase={l.fase_funil} />
                      </td>
                      <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                        <TemperaturaBadge temperatura={l.lead_temperatura} score={l.lead_score} />
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.72rem', color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={l.negociacao_observacoes ?? ''}>
                        {l.negociacao_observacoes ?? '—'}
                      </td>
                      <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                        <Link href={`/comercial/funil-contratacao?escola=${l.escola_id}`} style={{ fontSize: '.72rem', fontWeight: 700, color: '#4A7FDB', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          Editar →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                <div style={{ fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Nenhuma escola em processo comercial ainda. Registre uma negociação acima para começar.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
