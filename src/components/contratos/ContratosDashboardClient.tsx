'use client'

import Link from 'next/link'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from 'recharts'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'

export interface DashboardData {
  kpis: {
    contratosAtivos: number
    receitaTotal: number
    receitaAnual: number
    alunosAtendidos: number
    ticketMedio: number
    aditivosPendentes: number
    comClausulaEspecial: number
  }
  modeloComercial: { modelo: string; contratos: number; receita: number }[]
  alunosPorSegmento: { segmento: string; alunos: number }[]
  renovacoes: { ano: number; quantidade: number; status: 'critico' | 'atencao' | 'ok' }[]
  contratosResumo: {
    nome: string
    modelo: string
    valorAnual: number
    valorTotal: number
    duracaoMeses: number | null
    decorridoMeses: number | null
    veterana: boolean
    vigenciaInicio: string | null
    vigenciaFim: string | null
  }[]
  clausulasEspeciais: { nome: string; clausula: string }[]
}

// Paleta categórica validada (CVD-safe nos 4 primeiros slots, ordem fixa —
// nunca reordenar por valor, só identidade) — ver skill de dataviz.
const CATEGORICA = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100']
// Cores de status (reservadas — sempre com rótulo junto, nunca só a cor).
const STATUS = { critico: '#dc2626', atencao: '#f59e0b', ok: '#16a34a' } as const
const STATUS_LABEL = { critico: '≤ 1 ano', atencao: '2 anos', ok: '3+ anos' } as const

const cardBase: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
  boxShadow: '0 1px 4px rgba(0,41,51,.06)', overflow: 'hidden',
}
const secHdr: React.CSSProperties = {
  padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa',
}
const secTitle: React.CSSProperties = {
  fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '.07em', color: '#002933',
}
const secSub: React.CSSProperties = {
  fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.2rem',
}

function Kpi({ label, value, insight, color, bg, border }: { label: string; value: string; insight: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '1.25rem 1.4rem', borderTop: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: '.5rem', minHeight: 150 }}>
      <div style={{ fontSize: '.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
        {label}
      </div>
      {/* Valor já vem abreviado ("R$ 3,6 mi") pra caber numa linha só;
          clamp() é só rede de segurança pra telas bem estreitas. */}
      <div style={{
        fontFamily: 'var(--font-cormorant,serif)', fontWeight: 800, lineHeight: 1.05, color: '#002933',
        fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(1.3rem, 2.3vw, 1.9rem)',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '.74rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.45 }}>{insight}</div>
    </div>
  )
}

function TooltipMoeda({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#002933', color: '#fff', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.78rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
      <div style={{ fontWeight: 700, marginBottom: '.2rem' }}>{label}</div>
      {payload.map((p: any) => <div key={p.dataKey}>{p.name}: {formatCurrency(p.value)}</div>)}
    </div>
  )
}

function TooltipContagem({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#002933', color: '#fff', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.78rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
      <div style={{ fontWeight: 700, marginBottom: '.2rem' }}>{label}</div>
      {payload.map((p: any) => <div key={p.dataKey}>{p.name}: {p.value}</div>)}
    </div>
  )
}

