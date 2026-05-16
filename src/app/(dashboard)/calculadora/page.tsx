'use client'

import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTES — taxas Eskolare
   ═══════════════════════════════════════════════════════════════════ */
const TAXA_PLATAFORMA   = 0.015
const TAXA_FIXA_PARCELA = 0.30
const VALOR_MIN_PARCELA = 30.00
const MANUTENCAO_MENSAL = 70
const MESES_LOJA        = 3
const MANUTENCAO_TOTAL  = MANUTENCAO_MENSAL * MESES_LOJA  // R$ 210 fixo por loja

const SEGMENTOS = [
  { id: 'inf2',  label: 'Infantil 2'    },
  { id: 'inf3',  label: 'Infantil 3'    },
  { id: 'inf4',  label: 'Infantil 4'    },
  { id: 'inf5',  label: 'Infantil 5'    },
  { id: 'f1a1',  label: '1º Ano Fund I' },
  { id: 'f1a2',  label: '2º Ano Fund I' },
  { id: 'f1a3',  label: '3º Ano Fund I' },
  { id: 'f1a4',  label: '4º Ano Fund I' },
  { id: 'f1a5',  label: '5º Ano Fund I' },
]

/* ═══════════════════════════════════════════════════════════════════
   TIPOS
   ═══════════════════════════════════════════════════════════════════ */
interface SegmentoCalc {
  id: string; label: string; ativo: boolean; igualPrimeiro: boolean
  custo: number
  // Comissão pode ser em % ou em R$ fixo
  comissaoTipo: 'pct' | 'abs'   // 'pct' = percentual | 'abs' = valor absoluto
  comissaoPct: number            // percentual (%)
  comissaoAbs: number            // valor absoluto (R$)
  qtdAlunos: number              // quantidade de alunos neste segmento
  parcelas: number
}

interface Resultado {
  custo: number
  comissao_valor: number
  liquido_desejado: number
  manutencao_por_aluno: number   // manutenção dividida pelos alunos deste segmento
  taxa_fixa_eskolare: number
  taxa_cartao_pct: number
  preco_final: number
  valor_parcela: number
  liquido_real: number
  diferenca: number
  parcela_valida: boolean
  qtd_alunos: number
}

/* ═══════════════════════════════════════════════════════════════════
   CÁLCULO CORRIGIDO
   - Manutenção: R$210 FIXO dividido pelo total de alunos de TODOS os segmentos
   - Cada aluno "absorve" sua fração da manutenção da loja
   ═══════════════════════════════════════════════════════════════════ */
