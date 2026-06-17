'use client'

import { useState, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'

// ── Formatação ────────────────────────────────────────────────────
const R$ = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (v: number) => (v * 100).toFixed(1) + '%'
const dec = (v: number) => v.toFixed(3)
const dec3 = (v: number) => v.toFixed(3)

// ══════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════
interface FaixaCurriculo {
  nome: string; min: number; max: number; manutencao: number
}
interface SisParams {
  livroAno: number       // R$200/aluno/ano — custo do livro (fixo)
  faixas: FaixaCurriculo[]
}
interface LeasingParams {
  retornoAlvo: number    // 1.0 = 100% return on PV
  ipca: number           // 0.055 = 5.5% annual IPCA
  duracaoMeses: number   // 60 = 5 anos
  txMan: number          // 0.25 = 25% maintenance rate
  txAdmin: number        // 0.25 = 25% admin rate
}
interface EquipItem { nome: string; qty: number; unit: number; fixedQty: boolean; nota?: string }

// ── Valores padrão ────────────────────────────────────────────────
const DEFAULT_SIS: SisParams = {
  livroAno: 200,
  faixas: [
    { nome: 'Faixa 1', min: 1,   max: 100, manutencao: 180 },
    { nome: 'Faixa 2', min: 101, max: 300, manutencao: 120 },
    { nome: 'Faixa 3', min: 301, max: 500, manutencao: 80  },
    { nome: 'Faixa 4', min: 501, max: 800, manutencao: 60  },
  ],
}

const DEFAULT_LEASING: LeasingParams = {
  retornoAlvo: 1.0,
  ipca: 0.055,
  duracaoMeses: 60,
  txMan: 0.25,
  txAdmin: 0.25,
}

const DEFAULT_EQUIP: EquipItem[] = [
  { nome: 'Máquina digital',       qty: 1,  unit: 4280.00,  fixedQty: false },
  { nome: 'Máquina manual',        qty: 1,  unit: 237.40,   fixedQty: false },
  { nome: 'Ferramenta',            qty: 1,  unit: 1061.53,  fixedQty: false },
  { nome: 'Papelaria',             qty: 1,  unit: 430.76,   fixedQty: false },
  { nome: 'Organização',           qty: 1,  unit: 157.98,   fixedQty: false },
  { nome: 'Eletrônica',            qty: 1,  unit: 1983.82,  fixedQty: false },
  { nome: 'Informática (notebooks)', qty: 10, unit: 4000.00, fixedQty: true, nota: 'Qtd calculada: ⌈maior sala ÷ 2⌉' },
  { nome: 'Mídias',                qty: 1,  unit: 3800.00,  fixedQty: false },
  { nome: 'Segurança',             qty: 1,  unit: 119.70,   fixedQty: false },
  { nome: 'Seguro',                qty: 10, unit: 2700.00,  fixedQty: true, nota: 'Qtd igual ao nº de notebooks' },
]

// ══════════════════════════════════════════════════════════════════
// FUNÇÕES DE CÁLCULO (puras — recebem tudo como parâmetro)
// ══════════════════════════════════════════════════════════════════
function calcSistema(alunos: number, desconto: number, p: SisParams) {
  // Find the faixa for this student count
  const faixa = p.faixas.find(f => alunos >= f.min && alunos <= f.max)
    ?? (alunos < p.faixas[0].min ? p.faixas[0] : p.faixas[p.faixas.length - 1])

  const livroAno = p.livroAno
  const manutencao = faixa.manutencao
  const valorBruto = livroAno + manutencao          // preço/aluno/ano antes do desconto
  const valorDesc  = valorBruto * (1 - desconto / 100)
  const valorFinal = Math.max(livroAno, valorDesc)  // piso = custo do livro
  const anual      = valorFinal * alunos

  const gov = desconto === 0 ? { label: '— Sem desconto', status: 'ok' as const }
    : desconto <= 5  ? { label: 'Comercial (autônomo)', status: 'ok' as const }
    : desconto <= 10 ? { label: 'Gerência — Renato', status: 'warn' as const }
    : { label: 'Diretoria — Dênis', status: 'error' as const }

  return {
    faixa, livroAno, manutencao, valorBruto, valorDesc, valorFinal, anual,
    custoLivros: livroAno * alunos,
    margemManutencao: (valorFinal - livroAno) * alunos,
    gov,
    descMax: valorBruto > livroAno ? (1 - livroAno / valorBruto) * 100 : 0,
  }
}

function calcLeasing(
  alunos: number, maiorSala: number,
  equip: EquipItem[], lp: LeasingParams,
  anualCurriculo: number
) {
  const qtdNB  = Math.ceil(maiorSala / 2)
  const N      = lp.duracaoMeses          // total duration = amortization period
  const anos   = N / 12

  // Equipment
  const itens    = equip.map(e => ({ ...e, qtyReal: e.fixedQty ? qtdNB : e.qty, total: (e.fixedQty ? qtdNB : e.qty) * e.unit }))
  const sumEquip = itens.reduce((s, e) => s + e.total, 0)
  const sumUnit  = equip.reduce((s, e) => s + e.unit, 0)

  // Maintenance & admin (on unit prices, over contract duration)
  const C_man = lp.txMan   * sumUnit * anos
  const C_adm = lp.txAdmin * sumUnit * anos
  const PV    = sumEquip + C_man + C_adm

  // Simple return formula: PMT = PV × (1 + retornoAlvo) / N
  const totalRecebido  = PV * (1 + lp.retornoAlvo)
  const parcelaPrice   = totalRecebido / N
  const resultadoBruto = totalRecebido - PV
  const retorno        = lp.retornoAlvo

  // Annual projection table with IPCA on curriculum, fixed leasing
  const anosContrato     = Math.ceil(N / 12)
  const mensalCurriculo1 = anualCurriculo / 12
  const tabela = Array.from({ length: anosContrato }, (_, y) => {
    const fatorIpca   = Math.pow(1 + lp.ipca, y)
    const parcelaCurr = mensalCurriculo1 * fatorIpca
    const totalEscola = parcelaCurr + parcelaPrice
    return {
      ano: y + 1, fatorIpca, parcelaCurr,
      parcelaComodato: parcelaPrice, totalEscola,
      recCurr: parcelaCurr * 12, recCom: parcelaPrice * 12,
      recTotal: (parcelaCurr + parcelaPrice) * 12,
    }
  })

  return {
    qtdNB, N, anos, PV, sumEquip, sumUnit, C_man, C_adm,
    itens,
    parcelaPrice, totalRecebido, resultadoBruto, retorno, tabela,
    parcelaMensal:   parcelaPrice,
    valorPorAlunoMes: parcelaPrice / (alunos || 1),
  }
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS COMUNS
// ══════════════════════════════════════════════════════════════════
const INP: React.CSSProperties = {
  width: '100%', padding: '.65rem .9rem', fontSize: '.875rem',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#fffef0', color: '#0f172a', outline: 'none',
  fontFamily: 'var(--font-inter,sans-serif)', boxSizing: 'border-box',
}
const INP_SM: React.CSSProperties = {
  ...INP, padding: '.35rem .55rem', fontSize: '.8rem', borderRadius: 6,
}
const LBL: React.CSSProperties = {
  display: 'block', fontSize: '.65rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b',
  marginBottom: '.3rem', fontFamily: 'var(--font-montserrat,sans-serif)',
}
const NOTA: React.CSSProperties = {
  fontSize: '.7rem', color: '#475569', lineHeight: 1.55,
  fontFamily: 'var(--font-inter,sans-serif)', background: '#f8fafc',
  border: '1px solid #e2e8f0', borderLeft: '3px solid #4A7FDB',
  borderRadius: '0 6px 6px 0', padding: '.45rem .7rem', marginTop: '.4rem',
}

// ── Mini-componentes ──────────────────────────────────────────────
function Nota({ t }: { t: string }) { return <div style={NOTA}>{t}</div> }

function SecTitle({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 800, color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>{n}</div>
      <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0f172a' }}>{title}</div>
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)', ...style }}>{children}</div>
}

function KV({ label, value, sub, color = '#0f172a', big }: { label: string; value: string; sub?: string; color?: string; big?: boolean }) {
  return (
    <div style={{ padding: '.85rem 1rem' }}>
      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: big ? '1.4rem' : '1.05rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.65rem', color: '#94a3b8', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{sub}</div>}
    </div>
  )
}

// Input numérico inline para tabelas
function InlineNum({ value, onChange, prefix, suffix, min = 0, step = 1, style }: {
  value: number; onChange: (v: number) => void
  prefix?: string; suffix?: string; min?: number; step?: number; style?: React.CSSProperties
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '100%' }}>
      {prefix && <span style={{ position: 'absolute', left: '.55rem', fontSize: '.72rem', color: '#94a3b8', fontWeight: 700, pointerEvents: 'none', zIndex: 1 }}>{prefix}</span>}
      <input
        type="number" min={min} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ ...INP_SM, paddingLeft: prefix ? '1.5rem' : INP_SM.padding as string, paddingRight: suffix ? '1.5rem' : INP_SM.padding as string, ...style }}
      />
      {suffix && <span style={{ position: 'absolute', right: '.55rem', fontSize: '.72rem', color: '#94a3b8', fontWeight: 700, pointerEvents: 'none' }}>{suffix}</span>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function CalculadoraPage() {
  const [tab, setTab] = useState<'sistema' | 'comodato'>('sistema')
  const [incluiComodato, setIncluiComodato] = useState(false)

  // ── Parâmetros do Sistema (todos editáveis) ──────────────────────
  const [sp, setSp] = useState<SisParams>(DEFAULT_SIS)

  const updFaixa = (idx: number, field: keyof FaixaCurriculo, val: any) =>
    setSp(p => { const f = [...p.faixas]; f[idx] = { ...f[idx], [field]: val }; return { ...p, faixas: f } })

  // ── Parâmetros compartilhados sistema+comodato ─────────────────
  const [alunos,    setAlunos]    = useState(100)
  const [desconto,  setDesconto]  = useState(0)
  const [parcelas,  setParcelas]  = useState(4)
  const [maiorSala, setMaiorSala] = useState(20)

  // ── Parâmetros de Leasing ──────────────────────────────────────
  const [lp, setLp] = useState<LeasingParams>(DEFAULT_LEASING)

  // ── Equipamentos do Comodato (todos editáveis) ─────────────────
  const [equip, setEquip] = useState<EquipItem[]>(DEFAULT_EQUIP)

  const updEquip = (idx: number, field: keyof EquipItem, val: any) =>
    setEquip(p => { const e = [...p]; e[idx] = { ...e[idx], [field]: val }; return e })

  // ── Cálculos ──────────────────────────────────────────────────
  const sis = useMemo(
    () => calcSistema(alunos, desconto, sp),
    [alunos, desconto, sp]
  )
  const com = useMemo(
    () => calcLeasing(alunos, maiorSala, equip, lp, sis.anual),
    [alunos, maiorSala, equip, lp, sis.anual]
  )

  const parcelasCurriculo = incluiComodato ? 12 : parcelas
  const alunoMesSis       = sis.valorFinal / 12
  const totalAluMes       = alunoMesSis + com.valorPorAlunoMes
  const mensalidadeEscola = sis.anual / 12 + com.parcelaPrice
  const parcelaCurriculo  = sis.anual / parcelasCurriculo

  // ── Helpers visuais ───────────────────────────────────────────
  const govClr    = (s: string) => s === 'error' ? '#dc2626' : s === 'warn' ? '#d97706' : '#16a34a'
  const govBg     = (s: string) => s === 'error' ? '#fef2f2' : s === 'warn' ? '#fefce8' : '#f0fdf4'
  const govBorder = (s: string) => s === 'error' ? '#fca5a5' : s === 'warn' ? '#fde68a' : '#86efac'

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: '.55rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 700,
    background: tab === t ? '#0f172a' : '#f1f5f9',
    color: tab === t ? '#fff' : '#64748b', transition: 'all .15s',
  })

  const th: React.CSSProperties = {
    padding: '.6rem .85rem', textAlign: 'left', fontSize: '.6rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b',
    borderBottom: '1px solid #e2e8f0', fontFamily: 'var(--font-montserrat,sans-serif)',
    background: '#f8fafc',
  }

  return (
    <div>
      <PageHeader title="Calculadora We Make" subtitle="Precificação por faixas de volume + leasing de retorno garantido — v7" />
      <div style={{ padding: '1.75rem 2.5rem' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <button style={tabStyle('sistema')}  onClick={() => setTab('sistema')}>We Make — Sistema</button>
          <button style={tabStyle('comodato')} onClick={() => setTab('comodato')}>Leasing de Equipamentos</button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB: SISTEMA
            ══════════════════════════════════════════════════════ */}
        {tab === 'sistema' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Header banner */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1.1rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4A7FDB', marginBottom: '.3rem' }}>
                Precificação por faixas de volume + leasing de retorno garantido — v7
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.4rem' }}>
                Preço = Livro (R${sp.livroAno}/aluno/ano) + Manutenção por faixa de volume
              </div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
                Mais alunos = menor manutenção = preço total menor por aluno (desconto por volume). Piso = custo do livro. Todos os parâmetros são editáveis abaixo.
              </div>
            </div>

            {/* 1. Entradas principais */}
            <Card>
              <SecTitle n={1} title="Entradas principais" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                <div>
                  <label style={LBL}>Número de alunos</label>
                  <input type="number" min={1} value={alunos} onChange={e => setAlunos(+e.target.value || 1)} style={INP} />
                  <div style={NOTA}>Total de alunos We Make na escola. Determina qual faixa de manutenção é aplicada.</div>
                </div>
                <div>
                  <label style={LBL}>Desconto comercial (%)</label>
                  <input
                    type="number" min={0} max={30} step={0.5} value={desconto}
                    onChange={e => setDesconto(+e.target.value || 0)}
                    style={{ ...INP, borderColor: desconto > 10 ? '#fca5a5' : desconto > 5 ? '#fde68a' : '#e2e8f0' }}
                  />
                  <div style={NOTA}>≤5% autônomo · 6–10% Renato · &gt;10% Dênis. Piso = custo do livro ({R$(sp.livroAno)}).</div>
                </div>
                <div>
                  <label style={LBL}>Qtd. parcelas (4–12)</label>
                  <input type="number" min={4} max={12} value={parcelas} onChange={e => setParcelas(Math.min(12, Math.max(4, +e.target.value || 4)))} style={INP} />
                  <div style={NOTA}>Frequência de pagamento do currículo. Independente do prazo do leasing.</div>
                </div>
              </div>
            </Card>

            {/* 2. Tabela de faixas */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <SecTitle n={2} title="Tabela de faixas de volume (editável)" />
                <button
                  onClick={() => setSp(DEFAULT_SIS)}
                  style={{ padding: '.4rem .9rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#475569' }}
                >
                  Restaurar padrão
                </button>
              </div>

              <div style={{ overflowX: 'auto', marginBottom: '.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Faixa', 'Alunos (mín)', 'Alunos (máx)', 'Manutenção (R$/al./ano)', 'Livro (R$/al./ano)', 'Total (R$/al./ano)', 'Ativa?'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sp.faixas.map((f, idx) => {
                      const isAtiva = sis.faixa.nome === f.nome
                      const total = sp.livroAno + f.manutencao
                      return (
                        <tr
                          key={idx}
                          style={{
                            background: isAtiva ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#fafafa',
                            borderBottom: '1px solid #f1f5f9',
                            outline: isAtiva ? '2px solid #4A7FDB' : 'none',
                            outlineOffset: -1,
                          }}
                        >
                          <td style={{ padding: '.5rem .65rem', minWidth: 90 }}>
                            <input
                              type="text" value={f.nome}
                              onChange={e => updFaixa(idx, 'nome', e.target.value)}
                              style={{ ...INP_SM, background: '#fff', minWidth: 80 }}
                            />
                          </td>
                          <td style={{ padding: '.5rem .65rem', minWidth: 90 }}>
                            <InlineNum value={f.min} onChange={v => updFaixa(idx, 'min', Math.round(v))} min={1} step={1} />
                          </td>
                          <td style={{ padding: '.5rem .65rem', minWidth: 90 }}>
                            <InlineNum value={f.max} onChange={v => updFaixa(idx, 'max', Math.round(v))} min={1} step={1} />
                          </td>
                          <td style={{ padding: '.5rem .65rem', minWidth: 140 }}>
                            <InlineNum value={f.manutencao} onChange={v => updFaixa(idx, 'manutencao', v)} prefix="R$" min={0} step={5} />
                          </td>
                          <td style={{ padding: '.5rem .65rem', minWidth: 120 }}>
                            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#64748b', padding: '.35rem .55rem' }}>
                              {R$(sp.livroAno)}
                            </div>
                          </td>
                          <td style={{ padding: '.5rem .65rem', minWidth: 120 }}>
                            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: isAtiva ? '#2563eb' : '#0f172a', padding: '.35rem .55rem' }}>
                              {R$(total)}
                            </div>
                          </td>
                          <td style={{ padding: '.5rem .85rem' }}>
                            {isAtiva && (
                              <span style={{ display: 'inline-block', padding: '.2rem .6rem', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8', fontSize: '.65rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                                Ativa
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Nota t={`Faixa ativa: ${sis.faixa.nome} (${sis.faixa.min}–${sis.faixa.max} alunos) — Manutenção ${R$(sis.manutencao)}/aluno/ano → Total bruto ${R$(sis.valorBruto)}/aluno/ano.`} />

              <div style={{ marginTop: '.85rem' }}>
                <label style={LBL}>Livro / aluno / ano (R$) — custo fixo do material didático</label>
                <div style={{ maxWidth: 220 }}>
                  <InlineNum value={sp.livroAno} onChange={v => setSp(p => ({ ...p, livroAno: v }))} prefix="R$" min={0} step={5} />
                </div>
                <div style={NOTA}>Custo base do livro — funciona como piso mínimo de preço. Nenhum desconto pode levar o valor abaixo de {R$(sp.livroAno)}/aluno/ano.</div>
              </div>
            </Card>

            {/* 3. Memória de cálculo */}
            <Card>
              <SecTitle n={3} title="Memória de cálculo — equação central" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>

                {/* Componentes do preço */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <KV label="Livro (R$/aluno/ano)" value={R$(sis.livroAno)} sub={`Custo fixo — piso mínimo`} />
                  <KV label={`Manutenção ${sis.faixa.nome}`} value={R$(sis.manutencao)} sub={`Faixa ${sis.faixa.min}–${sis.faixa.max} alunos`} />
                  <KV label="Valor bruto" value={R$(sis.valorBruto)} sub={`${R$(sis.livroAno)} + ${R$(sis.manutencao)}`} color="#4A7FDB" />
                </div>
                <Nota t={`${R$(sp.livroAno)} (livro) + ${R$(sis.manutencao)} (manutenção) = ${R$(sis.valorBruto)}/aluno/ano`} />

                {desconto > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      <KV label="Desconto aplicado" value={`-${desconto}%`} sub={`-${R$(sis.valorBruto * desconto / 100)}/aluno/ano`} color="#dc2626" />
                      <KV label="Valor com desconto" value={R$(sis.valorDesc)} sub="Antes da proteção do piso" />
                    </div>
                    <Nota t={`${R$(sis.valorBruto)} × (1 − ${desconto}%) = ${R$(sis.valorDesc)}. Desconto máximo sem furar o piso: ${sis.descMax.toFixed(1)}%.`} />
                  </>
                )}

                <div style={{
                  background: sis.valorFinal <= sis.livroAno && desconto > 0 ? '#fef3c7' : '#f0fdf4',
                  border: `1.5px solid ${sis.valorFinal <= sis.livroAno && desconto > 0 ? '#fde68a' : '#86efac'}`,
                  borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.3rem' }}>
                      Proteção piso — MAX(livro, valor_com_desconto)
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.75rem', color: '#475569', marginBottom: '.2rem' }}>
                      MAX({R$(sp.livroAno)}, {R$(sis.valorDesc)}) = <strong>{R$(sis.valorFinal)}</strong>
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {sis.valorFinal <= sis.livroAno && desconto > 0
                        ? 'Atenção: desconto limitado pelo piso — valor travado no custo do livro'
                        : 'OK: desconto válido — não ultrapassou o custo do livro'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: sis.valorFinal <= sis.livroAno && desconto > 0 ? '#d97706' : '#16a34a' }}>
                    {R$(sis.valorFinal)}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.75rem 1rem' }}>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.3rem' }}>
                    Valor final — síntese
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    {R$(sis.valorFinal)}/aluno/ano · {R$(sis.valorFinal / 12)}/aluno/mês
                  </div>
                </div>
              </div>
            </Card>

            {/* 4. Resultado financeiro */}
            <Card>
              <SecTitle n={4} title="Resultado financeiro" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '.75rem' }}>
                <KV label="Valor/aluno/ano" value={R$(sis.valorFinal)} color="#4A7FDB" big />
                <KV label="Valor/aluno/mês" value={R$(sis.valorFinal / 12)} sub="÷ 12 meses" />
                <KV label="Valor anual total" value={R$(sis.anual)} sub={`${alunos} alunos × ${R$(sis.valorFinal)}`} />
                <KV label="Custo livros (anual)" value={R$(sis.custoLivros)} sub={`${R$(sp.livroAno)}/aluno × ${alunos} alunos`} color="#dc2626" />
                <KV label="Margem manutenção (anual)" value={R$(sis.margemManutencao)} sub={`(${R$(sis.valorFinal)} − ${R$(sp.livroAno)}) × ${alunos} al.`} color="#16a34a" />
              </div>
              <Nota t={`Custo real = livros ${R$(sis.custoLivros)}/ano. Margem da manutenção ${R$(sis.margemManutencao)}/ano.`} />
            </Card>

            {/* 5. Governança do desconto */}
            <Card>
              <SecTitle n={5} title="Governança do desconto" />
              <div style={{ background: govBg(sis.gov.status), border: `1.5px solid ${govBorder(sis.gov.status)}`, borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '.85rem' }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: govClr(sis.gov.status), marginBottom: '.3rem' }}>
                  {desconto === 0 ? 'Sem desconto' : `Desconto ${desconto}%`}
                </div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: govClr(sis.gov.status) }}>{sis.gov.label}</div>
              </div>
              {[
                { range: '0%',    label: 'Sem desconto',         s: 'ok',    ativo: desconto === 0 },
                { range: '1–5%',  label: 'Comercial (autônomo)', s: 'ok',    ativo: desconto > 0 && desconto <= 5 },
                { range: '6–10%', label: 'Gerência — Renato',    s: 'warn',  ativo: desconto > 5 && desconto <= 10 },
                { range: '>10%',  label: 'Diretoria — Dênis',    s: 'error', ativo: desconto > 10 },
              ].map(r => (
                <div key={r.range} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.45rem .7rem', borderRadius: 7, background: r.ativo ? govBg(r.s) : '#f8fafc', border: `1px solid ${r.ativo ? govBorder(r.s) : '#e2e8f0'}`, marginBottom: '.35rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: govClr(r.s), flexShrink: 0 }} />
                  <div style={{ fontSize: '.72rem', fontFamily: 'var(--font-inter,sans-serif)', flex: 1 }}><strong style={{ fontFamily: 'var(--font-montserrat,sans-serif)' }}>{r.range}</strong> · {r.label}</div>
                  {r.ativo && <span style={{ fontSize: '.6rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: govClr(r.s) }}>atual</span>}
                </div>
              ))}
            </Card>

            {/* 6. Parcelamento */}
            <Card>
              <SecTitle n={6} title="Painel de parcelamento — 4x a 12x" />
              {incluiComodato ? (
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '.7rem 1rem', marginBottom: '.85rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                  <div style={{ fontSize: '.73rem', fontFamily: 'var(--font-inter,sans-serif)', color: '#1d4ed8', lineHeight: 1.4 }}>
                    <strong>Leasing ativo — currículo fixado em 12x (mensal).</strong> O parcelamento do currículo é sempre mensal quando há leasing, independente da seleção abaixo.
                  </div>
                </div>
              ) : (
                <Nota t={`Valor anual total: ${R$(sis.anual)} (${alunos} alunos × ${R$(sis.valorFinal)}/ano). Clique em uma linha para selecionar.`} />
              )}
              <div style={{ overflowX: 'auto', marginTop: '.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Parcelas', 'Parcela mensal', 'Por aluno/mês', 'Governança'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 9 }, (_, i) => i + 4).map(n => {
                      const pm = sis.anual / n; const pa = pm / alunos
                      const ativo = incluiComodato ? n === 12 : n === parcelas
                      const locked = incluiComodato && n !== 12
                      return (
                        <tr key={n} onClick={() => !incluiComodato && setParcelas(n)} style={{ background: ativo ? '#eff6ff' : n % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9', cursor: incluiComodato ? 'default' : 'pointer', outline: ativo ? '2px solid #4A7FDB' : 'none', outlineOffset: -1, opacity: locked ? 0.4 : 1 }}>
                          <td style={{ padding: '.7rem 1rem', fontWeight: 800, fontSize: '.88rem', color: ativo ? '#2563eb' : '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                            {n}x{ativo && incluiComodato ? ' (fixo)' : ''}
                          </td>
                          <td style={{ padding: '.7rem 1rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: ativo ? '#2563eb' : '#0f172a' }}>{R$(pm)}</td>
                          <td style={{ padding: '.7rem 1rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#475569' }}>{R$(pa)}</td>
                          <td style={{ padding: '.7rem 1rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {desconto === 0 ? 'Livre' : desconto <= 5 ? 'Comercial' : desconto <= 10 ? 'Gerência — Renato' : 'Diretoria — Dênis'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '.65rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                {incluiComodato
                  ? <><strong style={{ color: '#2563eb' }}>12x (mensal)</strong> de {R$(sis.anual / 12)} · por aluno/mês: <strong style={{ color: '#2563eb' }}>{R$(sis.anual / 12 / alunos)}</strong> — fixo pela regra do leasing</>
                  : <>Selecionado: <strong style={{ color: '#2563eb' }}>{parcelas}x de {R$(sis.anual / parcelas)}</strong> · por aluno/mês: <strong style={{ color: '#2563eb' }}>{R$(sis.anual / parcelas / alunos)}</strong></>
                }
              </div>
            </Card>

            {/* 7. Fechamento do Orçamento */}
            <Card style={{ border: `2px solid ${incluiComodato ? '#4A7FDB' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0f172a', marginBottom: '.25rem' }}>Fechamento do Orçamento</div>
                  <div style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>Este orçamento inclui leasing de equipamentos?</div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {[
                    { v: false, l: 'Somente currículo' },
                    { v: true,  l: 'Currículo + Leasing' },
                  ].map(opt => (
                    <button
                      key={String(opt.v)}
                      onClick={() => setIncluiComodato(opt.v)}
                      style={{
                        padding: '.55rem 1.1rem', borderRadius: 8, cursor: 'pointer',
                        fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.75rem', fontWeight: 700,
                        border: `1.5px solid ${incluiComodato === opt.v ? '#0f172a' : '#e2e8f0'}`,
                        background: incluiComodato === opt.v ? '#0f172a' : '#f8fafc',
                        color: incluiComodato === opt.v ? '#fff' : '#64748b',
                      }}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumo somente currículo */}
              {!incluiComodato && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '.75rem' }}>
                    <div style={{ padding: '1rem 1.1rem', background: '#f8fafc' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Valor / aluno / ano</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#4A7FDB', lineHeight: 1 }}>{R$(sis.valorFinal)}</div>
                      <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>piso = custo livro {R$(sp.livroAno)}</div>
                    </div>
                    <div style={{ padding: '1rem 1.1rem', background: '#f8fafc' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Valor / aluno / mês</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{R$(sis.valorFinal / 12)}</div>
                      <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{R$(sis.valorFinal)}/ano ÷ 12</div>
                    </div>
                    <div style={{ padding: '1rem 1.1rem', background: '#f8fafc' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Parcela escola ({parcelasCurriculo}x)</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{R$(parcelaCurriculo)}</div>
                      <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{R$(sis.anual)}/ano ÷ {parcelasCurriculo}x</div>
                    </div>
                  </div>
                  <Nota t={`Somente currículo — parcela ${parcelasCurriculo}x de ${R$(parcelaCurriculo)}. Sem leasing. Para incluir equipamentos, selecione "Currículo + Leasing" acima.`} />
                </div>
              )}

              {/* Resumo currículo + leasing */}
              {incluiComodato && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
                    {/* Currículo */}
                    <div style={{ background: '#f8fafc', padding: '.85rem 1.1rem' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.5rem' }}>Currículo (sistema)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.35rem' }}>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Anual / aluno</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#4A7FDB' }}>{R$(sis.valorFinal)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Mensal / aluno</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#4A7FDB' }}>{R$(sis.valorFinal / 12)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Anual total</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{R$(sis.anual)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Parcela (12x)</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{R$(sis.anual / 12)}</div>
                        </div>
                      </div>
                    </div>
                    {/* Leasing */}
                    <div style={{ background: '#f0f9ff', padding: '.85rem 1.1rem' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.5rem' }}>Leasing (equipamentos)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.35rem' }}>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>PV (investimento)</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>{R$(com.PV)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Parcela ({com.N}x)</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>{R$(com.parcelaPrice)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Mensal / aluno</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>{R$(com.valorPorAlunoMes)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Duração</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>{com.N} meses</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total combinado */}
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: '1.1rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px' }}>
                    <div style={{ padding: '.75rem 1rem' }}>
                      <div style={{ fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Total / aluno / mês</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{R$(totalAluMes)}</div>
                      <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.3)', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>currículo {R$(alunoMesSis)} + leasing {R$(com.valorPorAlunoMes)}</div>
                    </div>
                    <div style={{ padding: '.75rem 1rem' }}>
                      <div style={{ fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Total / aluno / ano</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: '#5FE3D0', lineHeight: 1 }}>{R$(totalAluMes * 12)}</div>
                      <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.3)', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{R$(totalAluMes)}/mês × 12</div>
                    </div>
                    <div style={{ padding: '.75rem 1rem' }}>
                      <div style={{ fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Mensalidade escola (total)</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{R$(mensalidadeEscola)}</div>
                      <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.3)', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>currículo 12x {R$(sis.anual / 12)} + leasing {R$(com.parcelaPrice)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '.65rem' }}>
                    <Nota t={`Currículo: ${alunos} al. × ${R$(sis.valorFinal)}/ano ÷ 12 = ${R$(alunoMesSis)}/al./mês. Leasing: ${R$(com.PV)} × (1 + ${pct(lp.retornoAlvo)}) ÷ ${com.N} meses ÷ ${alunos} al. = ${R$(com.valorPorAlunoMes)}/al./mês. Total: ${R$(totalAluMes)}/al./mês.`} />
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: LEASING
            ══════════════════════════════════════════════════════ */}
        {tab === 'comodato' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Header banner */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1.1rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#5FE3D0', marginBottom: '.3rem' }}>
                Leasing de equipamentos — retorno garantido + projeção IPCA
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.4rem' }}>
                PMT = PV × (1 + retorno) ÷ N — parcelamento = duração do contrato
              </div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
                Fórmula de retorno garantido: retorno sobre PV fixo, prazo de amortização = duração total do contrato. Currículo reajustado por IPCA ao longo do contrato. Nº de alunos compartilhado com a aba Sistema.
              </div>
            </div>

            {/* 1. Parâmetros do leasing */}
            <Card>
              <SecTitle n={1} title="Parâmetros do leasing" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                <div>
                  <label style={LBL}>Nº de alunos</label>
                  <input type="number" min={1} value={alunos} onChange={e => setAlunos(+e.target.value || 1)} style={INP} />
                  <div style={NOTA}>Compartilhado com aba Sistema. Usado para calcular valor por aluno/mês.</div>
                </div>
                <div>
                  <label style={LBL}>Alunos na maior sala</label>
                  <input type="number" min={2} max={60} value={maiorSala} onChange={e => setMaiorSala(+e.target.value || 20)} style={INP} />
                  <div style={NOTA}>Define notebooks: ⌈{maiorSala} ÷ 2⌉ = {com.qtdNB} unidades. Padrão: 20 alunos.</div>
                </div>
                <div>
                  <label style={LBL}>Retorno alvo (%)</label>
                  <InlineNum value={+(lp.retornoAlvo * 100).toFixed(1)} onChange={v => setLp(p => ({ ...p, retornoAlvo: v / 100 }))} suffix="%" min={0} step={5} />
                  <div style={NOTA}>Retorno total sobre PV. 100% = recebe 2× o investimento ao longo do contrato.</div>
                </div>
                <div>
                  <label style={LBL}>IPCA anual estimado (%)</label>
                  <InlineNum value={+(lp.ipca * 100).toFixed(2)} onChange={v => setLp(p => ({ ...p, ipca: v / 100 }))} suffix="%" min={0} step={0.1} />
                  <div style={NOTA}>Reajuste anual do currículo. Padrão 5,5% a.a.</div>
                </div>
                <div>
                  <label style={LBL}>Duração contrato (meses)</label>
                  <input type="number" min={12} max={120} step={12} value={lp.duracaoMeses} onChange={e => setLp(p => ({ ...p, duracaoMeses: Math.max(12, +e.target.value || 60) }))} style={INP} />
                  <div style={NOTA}>Duração total do contrato = prazo de amortização. Padrão 60 meses (5 anos).</div>
                </div>
                <div>
                  <label style={LBL}>Tx. Manutenção (%)</label>
                  <InlineNum value={+(lp.txMan * 100).toFixed(1)} onChange={v => setLp(p => ({ ...p, txMan: v / 100 }))} suffix="%" min={0} step={1} />
                  <div style={NOTA}>Taxa sobre soma dos preços unitários × anos. Padrão 25%.</div>
                </div>
                <div>
                  <label style={LBL}>Tx. Admin (%)</label>
                  <InlineNum value={+(lp.txAdmin * 100).toFixed(1)} onChange={v => setLp(p => ({ ...p, txAdmin: v / 100 }))} suffix="%" min={0} step={1} />
                  <div style={NOTA}>Taxa administrativa sobre preços unitários × anos. Padrão 25%.</div>
                </div>
              </div>

              {/* Derivados */}
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
                {[
                  { label: 'PV (investimento total)', value: R$(com.PV), sub: 'equip + manut + admin', color: '#4A7FDB' },
                  { label: 'Parcelas', value: `${com.N}x`, sub: `${com.N / 12} anos (igual ao contrato)`, color: '#0f172a' },
                  { label: 'Notebooks (⌈sala÷2⌉)', value: String(com.qtdNB), sub: `⌈${maiorSala} ÷ 2⌉`, color: '#0f172a' },
                  { label: 'Retorno alvo', value: pct(lp.retornoAlvo), sub: `${R$(com.resultadoBruto)} de resultado bruto`, color: '#7c3aed' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '.75rem 1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 800, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: '.62rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>{k.sub}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 2. Tabela de equipamentos — EDITÁVEL */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <SecTitle n={2} title="Tabela de equipamentos — edite diretamente" />
                <button onClick={() => setEquip(DEFAULT_EQUIP)} style={{ padding: '.4rem .9rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#475569' }}>
                  Restaurar padrão
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Item', 'Qtd.', 'Valor unitário (R$)', 'Total (R$)', 'Nota'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {equip.map((item, idx) => {
                      const qtyReal = item.fixedQty ? com.qtdNB : item.qty
                      const total   = qtyReal * item.unit
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          {/* Nome (editável) */}
                          <td style={{ padding: '.5rem .65rem', minWidth: 180 }}>
                            <input
                              type="text" value={item.nome}
                              onChange={e => updEquip(idx, 'nome', e.target.value)}
                              style={{ ...INP_SM, background: '#fff', minWidth: 160 }}
                            />
                          </td>
                          {/* Quantidade */}
                          <td style={{ padding: '.5rem .65rem', minWidth: 90 }}>
                            {item.fixedQty ? (
                              <div style={{ padding: '.35rem .55rem', background: '#f1f5f9', borderRadius: 6, fontSize: '.8rem', fontWeight: 700, color: '#4A7FDB', fontFamily: 'var(--font-cormorant,serif)', textAlign: 'center', border: '1.5px solid #e2e8f0' }}>
                                {com.qtdNB}
                              </div>
                            ) : (
                              <InlineNum value={item.qty} onChange={v => updEquip(idx, 'qty', Math.max(0, Math.round(v)))} min={0} step={1} />
                            )}
                          </td>
                          {/* Preço unitário */}
                          <td style={{ padding: '.5rem .65rem', minWidth: 130 }}>
                            <InlineNum value={item.unit} onChange={v => updEquip(idx, 'unit', v)} prefix="R$" min={0} step={0.01} />
                          </td>
                          {/* Total */}
                          <td style={{ padding: '.5rem .65rem', minWidth: 120 }}>
                            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#0f172a', padding: '.35rem .55rem' }}>
                              {R$(total)}
                            </div>
                          </td>
                          {/* Nota */}
                          <td style={{ padding: '.5rem .65rem', minWidth: 160 }}>
                            <div style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                              {item.nota ?? (item.fixedQty ? '⌈maior sala ÷ 2⌉' : '')}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {/* Total */}
                    <tr style={{ background: '#0f172a' }}>
                      <td colSpan={3} style={{ padding: '.85rem 1rem', fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 700, color: '#4A7FDB' }}>TOTAL EQUIPAMENTOS (sumEquip)</td>
                      <td style={{ padding: '.85rem 1rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{R$(com.sumEquip)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* 3. Taxas de manutenção/admin */}
            <Card>
              <SecTitle n={3} title="Taxas de manutenção/admin (sobre preços unitários)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '.65rem' }}>
                <KV
                  label={`Manutenção: ${pct(lp.txMan)} × soma unitários × ${com.anos} anos`}
                  value={R$(com.C_man)}
                  sub={`${pct(lp.txMan)} × ${R$(com.sumUnit)} × ${com.anos}`}
                  color="#0f172a"
                />
                <KV
                  label={`Admin: ${pct(lp.txAdmin)} × soma unitários × ${com.anos} anos`}
                  value={R$(com.C_adm)}
                  sub={`${pct(lp.txAdmin)} × ${R$(com.sumUnit)} × ${com.anos}`}
                  color="#0f172a"
                />
              </div>
              <Nota t={`Manutenção: ${pct(lp.txMan)} × ${R$(com.sumUnit)} × ${com.anos} anos = ${R$(com.C_man)}`} />
              <Nota t={`Admin: ${pct(lp.txAdmin)} × ${R$(com.sumUnit)} × ${com.anos} anos = ${R$(com.C_adm)}`} />
              <Nota t={`PV total: ${R$(com.sumEquip)} (equip.) + ${R$(com.C_man)} (manut.) + ${R$(com.C_adm)} (adm.) = ${R$(com.PV)}`} />
            </Card>

            {/* 4. Cálculo e resultado */}
            <Card>
              <SecTitle n={4} title="Cálculo e resultado — retorno garantido" />

              {/* Sub-section A — Fórmula retorno garantido */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.5rem' }}>
                  Fórmula retorno garantido: PMT = PV × (1 + retorno) ÷ N
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.8rem', fontFamily: 'var(--font-inter,sans-serif)', color: '#1e293b', marginBottom: '.75rem', lineHeight: 1.7 }}>
                  {R$(com.PV)} × (1 + {pct(lp.retornoAlvo)}) ÷ {com.N} meses = <strong style={{ color: '#4A7FDB' }}>{R$(com.parcelaPrice)}/mês</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <KV label="PV (investimento total)" value={R$(com.PV)} sub="equip + manut + admin" big />
                  <KV label="Parcela (FIXA)" value={R$(com.parcelaPrice)} sub={`${com.N} parcelas mensais fixas`} color="#4A7FDB" big />
                  <KV label="Por aluno / mês" value={R$(com.valorPorAlunoMes)} sub={`${R$(com.parcelaPrice)} ÷ ${alunos} al.`} color="#7c3aed" big />
                </div>
              </div>

              {/* Sub-section B — Visão econômica */}
              <div>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.5rem' }}>
                  Visão econômica ({lp.duracaoMeses} meses = {lp.duracaoMeses / 12} anos)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <KV
                    label="Total recebido"
                    value={R$(com.totalRecebido)}
                    sub={`${R$(com.parcelaPrice)} × ${com.N} meses`}
                    color="#0f172a"
                    big
                  />
                  <KV
                    label="Resultado bruto"
                    value={R$(com.resultadoBruto)}
                    sub={`${R$(com.totalRecebido)} − ${R$(com.PV)}`}
                    color="#16a34a"
                    big
                  />
                  <KV
                    label="Retorno s/ PV"
                    value={pct(lp.retornoAlvo)}
                    sub={`${R$(com.resultadoBruto)} ÷ ${R$(com.PV)}`}
                    color="#7c3aed"
                    big
                  />
                </div>
              </div>
            </Card>

            {/* 5. Projeção anual */}
            <Card>
              <SecTitle n={5} title="Projeção anual — currículo + leasing" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Ano', 'Período', 'Parcela currículo', 'Parcela leasing', 'Total escola/mês', 'Receita total ano'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {com.tabela.map((row, idx) => (
                      <tr key={row.ano} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '.6rem .85rem', fontWeight: 700, fontSize: '.88rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Ano {row.ano}</td>
                        <td style={{ padding: '.6rem .85rem', fontSize: '.78rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                          mês {(row.ano - 1) * 12 + 1}–{row.ano * 12}
                        </td>
                        <td style={{ padding: '.6rem .85rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#4A7FDB' }}>
                          {R$(row.parcelaCurr)}
                          {row.ano > 1 && <span style={{ fontSize: '.6rem', color: '#94a3b8', marginLeft: '.3rem' }}>×{row.fatorIpca.toFixed(3)}</span>}
                        </td>
                        <td style={{ padding: '.6rem .85rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#0369a1' }}>{R$(row.parcelaComodato)}</td>
                        <td style={{ padding: '.6rem .85rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{R$(row.totalEscola)}</td>
                        <td style={{ padding: '.6rem .85rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>{R$(row.recTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '.65rem' }}>
                <Nota t={`Currículo reajustado por IPCA (${pct(lp.ipca)} a.a.). Leasing FIXO em ${R$(com.parcelaPrice)}/mês durante ${lp.duracaoMeses} meses.`} />
              </div>
            </Card>

            {/* 6. Resumo Combinado */}
            <Card style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#5FE3D0', marginBottom: '.3rem' }}>Resumo combinado — sistema + leasing</div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>O que a escola paga por aluno mensalmente</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden' }}>
                {[
                  { label: 'Sistema We Make', value: R$(alunoMesSis), sub: `${R$(sis.valorFinal)}/ano ÷ 12`, color: '#4A7FDB' },
                  { label: 'Leasing Equip.', value: R$(com.valorPorAlunoMes), sub: `${R$(com.parcelaPrice)}/mês ÷ ${alunos} al.`, color: '#5FE3D0' },
                  { label: 'Total / aluno / mês', value: R$(totalAluMes), sub: `${R$(totalAluMes * 12)}/aluno/ano`, color: '#fff', big: true },
                  { label: 'Mensalidade escola', value: R$(mensalidadeEscola), sub: `currículo 12x + leasing ${com.N} meses`, color: '#f59e0b' },
                ].map(k => (
                  <div key={k.label} style={{ padding: '1rem 1.1rem', background: 'rgba(255,255,255,.04)' }}>
                    <div style={{ fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: k.big ? '1.5rem' : '1.1rem', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                    <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.3)', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{k.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '.75rem', fontSize: '.7rem', color: 'rgba(255,255,255,.35)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
                Sistema: {alunos} al. × {R$(sis.valorFinal)}/ano ÷ 12 = {R$(alunoMesSis)}/al./mês &nbsp;·&nbsp;
                Leasing: {R$(com.PV)} × (1 + {pct(lp.retornoAlvo)}) ÷ {com.N} meses ÷ {alunos} al. = {R$(com.valorPorAlunoMes)}/al./mês &nbsp;·&nbsp;
                Total: {R$(totalAluMes)}/al./mês · {R$(totalAluMes * 12)}/al./ano
              </div>
            </Card>

          </div>
        )}

      </div>
    </div>
  )
}