function RankingBarras({ titulo, itens, maior }: { titulo: string; itens: { nome: string; valor: number }[]; maior: number }) {
  return (
    <div>
      <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.75rem' }}>
        {titulo}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        {itens.map(r => (
          <div key={r.nome} style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            <div style={{ width: 130, flexShrink: 0, fontSize: '.74rem', fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.nome}>
              {r.nome}
            </div>
            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 18, position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(r.valor / maior) * 100}%`, background: 'linear-gradient(90deg, #00889e, #00ceff)', borderRadius: 6 }} />
            </div>
            <div style={{ width: 92, flexShrink: 0, textAlign: 'right', fontSize: '.74rem', fontWeight: 700, color: '#002933', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {formatCurrencyCompact(r.valor)}
            </div>
          </div>
        ))}
        {itens.length === 0 && <div style={{ fontSize: '.8rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>Sem dados.</div>}
      </div>
    </div>
  )
}

export function ContratosDashboardClient({ data, mapa }: { data: DashboardData; mapa: React.ReactNode }) {
  const { kpis, modeloComercial, alunosPorSegmento, renovacoes, contratosResumo, clausulasEspeciais } = data

  const topAnual = [...contratosResumo].filter(c => c.valorAnual > 0).sort((a, b) => b.valorAnual - a.valorAnual).slice(0, 10)
    .map(c => ({ nome: c.nome, valor: c.valorAnual }))
  const topTotal = [...contratosResumo].filter(c => c.valorTotal > 0).sort((a, b) => b.valorTotal - a.valorTotal).slice(0, 10)
    .map(c => ({ nome: c.nome, valor: c.valorTotal }))
  const maiorAnual = Math.max(1, ...topAnual.map(r => r.valor))
  const maiorTotal = Math.max(1, ...topTotal.map(r => r.valor))

  // Veterana/Nova lê o mesmo campo `contratos.marcado_veterana` que o Funil
  // de Contratação usa pra classificar o quadro "Escolas Atendidas" — aqui
  // é só outra forma de olhar pro mesmo dado, não uma classificação
  // paralela. (No Funil, uma veterana com contrato novo assinado aparece no
  // quadro "Contrato" em vez de "Efetivada" — os dois quadros mostram coisas
  // diferentes: o Funil mostra o estágio do negócio, aqui mostra se a
  // relação com a escola é antiga ou nova.)
  const veteranas = contratosResumo.filter(c => c.veterana).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const novas = contratosResumo.filter(c => !c.veterana).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const prazoResumo = (c: DashboardData['contratosResumo'][number]) => {
    if (!c.vigenciaInicio || !c.vigenciaFim) return '—'
    const ini = new Date(c.vigenciaInicio + 'T00:00:00').getFullYear()
    const fim = new Date(c.vigenciaFim + 'T00:00:00').getFullYear()
    return `${ini}–${fim}${c.duracaoMeses ? ` · ${c.duracaoMeses} meses` : ''}`
  }

  const totalContratos = modeloComercial.reduce((a, m) => a + m.contratos, 0)
  const insightModelo = modeloComercial
    .map(m => `${m.contratos} ${m.modelo.toLowerCase()}`)
    .join(', ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <Kpi label="Contratos Ativos" value={String(kpis.contratosAtivos)} insight="Assinados e em vigor — contratos declinados não entram nessa conta." color="#16a34a" bg="#f0fdf4" border="#86efac" />
        <Kpi label="Receita Anual" value={formatCurrencyCompact(kpis.receitaAnual)} insight="Soma do valor cobrado no 1º ano de cada contrato ativo (mensalidade × 12, ou Kit do ano 1)." color="#00889e" bg="#f0fdfa" border="#99f6e4" />
        <Kpi label="Receita Contratada Total" value={formatCurrencyCompact(kpis.receitaTotal)} insight="Soma projetada pra toda a vigência de cada contrato — real quando o documento declara, estimada (sem reajuste) quando só declara o 1º ano." color="#0369a1" bg="#eff6ff" border="#93c5fd" />
        <Kpi label="Alunos Atendidos" value={String(kpis.alunosAtendidos)} insight="Soma de todas as séries, Infantil ao Médio, dos contratos ativos." color="#2563eb" bg="#eff6ff" border="#93c5fd" />
        <Kpi label="Ticket Médio" value={formatCurrencyCompact(kpis.ticketMedio)} insight="Valor total do contrato dividido pelo nº de escolas com valor cadastrado." color="#7c3aed" bg="#f5f3ff" border="#c4b5fd" />
        <Kpi label="Aditivos Pendentes" value={String(kpis.aditivosPendentes)} insight="Termos aditivos já registrados que ainda aguardam assinatura da escola." color="#f59e0b" bg="#fffbeb" border="#fcd34d" />
        <Kpi label="Cláusulas Especiais" value={String(kpis.comClausulaEspecial)} insight="Contratos com condição comercial fora do padrão — ver lista de referência abaixo." color="#dc2626" bg="#fef2f2" border="#fecaca" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Mapa ────────────────────────────────────────────────────── */}
        <div style={cardBase}>
          <div style={secHdr}>
            <div style={secTitle}>Escolas por Estado</div>
            <div style={secSub}>Contratos ativos, distribuição regional</div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {mapa}
          </div>
        </div>

        {/* ── Modelo comercial ────────────────────────────────────────── */}
        <div style={cardBase}>
          <div style={secHdr}>
            <div style={secTitle}>Modelo Comercial</div>
            <div style={secSub}>Mensalidade (contratos antigos, plataforma digital) vs. Kit We Make (contratos novos 2027, material impresso)</div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={modeloComercial} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="modelo" tick={{ fontSize: 11, fontFamily: 'var(--font-inter,sans-serif)', fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-inter,sans-serif)', fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip content={<TooltipContagem />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="contratos" name="Contratos" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {modeloComercial.map((_, i) => <Cell key={i} fill={CATEGORICA[i % CATEGORICA.length]} />)}
                  <LabelList dataKey="contratos" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#002933' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '.74rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.5rem' }}>
              Dos {totalContratos} contratos ativos: {insightModelo}.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', paddingTop: '.5rem', borderTop: '1px solid #f1f5f9' }}>
              {modeloComercial.map((m, i) => (
                <div key={m.modelo} style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: CATEGORICA[i % CATEGORICA.length], marginRight: '.35rem' }} />
                  {m.modelo}: <strong style={{ color: '#002933' }}>{formatCurrencyCompact(m.receita)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Alunos por segmento ─────────────────────────────────────── */}
        <div style={cardBase}>
          <div style={secHdr}>
            <div style={secTitle}>Alunos por Segmento</div>
            <div style={secSub}>Total de alunos atendidos, agrupado por etapa de ensino</div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={alunosPorSegmento} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="segmento" tick={{ fontSize: 11, fontFamily: 'var(--font-inter,sans-serif)', fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-inter,sans-serif)', fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                <Tooltip content={<TooltipContagem />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="alunos" name="Alunos" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {alunosPorSegmento.map((_, i) => <Cell key={i} fill={CATEGORICA[i % CATEGORICA.length]} />)}
                  <LabelList dataKey="alunos" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#002933' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Renovações por ano ──────────────────────────────────────── */}
        <div style={cardBase}>
          <div style={secHdr}>
            <div style={secTitle}>Vigências a Vencer</div>
            <div style={secSub}>Quantidade de contratos por ano de término — planejamento de renovação</div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={renovacoes} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="ano" tick={{ fontSize: 11, fontFamily: 'var(--font-inter,sans-serif)', fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-inter,sans-serif)', fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                <Tooltip content={<TooltipContagem />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="quantidade" name="Contratos" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {renovacoes.map((r, i) => <Cell key={i} fill={STATUS[r.status]} />)}
                  <LabelList dataKey="quantidade" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#002933' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem', paddingTop: '.75rem', borderTop: '1px solid #f1f5f9' }}>
              {(['critico', 'atencao', 'ok'] as const).map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STATUS[s] }} />
                  {STATUS_LABEL[s]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Veteranas vs Novas — mesmo campo que o Funil de Contratação
          usa pra "Escolas Atendidas" (contratos.marcado_veterana) ──────── */}
      <div style={cardBase}>
        <div style={secHdr}>
          <div style={secTitle}>Escolas Veteranas e Escolas Novas</div>
          <div style={secSub}>Mesma classificação do Funil de Contratação (campo "marcado como veterana") — aqui organizada por prazo de contrato</div>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.75rem' }}>
              Veteranas ({veteranas.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {veteranas.map(c => (
                <div key={c.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', padding: '.5rem .75rem', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8 }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#002933' }}>{c.nome}</span>
                  <span style={{ fontSize: '.72rem', color: '#0f766e', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{prazoResumo(c)}</span>
                </div>
              ))}
              {veteranas.length === 0 && <div style={{ fontSize: '.8rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>Nenhuma.</div>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.75rem' }}>
              Novas ({novas.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {novas.map(c => (
                <div key={c.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', padding: '.5rem .75rem', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8 }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#002933' }}>{c.nome}</span>
                  <span style={{ fontSize: '.72rem', color: '#1d4ed8', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{prazoResumo(c)}</span>
                </div>
              ))}
              {novas.length === 0 && <div style={{ fontSize: '.8rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>Nenhuma.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Ranking de receita: anual vs total do contrato ────────────── */}
      <div style={cardBase}>
        <div style={secHdr}>
          <div style={secTitle}>Ranking de Receita por Escola</div>
          <div style={secSub}>Valor anual (1º ano) e valor total projetado pra toda a vigência — lado a lado, pra não misturar as duas escalas</div>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <RankingBarras titulo="Top 10 — Valor Anual (1º ano)" itens={topAnual} maior={maiorAnual} />
          <RankingBarras titulo="Top 10 — Valor Total do Contrato" itens={topTotal} maior={maiorTotal} />
        </div>
      </div>

      {/* ── Progresso de vigência por escola ───────────────────────────── */}
      <div style={cardBase}>
        <div style={secHdr}>
          <div style={secTitle}>Progresso de Vigência</div>
          <div style={secSub}>Quanto tempo de contrato já passou e quanto ainda resta, por escola</div>
        </div>
        <div style={{ padding: '0 1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Escola', 'Modelo', 'Valor Anual', 'Valor Total', 'Vigência'].map(col => (
                  <th key={col} style={{ textAlign: col === 'Escola' ? 'left' : col === 'Vigência' ? 'left' : 'right', padding: '.6rem .5rem', fontSize: '.64rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contratosResumo.map(c => {
                const pct = c.duracaoMeses && c.decorridoMeses !== null ? Math.min(100, Math.round((c.decorridoMeses / c.duracaoMeses) * 100)) : null
                const anosDecorridos = c.decorridoMeses !== null ? (c.decorridoMeses / 12).toFixed(1) : null
                const anosRestantes = c.duracaoMeses && c.decorridoMeses !== null ? ((c.duracaoMeses - c.decorridoMeses) / 12).toFixed(1) : null
                return (
                  <tr key={c.nome} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '.6rem .5rem', fontSize: '.78rem', fontWeight: 600, color: '#002933', whiteSpace: 'nowrap' }}>{c.nome}</td>
                    <td style={{ padding: '.6rem .5rem', fontSize: '.74rem', color: '#64748b', textAlign: 'right', whiteSpace: 'nowrap' }}>{c.modelo}</td>
                    <td style={{ padding: '.6rem .5rem', fontSize: '.78rem', color: '#334155', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatCurrency(c.valorAnual)}</td>
                    <td style={{ padding: '.6rem .5rem', fontSize: '.78rem', fontWeight: 700, color: '#002933', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatCurrency(c.valorTotal)}</td>
                    <td style={{ padding: '.6rem .5rem', minWidth: 220 }}>
                      {pct !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#dc2626' : pct >= 65 ? '#f59e0b' : '#16a34a', borderRadius: 6 }} />
                          </div>
                          <div style={{ fontSize: '.68rem', color: '#64748b', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {anosDecorridos} de {(c.duracaoMeses! / 12).toFixed(1)} anos ({anosRestantes} restantes)
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '.72rem', color: '#cbd5e1' }}>Sem vigência cadastrada</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ height: '1rem' }} />
      </div>

      {/* ── Cláusulas especiais ─────────────────────────────────────────── */}
      <div style={cardBase}>
        <div style={secHdr}>
          <div style={secTitle}>Cláusulas Especiais</div>
          <div style={secSub}>Condições que diferem do contrato padrão — referência rápida</div>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          {clausulasEspeciais.map(c => (
            <div key={c.nome} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '.65rem .85rem' }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#92400e', marginBottom: '.2rem' }}>{c.nome}</div>
              <div style={{ fontSize: '.76rem', color: '#78350f', lineHeight: 1.5 }}>{c.clausula}</div>
            </div>
          ))}
          {clausulasEspeciais.length === 0 && (
            <div style={{ fontSize: '.82rem', color: '#94a3b8', textAlign: 'center', padding: '1.5rem 0', gridColumn: '1 / -1' }}>Nenhuma cláusula especial registrada ainda.</div>
          )}
        </div>
      </div>

      <div style={{ ...cardBase, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <div style={{ fontSize: '.8rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
          Situação lida da Jornada Contratual de cada escola. Contratos declinados não entram nos indicadores.
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <Link href="/comercial/contratos" style={{ fontSize: '.8rem', fontWeight: 600, color: '#00889e', textDecoration: 'none' }}>Jornada contratual →</Link>
          <Link href="/contratos/dados" style={{ fontSize: '.8rem', fontWeight: 600, color: '#00889e', textDecoration: 'none' }}>Dados por escola →</Link>
        </div>
      </div>
    </div>
  )
}