function calcular(
  custo: number,
  comissaoTipo: 'pct' | 'abs',
  comissaoPct: number,
  comissaoAbs: number,
  parcelas: number,
  qtdAlunos: number,
  totalAlunos: number,   // soma de todos os alunos ativos
): Resultado {
  const taxa_cartao = parcelas === 1 ? 0.0289 : parcelas <= 6 ? 0.0299 : 0.0369

  // Comissão: percentual OU valor absoluto
  const comissao_valor = comissaoTipo === 'pct'
    ? custo * (comissaoPct / 100)
    : comissaoAbs

  const liquido_desejado = custo + comissao_valor

  // Manutenção: R$210 fixos divididos proporcionalmente pelos alunos totais
  // Cada segmento absorve (qtdAlunos / totalAlunos) × R$210
  const proporcao_alunos    = totalAlunos > 0 ? qtdAlunos / totalAlunos : 0
  const manutencao_segmento = MANUTENCAO_TOTAL * proporcao_alunos
  // Por aluno deste segmento:
  const manutencao_por_aluno = qtdAlunos > 0 ? manutencao_segmento / qtdAlunos : 0

  const taxa_fixa_eskolare = TAXA_FIXA_PARCELA * parcelas
  const denominador        = 1 - TAXA_PLATAFORMA - taxa_cartao

  // Preço final por livro = (líquido + taxa fixa + manutenção por aluno) / denominador
  const preco_final = Math.ceil(
    ((liquido_desejado + taxa_fixa_eskolare + manutencao_por_aluno) / denominador) * 100
  ) / 100
  const valor_parcela = Math.round((preco_final / parcelas) * 100) / 100
  const liquido_real  = preco_final * denominador - taxa_fixa_eskolare - manutencao_por_aluno

  return {
    custo, comissao_valor, liquido_desejado,
    manutencao_por_aluno,
    taxa_fixa_eskolare, taxa_cartao_pct: taxa_cartao * 100,
    preco_final, valor_parcela, liquido_real,
    diferenca: liquido_real - liquido_desejado,
    parcela_valida: valor_parcela >= VALOR_MIN_PARCELA,
    qtd_alunos: qtdAlunos,
  }
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const fmt    = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtPct = (v: number) => v.toFixed(2) + '%'

const inpStyle: React.CSSProperties = {
  width: '100%', padding: '.6rem .85rem', fontSize: '.875rem',
  fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
}
const lblStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.06em', color: '#64748b', marginBottom: '.35rem',
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════════════ */
export default function CalculadoraPage() {
  const [segmentos, setSegmentos] = useState<SegmentoCalc[]>(
    SEGMENTOS.map((s, i) => ({
      ...s,
      ativo: i < 2,
      igualPrimeiro: i > 0,
      custo: 600,
      comissaoTipo: 'pct' as const,
      comissaoPct: 20,
      comissaoAbs: 0,
      qtdAlunos: 30,
      parcelas: 12,
    }))
  )
  const [calculados, setCalculados] = useState<Record<string, Resultado>>({})
  const [calculou,   setCalculou]   = useState(false)

  const primeiroAtivo = segmentos.find(s => s.ativo)

  const update = (id: string, field: keyof SegmentoCalc, value: any) => {
    setSegmentos(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    setCalculou(false)
  }

  // Total de alunos em todos os segmentos ATIVOS (para rateio da manutenção)
  const totalAlunos = segmentos.filter(s => s.ativo).reduce((acc, s) => {
    if (s.igualPrimeiro && primeiroAtivo && s.id !== primeiroAtivo.id) {
      return acc + primeiroAtivo.qtdAlunos
    }
    return acc + s.qtdAlunos
  }, 0)

  const handleCalcular = () => {
    const res: Record<string, Resultado> = {}
    segmentos.filter(s => s.ativo).forEach(s => {
      const ref = (s.igualPrimeiro && primeiroAtivo && s.id !== primeiroAtivo.id) ? primeiroAtivo : s
      res[s.id] = calcular(
        ref.custo, ref.comissaoTipo, ref.comissaoPct, ref.comissaoAbs,
        ref.parcelas, ref.qtdAlunos,
        totalAlunos,
      )
    })
    setCalculados(res)
    setCalculou(true)
  }

  const ativos = segmentos.filter(s => s.ativo)

  return (
    <div>
      <PageHeader title="Calculadora Eskolare" subtitle="Precificação por segmento e turma" />
      <div style={{ padding: '1.75rem 2.5rem' }}>

        {/* ── Explicação ──────────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 16, padding: '1.25rem 1.75rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.35rem' }}>
              ✦ Lógica de cálculo
            </div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.5rem' }}>
              Preço final = custo + comissão + taxas Eskolare + manutenção rateada
            </div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)' }}>
              A manutenção da loja online (<strong style={{ color: '#4A7FDB' }}>R$ {MANUTENCAO_TOTAL}</strong> fixo · {MESES_LOJA} meses) é dividida proporcionalmente
              pela quantidade total de alunos de todos os segmentos ativos. Cada aluno absorve sua fração.
              Quanto mais alunos, menor o custo individual de manutenção.
            </div>
          </div>
          <div style={{ background: 'rgba(74,127,219,.12)', border: '1px solid rgba(74,127,219,.25)', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 220, flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#4A7FDB', marginBottom: '.6rem' }}>
              Manutenção da loja
            </div>
            {[
              [`R$ ${MANUTENCAO_MENSAL}/mês`, `${MESES_LOJA} meses`],
              ['Total fixo', fmt(MANUTENCAO_TOTAL)],
              ['Dividido por', `${totalAlunos > 0 ? totalAlunos : '?'} alunos`],
              ['Por aluno', totalAlunos > 0 ? fmt(MANUTENCAO_TOTAL / totalAlunos) : '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '.25rem 0', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: '.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)' }}>{l}</span>
                <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 1. Selecionar segmentos ──────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem 1.75rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a', marginBottom: '1rem' }}>
            1. Selecione os segmentos ativos da escola
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {segmentos.map(s => (
              <button key={s.id} onClick={() => update(s.id, 'ativo', !s.ativo)}
                style={{
                  padding: '6px 16px', borderRadius: 9999, cursor: 'pointer',
                  fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
                  background: s.ativo ? '#0f172a' : '#f1f5f9',
                  color: s.ativo ? '#fff' : '#64748b',
                  border: `1.5px solid ${s.ativo ? '#0f172a' : '#e2e8f0'}`,
                  transition: 'all .15s',
                }}>
                {s.ativo ? '✓ ' : ''}{s.label}
              </button>
            ))}
          </div>
          {totalAlunos > 0 && (
            <div style={{ marginTop: '.85rem', fontSize: '.75rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
              Total de alunos nos segmentos ativos: <strong style={{ color: '#0f172a' }}>{totalAlunos}</strong>
              {' · '}Manutenção por aluno: <strong style={{ color: '#4A7FDB' }}>{fmt(MANUTENCAO_TOTAL / totalAlunos)}</strong>
            </div>
          )}
        </div>

        {/* ── 2. Parâmetros por segmento ───────────────────────── */}
        {ativos.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a', marginBottom: '1rem' }}>
              2. Configure os parâmetros por segmento
            </div>

            {ativos.map((s, idx) => {
              const isPrimeiro = idx === 0
              const herdando   = !isPrimeiro && s.igualPrimeiro
              const ref        = herdando && primeiroAtivo ? primeiroAtivo : s

              return (
                <div key={s.id} style={{
                  background: '#fff', border: `1.5px solid ${herdando ? '#e2e8f0' : '#4A7FDB'}`,
                  borderRadius: 14, marginBottom: '1rem', overflow: 'hidden',
                  boxShadow: herdando ? '0 1px 4px rgba(15,23,42,.04)' : '0 4px 16px rgba(74,127,219,.12)',
                  opacity: herdando ? .75 : 1,
                }}>
                  {/* Header */}
                  <div style={{ background: herdando ? '#fafafa' : '#0f172a', padding: '.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: herdando ? '#e2e8f0' : '#4A7FDB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.82rem', fontWeight: 800, color: herdando ? '#475569' : '#fff' }}>{s.label}</span>
                      {herdando && <span style={{ fontSize: '.65rem', background: '#dbeafe', color: '#1d4ed8', padding: '.15rem .5rem', borderRadius: 99, fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        Mesmo valor do {primeiroAtivo?.label}
                      </span>}
                    </div>
                    {!isPrimeiro && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                        <span style={{ fontSize: '.72rem', color: herdando ? '#475569' : 'rgba(255,255,255,.6)', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Mesmo valor</span>
                        <div onClick={() => update(s.id, 'igualPrimeiro', !s.igualPrimeiro)}
                          style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: s.igualPrimeiro ? '#4A7FDB' : '#cbd5e1', position: 'relative', transition: 'background .2s' }}>
                          <div style={{ position: 'absolute', top: 2, left: s.igualPrimeiro ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Campos */}
                  {!herdando && (
                    <div style={{ padding: '1.1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                      {/* Custo */}
                      <div>
                        <label style={lblStyle}>Custo do Livro (R$)</label>
                        <input type="number" min="0" step="0.01" value={s.custo}
                          onChange={e => update(s.id, 'custo', parseFloat(e.target.value) || 0)}
                          style={inpStyle} placeholder="Ex: 600,00" />
                        <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Valor pago pela escola</div>
                      </div>

                      {/* Comissão com toggle % / R$ */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                          <label style={{ ...lblStyle, marginBottom: 0 }}>Comissão</label>
                          {/* Toggle % / R$ */}
                          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 7, padding: 2, gap: 1 }}>
                            {[
                              { v: 'pct', l: '%' },
                              { v: 'abs', l: 'R$' },
                            ].map(t => (
                              <button key={t.v} type="button"
                                onClick={() => update(s.id, 'comissaoTipo', t.v as 'pct' | 'abs')}
                                style={{
                                  padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                                  fontSize: '.68rem', fontWeight: 800, transition: 'all .15s',
                                  fontFamily: 'var(--font-montserrat,sans-serif)',
                                  background: s.comissaoTipo === t.v ? '#4A7FDB' : 'transparent',
                                  color: s.comissaoTipo === t.v ? '#fff' : '#64748b',
                                }}>
                                {t.l}
                              </button>
                            ))}
                          </div>
                        </div>
                        {s.comissaoTipo === 'pct' ? (
                          <div style={{ position: 'relative' }}>
                            <input type="number" min="0" max="100" step="0.1" value={s.comissaoPct}
                              onChange={e => update(s.id, 'comissaoPct', parseFloat(e.target.value) || 0)}
                              style={{ ...inpStyle, paddingRight: '2.5rem' }} />
                            <span style={{ position: 'absolute', right: '.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.85rem', color: '#94a3b8', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', pointerEvents: 'none' }}>%</span>
                          </div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.78rem', color: '#94a3b8', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', pointerEvents: 'none' }}>R$</span>
                            <input type="number" min="0" step="0.01" value={s.comissaoAbs}
                              onChange={e => update(s.id, 'comissaoAbs', parseFloat(e.target.value) || 0)}
                              style={{ ...inpStyle, paddingLeft: '2.25rem' }} />
                          </div>
                        )}
                        <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                          {s.comissaoTipo === 'pct' ? 'Margem sobre o custo' : 'Valor fixo por livro'}
                        </div>
                      </div>

                      {/* Qtd alunos */}
                      <div>
                        <label style={lblStyle}>Qtd. Alunos</label>
                        <input type="number" min="1" value={s.qtdAlunos}
                          onChange={e => update(s.id, 'qtdAlunos', parseInt(e.target.value) || 1)}
                          style={{ ...inpStyle, textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700 }} />
                        <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                          Manutenção: {totalAlunos > 0 ? fmt(MANUTENCAO_TOTAL / totalAlunos) : '—'}/aluno
                        </div>
                      </div>

                      {/* Parcelas */}
                      <div>
                        <label style={lblStyle}>Parcelas</label>
                        <select value={s.parcelas} onChange={e => update(s.id, 'parcelas', parseInt(e.target.value))} style={inpStyle}>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Preview da comissão quando herda */}
                  {herdando && primeiroAtivo && (
                    <div style={{ padding: '.6rem 1.25rem', display: 'flex', gap: '1.5rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      <span>Custo: <strong style={{ color: '#0f172a' }}>{fmt(primeiroAtivo.custo)}</strong></span>
                      <span>Comissão: <strong style={{ color: '#0f172a' }}>
                        {primeiroAtivo.comissaoTipo === 'pct' ? `${primeiroAtivo.comissaoPct}%` : fmt(primeiroAtivo.comissaoAbs)}
                      </strong></span>
                      <span>Alunos: <strong style={{ color: '#0f172a' }}>{primeiroAtivo.qtdAlunos}</strong></span>
                      <span>Parcelas: <strong style={{ color: '#0f172a' }}>{primeiroAtivo.parcelas === 1 ? 'À vista' : `${primeiroAtivo.parcelas}x`}</strong></span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Botão calcular ───────────────────────────────────── */}
        {ativos.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <button onClick={handleCalcular} style={{
              width: '100%', maxWidth: 400, padding: '.9rem 2rem',
              background: 'linear-gradient(135deg, #4A7FDB, #2563b8)',
              color: '#fff', fontWeight: 800, fontSize: '1rem',
              border: 'none', borderRadius: 9999, cursor: 'pointer',
              fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: '0 6px 20px rgba(74,127,219,.4)', letterSpacing: '.02em', display: 'block',
            }}>
              Calcular Preços por Segmento →
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            RESULTADOS
            ═══════════════════════════════════════════════════════ */}
        {calculou && Object.keys(calculados).length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a', marginBottom: '1.25rem' }}>
              3. Resultados por segmento
            </div>

            {/* Cartões */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1.1rem', marginBottom: '2rem' }}>
              {ativos.map(s => {
                const r = calculados[s.id]
                if (!r) return null
                const ref = s.igualPrimeiro && primeiroAtivo ? primeiroAtivo : s
                return (
                  <div key={s.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: '4px solid #4A7FDB', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,23,42,.08)' }}>
                    <div style={{ background: '#0f172a', padding: '1rem 1.25rem' }}>
                      <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.2rem' }}>Segmento</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{s.label}</div>
                      <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', marginTop: '.15rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {r.qtd_alunos} aluno{r.qtd_alunos !== 1 ? 's' : ''} · manutenção: {fmt(r.manutencao_por_aluno)}/aluno
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
                      {[
                        { label: 'Custo de Aquisição', value: fmt(r.custo), sub: 'escola paga', bg: '#f8fafc' },
                        { label: 'Comissão', value: fmt(r.comissao_valor), sub: ref.comissaoTipo === 'pct' ? `${ref.comissaoPct}% sobre custo` : 'valor fixo', bg: '#f5f3ff' },
                        { label: 'Manutenção Rateada', value: fmt(r.manutencao_por_aluno), sub: 'por aluno neste segmento', bg: '#eff6ff' },
                        { label: 'Valor Final ao Pai', value: fmt(r.preco_final), sub: ref.parcelas === 1 ? 'à vista' : `${ref.parcelas}x de ${fmt(r.valor_parcela)}`, bg: '#fffbeb', big: true },
                      ].map(m => (
                        <div key={m.label} style={{ background: m.bg, padding: '.85rem 1rem', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>{m.label}</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: (m as any).big ? '1.3rem' : '1.1rem', fontWeight: 800, color: (m as any).big ? '#4A7FDB' : '#0f172a', lineHeight: 1 }}>{m.value}</div>
                          <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{m.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: '.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.15rem' }}>Líquido Real</div>
                        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>{fmt(r.liquido_real)}</div>
                      </div>
                      {r.parcela_valida
                        ? <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '.25rem .75rem', borderRadius: 99, fontSize: '.65rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>✓ Válido</span>
                        : <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '.25rem .75rem', borderRadius: 99, fontSize: '.65rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>⚠ Parcela abaixo de R$30</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tabela comparativa */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)', marginBottom: '1.5rem' }}>
              <div style={{ background: '#0f172a', padding: '1rem 1.5rem' }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB' }}>
                  Resumo comparativo por segmento
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Segmento','Alunos','Custo Livro','Comissão','Taxas Eskolare','Manut./Aluno','Preço Final','Parcela','Líquido Real','Status'].map(col => (
                        <th key={col} style={{ padding: '.65rem 1rem', textAlign: 'left', fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ativos.map((s, idx) => {
                      const r = calculados[s.id]
                      if (!r) return null
                      const ref = s.igualPrimeiro && primeiroAtivo ? primeiroAtivo : s
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '.75rem 1rem', fontWeight: 700, fontSize: '.82rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                            {s.label}
                            {s.igualPrimeiro && s.id !== primeiroAtivo?.id && <span style={{ marginLeft: '.4rem', fontSize: '.58rem', background: '#dbeafe', color: '#1d4ed8', padding: '.08rem .35rem', borderRadius: 99, fontWeight: 700 }}>=1º</span>}
                          </td>
                          <td style={{ padding: '.75rem 1rem', textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem', fontWeight: 700, color: '#0f172a' }}>{r.qtd_alunos}</td>
                          <td style={{ padding: '.75rem 1rem', fontSize: '.82rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{fmt(r.custo)}</td>
                          <td style={{ padding: '.75rem 1rem', fontWeight: 700, color: '#7c3aed', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem' }}>
                            {fmt(r.comissao_valor)}
                            <span style={{ display: 'block', fontSize: '.62rem', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>
                              {ref.comissaoTipo === 'pct' ? `${ref.comissaoPct}%` : 'valor fixo'}
                            </span>
                          </td>
                          <td style={{ padding: '.75rem 1rem', fontSize: '.82rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>{fmt(r.taxa_fixa_eskolare)}</td>
                          <td style={{ padding: '.75rem 1rem', fontSize: '.82rem', color: '#0ea5e9', fontFamily: 'var(--font-inter,sans-serif)' }}>{fmt(r.manutencao_por_aluno)}</td>
                          <td style={{ padding: '.75rem 1rem', fontWeight: 800, color: '#4A7FDB', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem' }}>{fmt(r.preco_final)}</td>
                          <td style={{ padding: '.75rem 1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem', whiteSpace: 'nowrap' }}>
                            {ref.parcelas === 1 ? 'À vista' : `${ref.parcelas}x ${fmt(r.valor_parcela)}`}
                          </td>
                          <td style={{ padding: '.75rem 1rem', fontWeight: 700, color: '#16a34a', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem' }}>{fmt(r.liquido_real)}</td>
                          <td style={{ padding: '.75rem 1rem' }}>
                            {r.parcela_valida
                              ? <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '.15rem .55rem', borderRadius: 99, fontSize: '.62rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>✓</span>
                              : <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '.15rem .55rem', borderRadius: 99, fontSize: '.62rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>⚠</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                    {/* Linha de totais */}
                    <tr style={{ background: '#0f172a' }}>
                      <td style={{ padding: '.75rem 1rem', fontWeight: 700, fontSize: '.78rem', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>TOTAL</td>
                      <td style={{ padding: '.75rem 1rem', textAlign: 'center', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem' }}>{totalAlunos}</td>
                      <td colSpan={4} style={{ padding: '.75rem 1rem', fontSize: '.72rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        Manutenção total: {fmt(MANUTENCAO_TOTAL)} / {totalAlunos} alunos = {fmt(MANUTENCAO_TOTAL / totalAlunos)}/aluno
                      </td>
                      <td colSpan={4} style={{ padding: '.75rem 1rem', fontSize: '.72rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        Loja ativa: {MESES_LOJA} meses × R$ {MANUTENCAO_MENSAL}/mês = R$ {MANUTENCAO_TOTAL} fixo
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de taxas */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.1rem 1.5rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#4A7FDB', marginBottom: '.75rem' }}>
                Taxas Eskolare aplicadas
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                {[
                  ['Taxa da plataforma', '1,5%'],
                  ['Taxa cartão 1x', '2,89%'],
                  ['Taxa cartão 2x–6x', '2,99%'],
                  ['Taxa cartão 7x–12x', '3,69%'],
                  ['Taxa fixa por parcela', 'R$ 0,30'],
                  ['Mínimo por parcela', 'R$ 30,00'],
                  [`Manutenção/mês`, `R$ ${MANUTENCAO_MENSAL},00`],
                  [`Meses de loja ativa`, `${MESES_LOJA} meses`],
                  [`Total manutenção (fixo)`, `R$ ${MANUTENCAO_TOTAL},00`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '.35rem 0', borderBottom: '1px solid #f8fafc', fontSize: '.78rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    <span style={{ color: '#64748b' }}>{l}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {ativos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto .75rem' }}>
              <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
            </svg>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', color: '#0f172a', marginBottom: '.4rem' }}>Selecione pelo menos um segmento</h3>
            <p style={{ fontSize: '.85rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Clique nos botões acima para ativar os segmentos da escola.</p>
          </div>
        )}

      </div>
    </div>
  )
}
