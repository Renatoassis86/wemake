'use client'

import { useState, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'

// ── Formatação ────────────────────────────────────────────────────
const R$ = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (v: number) => (v * 100).toFixed(1) + '%'
const dec = (v: number) => v.toFixed(3)

// ══════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════
interface Faixa { nome: string; min: number; max: number; piso: number }
interface SisParams {
  livroMes: number; teto: number; ticketMax: number
  wEscala: number; wTicket: number; wCompl: number; wFid: number
  faixas: Faixa[]
}
interface EquipItem { nome: string; qty: number; unit: number; fixedQty: boolean; nota?: string }
interface ComParams {
  taxas: { parcelas: number; txMan: number; txAdmin: number }[]
}

// ── Valores padrão (espelham exatamente as abas do Excel) ─────────
const DEFAULT_SIS: SisParams = {
  livroMes: 16.50, teto: 420, ticketMax: 1500,
  wEscala: 0.35, wTicket: 0.30, wCompl: 0.20, wFid: 0.15,
  faixas: [
    { nome: 'Faixa 1', min: 1,   max: 100, piso: 320 },
    { nome: 'Faixa 2', min: 101, max: 300, piso: 280 },
    { nome: 'Faixa 3', min: 301, max: 500, piso: 280 },
    { nome: 'Faixa 4', min: 501, max: 800, piso: 280 },
  ],
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

// Taxas padrão por faixa de parcelas (J/K colunas do Excel)
const DEFAULT_COM: ComParams = {
  taxas: [
    { parcelas: 48, txMan: 0.25, txAdmin: 0.25 },
    { parcelas: 36, txMan: 0.20, txAdmin: 0.20 },
    { parcelas: 24, txMan: 0.15, txAdmin: 0.15 },
    { parcelas: 12, txMan: 0.10, txAdmin: 0.10 },
  ],
}

// ══════════════════════════════════════════════════════════════════
// FUNÇÕES DE CÁLCULO (puras — recebem tudo como parâmetro)
// ══════════════════════════════════════════════════════════════════
function calcSistema(
  alunos: number, ticket: number, segmentos: number,
  altaCompl: boolean, situacao: string, desconto: number,
  p: SisParams
) {
  const f = p.faixas.find(x => alunos >= x.min && alunos <= x.max) ?? p.faixas[p.faixas.length - 1]
  const range = (f.max - f.min) || 1

  const s1 = 1 - (alunos - f.min) / range
  const s2 = Math.min(1, ticket / p.ticketMax)
  const s3 = (segmentos === 3 || altaCompl) ? 1 : segmentos === 2 ? 0.5 : 0
  const s4 = situacao === 'Renovação 2º ciclo+' ? 0.4 : situacao === 'Renovação 1º ciclo' ? 0.7 : 1.0

  const scoreFinal   = p.wEscala * s1 + p.wTicket * s2 + p.wCompl * s3 + p.wFid * s4
  const valorBruto   = f.piso + (p.teto - f.piso) * scoreFinal
  const valorDesc    = valorBruto * (1 - desconto / 100)
  const valorFinal   = Math.max(f.piso, valorDesc)
  const anual        = valorFinal * alunos

  const gov = desconto === 0 ? { label: '— Sem desconto', status: 'ok' as const }
    : desconto <= 5  ? { label: 'Comercial (autônomo)', status: 'ok' as const }
    : desconto <= 10 ? { label: 'Gerência — Renato', status: 'warn' as const }
    : { label: 'Diretoria — Dênis', status: 'error' as const }

  return {
    f, s1, s2, s3, s4, scoreFinal,
    valorBruto, valorDesc, valorFinal, anual,
    custo: anual * 0.70, liquido: anual * 0.30,
    gov, descMax: valorBruto > f.piso ? (1 - f.piso / valorBruto) * 100 : 0,
    ticketLabel: ticket < 400 ? 'Popular' : ticket <= 800 ? 'Média-baixa' : ticket <= 1500 ? 'Padrão' : 'Premium',
    livroAno: p.livroMes * 12,
  }
}

function calcComodato(
  alunos: number, maiorSala: number, anosContrato: number,
  equip: EquipItem[], cp: ComParams
) {
  const qtdNB = Math.ceil(maiorSala / 2)

  // Parcelas comodato baseado em faixa de alunos
  const parcelas = alunos <= 100 ? 48 : alunos <= 300 ? 36 : alunos <= 500 ? 24 : 12
  const faixaLabel = alunos <= 100 ? 'Até 100 alunos' : alunos <= 300 ? '101–300' : alunos <= 500 ? '301–500' : 'Acima de 500'

  // Taxas correspondentes
  const taxaRow = cp.taxas.find(t => t.parcelas === parcelas) ?? cp.taxas[cp.taxas.length - 1]
  const txMan   = taxaRow.txMan
  const txAdmin = taxaRow.txAdmin

  // Quantidade efetiva (notebooks e seguro seguem qtdNB se fixedQty)
  const itensCalc = equip.map((e, idx) => {
    const qtyReal = e.fixedQty
      ? (idx === 6 ? qtdNB : qtdNB)  // informática e seguro (idx 6 e 9)
      : e.qty
    return { ...e, qtyReal, total: qtyReal * e.unit }
  })
  // Recalcula com qtyReal correto por índice
  const itensComQty = equip.map((e, idx) => {
    const qtyReal = e.fixedQty ? qtdNB : e.qty
    return { ...e, qtyReal, total: qtyReal * e.unit }
  })

  // SUM(C2:C11) — soma dos preços UNITÁRIOS (conforme fórmula Excel)
  const sumUnit = equip.reduce((s, e) => s + e.unit, 0)

  // Manutenção (C12) = tx × SUM_unitarios × anos
  const C12 = txMan * sumUnit * anosContrato
  // Admin (C13) = tx × (SUM_unitarios + C12) × anos
  const C13 = txAdmin * (sumUnit + C12) * anosContrato

  // Total D14 = SUM(D2:D12) — soma dos totais (qtyReal × unit) + manutenção
  const D14 = itensComQty.reduce((s, e) => s + e.total, 0) + C12

  const parcelaMensal    = D14 / (parcelas || 1)
  const valorPorAlunoMes = parcelaMensal / (alunos || 1)

  return {
    qtdNB, parcelas, faixaLabel, txMan, txAdmin,
    sumUnit, C12, C13, itens: itensComQty, D14,
    parcelaMensal, valorPorAlunoMes,
    valorTotalContrato: D14 * anosContrato,
  }
}

// ══════════════════════════════════════════════════════════════════
// ESKOLARE — lógica original preservada
// ══════════════════════════════════════════════════════════════════
const TAXA_PLAT = 0.015; const TAXA_FIXA = 0.30; const MIN_PARC = 30
const MANUT_MES = 70; const MANUT_MESES = 3; const MANUT_TOTAL = 210

const SEG_LIST = [
  { id: 'inf2', label: 'Infantil 2' }, { id: 'inf3', label: 'Infantil 3' },
  { id: 'inf4', label: 'Infantil 4' }, { id: 'inf5', label: 'Infantil 5' },
  { id: 'f1a1', label: '1º Ano Fund I' }, { id: 'f1a2', label: '2º Ano Fund I' },
  { id: 'f1a3', label: '3º Ano Fund I' }, { id: 'f1a4', label: '4º Ano Fund I' },
  { id: 'f1a5', label: '5º Ano Fund I' },
]

function calcEsk(custo: number, ct: 'pct'|'abs', cp: number, ca: number, parc: number, qa: number, ta: number) {
  const tc  = parc === 1 ? 0.0289 : parc <= 6 ? 0.0299 : 0.0369
  const com = ct === 'pct' ? custo * (cp / 100) : ca
  const liq = custo + com
  const mau = ta > 0 && qa > 0 ? (MANUT_TOTAL * (qa / ta)) / qa : 0
  const tf  = TAXA_FIXA * parc; const den = 1 - TAXA_PLAT - tc
  const pr  = Math.ceil(((liq + tf + mau) / den) * 100) / 100
  const pv  = Math.round((pr / parc) * 100) / 100
  return { com, liq, mau, tc, tf, pr, pv, lr: pr * den - tf - mau, ok: pv >= MIN_PARC }
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
function Nota({ t }: { t: string }) { return <div style={NOTA}>📝 {t}</div> }

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
  const [tab, setTab] = useState<'sistema' | 'comodato' | 'eskolare'>('sistema')

  // ── Parâmetros do Sistema (todos editáveis) ──────────────────────
  const [sp, setSp] = useState<SisParams>(DEFAULT_SIS)
  const [showSisAdv, setShowSisAdv] = useState(false)

  const updSp = (field: keyof SisParams, val: any) => setSp(p => ({ ...p, [field]: val }))
  const updFaixa = (idx: number, field: keyof Faixa, val: number) =>
    setSp(p => { const f = [...p.faixas]; f[idx] = { ...f[idx], [field]: val }; return { ...p, faixas: f } })

  // ── Parâmetros compartilhados sistema+comodato ─────────────────
  const [alunos,    setAlunos]    = useState(100)
  const [ticket,    setTicket]    = useState(700)
  const [segs,      setSegs]      = useState(2)
  const [altaCompl, setAltaCompl] = useState(false)
  const [situacao,  setSituacao]  = useState('Novo')
  const [desconto,  setDesconto]  = useState(0)
  const [parcelas,  setParcelas]  = useState(4)
  const [maiorSala, setMaiorSala] = useState(20)

  // ── Equipamentos do Comodato (todos editáveis) ─────────────────
  const [equip, setEquip] = useState<EquipItem[]>(DEFAULT_EQUIP)
  const [cp, setCp]       = useState<ComParams>(DEFAULT_COM)

  const updEquip = (idx: number, field: keyof EquipItem, val: any) =>
    setEquip(p => { const e = [...p]; e[idx] = { ...e[idx], [field]: val }; return e })
  const updTaxa = (idx: number, field: 'txMan' | 'txAdmin', val: number) =>
    setCp(p => { const t = [...p.taxas]; t[idx] = { ...t[idx], [field]: val }; return { ...p, taxas: t } })

  // ── Cálculos ──────────────────────────────────────────────────
  const sis = useMemo(
    () => calcSistema(alunos, ticket, segs, altaCompl, situacao, desconto, sp),
    [alunos, ticket, segs, altaCompl, situacao, desconto, sp]
  )
  const com = useMemo(
    () => calcComodato(alunos, maiorSala, parcelas, equip, cp),
    [alunos, maiorSala, parcelas, equip, cp]
  )

  const alunoMesSis  = sis.valorFinal / 12
  const totalAluMes  = alunoMesSis + com.valorPorAlunoMes
  const parcelaTotal = sis.anual / parcelas + com.parcelaMensal

  // ── Eskolare state ─────────────────────────────────────────────
  const [eseg, setEseg] = useState(
    SEG_LIST.map((s, i) => ({ ...s, ativo: i < 2, igual: i > 0, custo: 600, ct: 'pct' as 'pct'|'abs', cp: 20, ca: 0, qa: 30, parc: 12 }))
  )
  const [ecalc, setEcalc] = useState<Record<string, ReturnType<typeof calcEsk>>>({})
  const [efeito, setEfeito] = useState(false)
  const eativos  = eseg.filter(s => s.ativo)
  const eprim    = eativos[0]
  const etotal   = eativos.reduce((a, s) => a + (s.igual && eprim && s.id !== eprim.id ? eprim.qa : s.qa), 0)
  const eupd     = (id: string, f: string, v: any) => { setEseg(p => p.map(s => s.id === id ? { ...s, [f]: v } : s)); setEfeito(false) }
  const ecalcular = () => {
    const r: Record<string, ReturnType<typeof calcEsk>> = {}
    eativos.forEach(s => { const ref = s.igual && eprim && s.id !== eprim.id ? eprim : s; r[s.id] = calcEsk(ref.custo, ref.ct, ref.cp, ref.ca, ref.parc, ref.qa, etotal) })
    setEcalc(r); setEfeito(true)
  }

  // ── Helpers visuais ───────────────────────────────────────────
  const scoreClr  = (v: number) => v >= 0.7 ? '#16a34a' : v >= 0.4 ? '#d97706' : '#dc2626'
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
      <PageHeader title="Calculadora We Make" subtitle="Precificação por score + comodato de equipamentos" />
      <div style={{ padding: '1.75rem 2.5rem' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <button style={tabStyle('sistema')}  onClick={() => setTab('sistema')}>We Make — Sistema</button>
          <button style={tabStyle('comodato')} onClick={() => setTab('comodato')}>Comodato de Equipamentos</button>
          <button style={tabStyle('eskolare')} onClick={() => setTab('eskolare')}>Eskolare</button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB: SISTEMA
            ══════════════════════════════════════════════════════ */}
        {tab === 'sistema' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1.1rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4A7FDB', marginBottom: '.3rem' }}>Lógica de precificação — Calculadora_v3 · v4.0</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.4rem' }}>Valor = Piso + (Teto − Piso) × Score ponderado</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
                4 fatores (escala, ticket, complexidade, fidelidade) geram score 0–1 que navega entre piso da faixa e teto fixo. Todos os parâmetros são editáveis abaixo.
              </div>
            </div>

            {/* 1. Entradas principais */}
            <Card>
              <SecTitle n={1} title="Entradas principais" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                <div>
                  <label style={LBL}>Número de alunos</label>
                  <input type="number" min={1} value={alunos} onChange={e => setAlunos(+e.target.value || 1)} style={INP} />
                  <div style={NOTA}>Total de alunos We Make na escola. Define a faixa de preço.</div>
                </div>
                <div>
                  <label style={LBL}>Ticket médio mensal/aluno (R$)</label>
                  <input type="number" min={0} value={ticket} onChange={e => setTicket(+e.target.value || 0)} style={INP} />
                  <div style={NOTA}>Mensalidade da escola ao pai. Escolas ≥ R${sp.ticketMax.toLocaleString('pt-BR')} = score máximo.</div>
                </div>
                <div>
                  <label style={LBL}>Segmentos atendidos</label>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    {[1, 2, 3].map(n => (
                      <button key={n} onClick={() => setSegs(n)} style={{ flex: 1, padding: '.65rem', borderRadius: 8, border: `1.5px solid ${segs === n ? '#0f172a' : '#e2e8f0'}`, background: segs === n ? '#0f172a' : '#fff', color: segs === n ? '#fff' : '#64748b', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{n}</button>
                    ))}
                  </div>
                  <div style={NOTA}>Ciclos escolares. 3 = score complexidade máximo.</div>
                </div>
                <div>
                  <label style={LBL}>Alta complexidade?</label>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    {['NÃO', 'SIM'].map(v => (
                      <button key={v} onClick={() => setAltaCompl(v === 'SIM')} style={{ flex: 1, padding: '.65rem', borderRadius: 8, border: `1.5px solid ${(altaCompl ? 'SIM' : 'NÃO') === v ? '#0f172a' : '#e2e8f0'}`, background: (altaCompl ? 'SIM' : 'NÃO') === v ? '#0f172a' : '#fff', color: (altaCompl ? 'SIM' : 'NÃO') === v ? '#fff' : '#64748b', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{v}</button>
                    ))}
                  </div>
                  <div style={NOTA}>SIM força score complexidade = 1,000.</div>
                </div>
                <div>
                  <label style={LBL}>Situação do contrato</label>
                  <select value={situacao} onChange={e => setSituacao(e.target.value)} style={{ ...INP, background: '#fffef0' }}>
                    <option>Novo</option>
                    <option>Renovação 1º ciclo</option>
                    <option>Renovação 2º ciclo+</option>
                  </select>
                  <div style={NOTA}>Renovação reduz score de fidelidade, beneficiando a escola.</div>
                </div>
                <div>
                  <label style={LBL}>Desconto comercial (%)</label>
                  <input type="number" min={0} max={30} step={0.5} value={desconto} onChange={e => setDesconto(+e.target.value || 0)} style={{ ...INP, borderColor: desconto > 10 ? '#fca5a5' : desconto > 5 ? '#fde68a' : '#e2e8f0' }} />
                  <div style={NOTA}>≤5% autônomo · 6–10% Renato · &gt;10% Dênis.</div>
                </div>
                <div>
                  <label style={LBL}>Qtd. parcelas (4–12)</label>
                  <input type="number" min={4} max={12} value={parcelas} onChange={e => setParcelas(Math.min(12, Math.max(4, +e.target.value || 4)))} style={INP} />
                  <div style={NOTA}>Default 4x. CEO pode ampliar até 12x. Também = anos do comodato.</div>
                </div>
              </div>
            </Card>

            {/* 2. Parâmetros avançados (editáveis) */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSisAdv ? '1rem' : 0 }}>
                <SecTitle n={2} title="Parâmetros e pesos (editáveis)" />
                <button onClick={() => setShowSisAdv(v => !v)} style={{ padding: '.4rem .9rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#475569' }}>
                  {showSisAdv ? 'Fechar ▲' : 'Editar ▼'}
                </button>
              </div>
              {showSisAdv && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Parâmetros gerais */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.65rem' }}>Valores gerais</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
                      {[
                        { label: 'Livro/aluno/mês (R$)', field: 'livroMes' as keyof SisParams, val: sp.livroMes, nota: 'Custo fixo do material didático', prefix: 'R$' },
                        { label: 'Teto único (R$/aluno/ano)', field: 'teto' as keyof SisParams, val: sp.teto, nota: 'Limite máximo absoluto — igual para todas as faixas', prefix: 'R$' },
                        { label: 'Ticket referência máx (R$)', field: 'ticketMax' as keyof SisParams, val: sp.ticketMax, nota: 'Ticket acima deste valor = score máximo de ticket', prefix: 'R$' },
                      ].map(f => (
                        <div key={f.field}>
                          <label style={LBL}>{f.label}</label>
                          <InlineNum value={f.val as number} onChange={v => updSp(f.field, v)} prefix={f.prefix} min={0} step={0.5} />
                          <div style={NOTA}>{f.nota}</div>
                        </div>
                      ))}
                      <div>
                        <label style={LBL}>Livro/aluno/ano (calculado)</label>
                        <div style={{ padding: '.65rem .9rem', background: '#f1f5f9', borderRadius: 8, fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#475569', border: '1.5px solid #e2e8f0' }}>
                          {R$(sp.livroMes * 12)}
                        </div>
                        <div style={NOTA}>R${sp.livroMes}/mês × 12 meses</div>
                      </div>
                    </div>
                  </div>

                  {/* Pesos dos scores */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.65rem' }}>
                      Pesos dos scores — soma deve ser 100%
                      <span style={{ marginLeft: '.75rem', fontWeight: 800, color: Math.abs(sp.wEscala + sp.wTicket + sp.wCompl + sp.wFid - 1) < 0.001 ? '#16a34a' : '#dc2626' }}>
                        Atual: {((sp.wEscala + sp.wTicket + sp.wCompl + sp.wFid) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
                      {[
                        { label: 'Peso Escala (%)', field: 'wEscala' as keyof SisParams, val: sp.wEscala, nota: 'Nº de alunos dentro da faixa' },
                        { label: 'Peso Ticket (%)', field: 'wTicket' as keyof SisParams, val: sp.wTicket, nota: 'Mensalidade da escola' },
                        { label: 'Peso Complexidade (%)', field: 'wCompl' as keyof SisParams, val: sp.wCompl, nota: 'Nº de segmentos' },
                        { label: 'Peso Fidelidade (%)', field: 'wFid' as keyof SisParams, val: sp.wFid, nota: 'Renovação vs novo contrato' },
                      ].map(f => (
                        <div key={f.field}>
                          <label style={LBL}>{f.label}</label>
                          <InlineNum value={+(f.val as number * 100).toFixed(1)} onChange={v => updSp(f.field, v / 100)} suffix="%" min={0} step={1} />
                          <div style={NOTA}>{f.nota}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabela de faixas */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.65rem' }}>Tabela de faixas — piso R$/aluno/ano</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <thead>
                        <tr>{['Faixa', 'Alunos: mín', 'Alunos: máx', 'Piso (R$/aluno/ano)', 'Teto (sempre)'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {sp.faixas.map((f, idx) => (
                          <tr key={f.nome} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '.6rem .85rem', fontWeight: 700, fontSize: '.82rem', fontFamily: 'var(--font-montserrat,sans-serif)', color: alunos >= f.min && alunos <= f.max ? '#2563eb' : '#0f172a' }}>
                              {f.nome} {alunos >= f.min && alunos <= f.max && <span style={{ fontSize: '.6rem', background: '#dbeafe', color: '#1d4ed8', padding: '.1rem .35rem', borderRadius: 99, marginLeft: '.3rem' }}>← atual</span>}
                            </td>
                            <td style={{ padding: '.5rem .85rem' }}><InlineNum value={f.min} onChange={v => updFaixa(idx, 'min', v)} min={1} /></td>
                            <td style={{ padding: '.5rem .85rem' }}><InlineNum value={f.max} onChange={v => updFaixa(idx, 'max', v)} min={1} /></td>
                            <td style={{ padding: '.5rem .85rem' }}><InlineNum value={f.piso} onChange={v => updFaixa(idx, 'piso', v)} prefix="R$" min={0} step={10} /></td>
                            <td style={{ padding: '.6rem .85rem', fontFamily: 'var(--font-cormorant,serif)', fontWeight: 700, color: '#475569' }}>
                              <InlineNum value={sp.teto} onChange={v => updSp('teto', v)} prefix="R$" min={0} step={10} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: '.5rem', fontSize: '.68rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>O teto é único para todas as faixas — editá-lo em uma linha altera todas.</div>
                  </div>

                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button onClick={() => setSp(DEFAULT_SIS)} style={{ padding: '.45rem 1rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#64748b' }}>↺ Restaurar padrão</button>
                  </div>
                </div>
              )}
            </Card>

            {/* 3. Scores */}
            <Card>
              <SecTitle n={3} title="Scores dos fatores (0 a 1 cada)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Score 1 — Escala', peso: sp.wEscala, score: sis.s1, mem: `1 − (${alunos} − ${sis.f.min}) ÷ (${sis.f.max} − ${sis.f.min}) = ${dec(sis.s1)}`, nota: 'Mais alunos dentro da faixa → score menor → preço mais próximo do piso.' },
                  { label: 'Score 2 — Ticket', peso: sp.wTicket, score: sis.s2, mem: `MIN(1 ; ${R$(ticket)} ÷ ${R$(sp.ticketMax)}) = ${dec(sis.s2)} · Perfil: ${sis.ticketLabel}`, nota: 'Ticket maior → escola premium → pode pagar mais.' },
                  { label: 'Score 3 — Complexidade', peso: sp.wCompl, score: sis.s3, mem: segs === 3 || altaCompl ? '3 seg/alta compl → 1,000' : segs === 2 ? '2 seg → 0,500' : '1 seg → 0,000', nota: 'Mais segmentos = maior estrutura de entrega = preço maior.' },
                  { label: 'Score 4 — Fidelidade', peso: sp.wFid, score: sis.s4, mem: situacao === 'Renovação 2º ciclo+' ? 'Renov 2º+ → 0,400' : situacao === 'Renovação 1º ciclo' ? 'Renov 1º → 0,700' : 'Novo → 1,000', nota: 'Renovação = benefício implícito — escola fiel paga menos.' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.6rem' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{s.label} <span style={{ color: '#94a3b8' }}>({pct(s.peso)})</span></div>
                        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: scoreClr(s.score) }}>{dec(s.score)}</div>
                      </div>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', border: `3px solid ${scoreClr(s.score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.75rem', color: scoreClr(s.score), fontFamily: 'var(--font-montserrat,sans-serif)' }}>{pct(s.score)}</div>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: '.55rem' }}>
                      <div style={{ height: '100%', width: `${s.score * 100}%`, background: scoreClr(s.score), borderRadius: 99, transition: 'width .3s' }} />
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.5, fontFamily: 'var(--font-inter,sans-serif)' }}><strong>Memória:</strong> {s.mem}<br />{s.nota}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#0f172a', borderRadius: 10, padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.25rem' }}>Score Final Ponderado</div>
                  <div style={{ fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.72rem', color: 'rgba(255,255,255,.45)', marginBottom: '.25rem' }}>
                    {pct(sp.wEscala)}×{dec(sis.s1)} + {pct(sp.wTicket)}×{dec(sis.s2)} + {pct(sp.wCompl)}×{dec(sis.s3)} + {pct(sp.wFid)}×{dec(sis.s4)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{dec(sis.scoreFinal)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.2rem' }}>Navega entre</div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.85rem', fontWeight: 800, color: '#5FE3D0' }}>{R$(sis.f.piso)} ↔ {R$(sp.teto)}</div>
                  <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', marginTop: '.1rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{sis.f.nome} · piso {R$(sis.f.piso)}</div>
                </div>
              </div>
            </Card>

            {/* 4. Equação Central */}
            <Card>
              <SecTitle n={4} title="Equação central — memória de cálculo" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <KV label="① Piso da faixa" value={R$(sis.f.piso)} sub={`${sis.f.nome}: ${sis.f.min}–${sis.f.max} alunos`} />
                  <KV label="② Amplitude × Score" value={R$(sis.valorBruto - sis.f.piso)} sub={`(${R$(sp.teto)} − ${R$(sis.f.piso)}) × ${dec(sis.scoreFinal)}`} />
                  <KV label="③ Valor bruto" value={R$(sis.valorBruto)} sub="Piso + amplitude × score" color="#4A7FDB" />
                </div>
                <Nota t={`${R$(sis.f.piso)} + (${R$(sp.teto)} − ${R$(sis.f.piso)}) × ${dec(sis.scoreFinal)} = ${R$(sis.valorBruto)}/aluno/ano`} />

                {desconto > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      <KV label="④ Desconto aplicado" value={`−${desconto}%`} sub={`−${R$(sis.valorBruto * desconto / 100)}`} color="#dc2626" />
                      <KV label="⑤ Valor com desconto" value={R$(sis.valorDesc)} sub="Antes da proteção do piso" />
                    </div>
                    <Nota t={`${R$(sis.valorBruto)} × (1 − ${desconto}%) = ${R$(sis.valorDesc)}. Desconto máximo sem furar o piso: ${sis.descMax.toFixed(1)}%.`} />
                  </>
                )}

                <div style={{ background: sis.valorFinal <= sis.f.piso ? '#fef3c7' : '#f0fdf4', border: `1.5px solid ${sis.valorFinal <= sis.f.piso ? '#fde68a' : '#86efac'}`, borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.3rem' }}>⑥ Proteção piso — MAX(piso, valor_com_desconto)</div>
                    <div style={{ fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.75rem', color: '#475569', marginBottom: '.2rem' }}>
                      MAX({R$(sis.f.piso)}, {R$(sis.valorDesc)}) = <strong>{R$(sis.valorFinal)}</strong>
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {sis.valorFinal <= sis.f.piso ? '⚠ Desconto limitado pelo piso — valor travado no mínimo' : '✓ Desconto válido — não ultrapassou o piso'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: sis.valorFinal <= sis.f.piso ? '#d97706' : '#16a34a' }}>{R$(sis.valorFinal)}</div>
                </div>
              </div>
            </Card>

            {/* 5. Resultado + Governança */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <Card>
                <SecTitle n={5} title="Resultado — análise financeira" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '.75rem' }}>
                  <KV label="Valor/aluno/ano" value={R$(sis.valorFinal)} color="#4A7FDB" big />
                  <KV label="Valor/aluno/mês" value={R$(sis.valorFinal / 12)} sub="÷ 12 meses" />
                  <KV label="Valor anual total" value={R$(sis.anual)} sub={`${alunos} alunos × ${R$(sis.valorFinal)}`} />
                  <KV label="Custo livro/aluno/ano" value={R$(sis.livroAno)} sub={`R$${sp.livroMes}/mês × 12`} />
                  <KV label="Custo operacional (70%)" value={R$(sis.custo)} sub="estimativa custo total" color="#dc2626" />
                  <KV label="Resultado líquido (30%)" value={R$(sis.liquido)} sub="margem estimada" color="#16a34a" />
                </div>
                <Nota t={`Custo do livro ${R$(sis.livroAno)}/aluno/ano incluído na margem. Piso ${R$(sis.f.piso)} garante cobertura mínima.`} />
              </Card>

              <Card>
                <SecTitle n={6} title="Governança do desconto" />
                <div style={{ background: govBg(sis.gov.status), border: `1.5px solid ${govBorder(sis.gov.status)}`, borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '.85rem' }}>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: govClr(sis.gov.status), marginBottom: '.3rem' }}>
                    {desconto === 0 ? '— Sem desconto' : `Desconto ${desconto}%`}
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: govClr(sis.gov.status) }}>{sis.gov.label}</div>
                </div>
                {[
                  { range: '0%', label: 'Sem desconto', s: 'ok', ativo: desconto === 0 },
                  { range: '1–5%', label: 'Comercial (autônomo)', s: 'ok', ativo: desconto > 0 && desconto <= 5 },
                  { range: '6–10%', label: 'Gerência — Renato', s: 'warn', ativo: desconto > 5 && desconto <= 10 },
                  { range: '>10%', label: 'Diretoria — Dênis', s: 'error', ativo: desconto > 10 },
                ].map(r => (
                  <div key={r.range} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.45rem .7rem', borderRadius: 7, background: r.ativo ? govBg(r.s) : '#f8fafc', border: `1px solid ${r.ativo ? govBorder(r.s) : '#e2e8f0'}`, marginBottom: '.35rem' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: govClr(r.s), flexShrink: 0 }} />
                    <div style={{ fontSize: '.72rem', fontFamily: 'var(--font-inter,sans-serif)', flex: 1 }}><strong style={{ fontFamily: 'var(--font-montserrat,sans-serif)' }}>{r.range}</strong> · {r.label}</div>
                    {r.ativo && <span style={{ fontSize: '.6rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: govClr(r.s) }}>← atual</span>}
                  </div>
                ))}
              </Card>
            </div>

            {/* 7. Parcelamento */}
            <Card>
              <SecTitle n={7} title="Painel de parcelamento — 4x a 12x" />
              <Nota t={`Valor anual total: ${R$(sis.anual)} (${alunos} alunos × ${R$(sis.valorFinal)}/ano). Clique em uma linha para selecionar.`} />
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Parcelas', 'Parcela mensal', 'Por aluno/mês', 'Governança'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 9 }, (_, i) => i + 4).map(n => {
                      const pm = sis.anual / n; const pa = pm / alunos; const ativo = n === parcelas
                      return (
                        <tr key={n} onClick={() => setParcelas(n)} style={{ background: ativo ? '#eff6ff' : n % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', outline: ativo ? '2px solid #4A7FDB' : 'none', outlineOffset: -1 }}>
                          <td style={{ padding: '.7rem 1rem', fontWeight: 800, fontSize: '.88rem', color: ativo ? '#2563eb' : '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{ativo ? '▶ ' : ''}{n}x</td>
                          <td style={{ padding: '.7rem 1rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: ativo ? '#2563eb' : '#0f172a' }}>{R$(pm)}</td>
                          <td style={{ padding: '.7rem 1rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#475569' }}>{R$(pa)}</td>
                          <td style={{ padding: '.7rem 1rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {desconto === 0 ? '— Livre' : desconto <= 5 ? 'Comercial' : desconto <= 10 ? 'Gerência — Renato' : 'Diretoria — Dênis'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '.65rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                Selecionado: <strong style={{ color: '#2563eb' }}>{parcelas}x de {R$(sis.anual / parcelas)}</strong> · por aluno/mês: <strong style={{ color: '#2563eb' }}>{R$(sis.anual / parcelas / alunos)}</strong>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: COMODATO
            ══════════════════════════════════════════════════════ */}
        {tab === 'comodato' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1.1rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#5FE3D0', marginBottom: '.3rem' }}>Comodato de equipamentos — Comodato_final</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.4rem' }}>Todos os preços, quantidades e taxas são editáveis</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
                Edite diretamente nas células da tabela. Qtd. de alunos e parcelas/anos compartilhados com a aba Sistema.
              </div>
            </div>

            {/* 1. Parâmetros */}
            <Card>
              <SecTitle n={1} title="Parâmetros do comodato" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                <div>
                  <label style={LBL}>Nº de alunos</label>
                  <input type="number" min={1} value={alunos} onChange={e => setAlunos(+e.target.value || 1)} style={INP} />
                  <div style={NOTA}>≤100 → 48 parcelas · 101–300 → 36x · 301–500 → 24x · 500+ → 12x</div>
                </div>
                <div>
                  <label style={LBL}>Alunos na maior sala</label>
                  <input type="number" min={2} max={60} value={maiorSala} onChange={e => setMaiorSala(+e.target.value || 20)} style={INP} />
                  <div style={NOTA}>Define notebooks: ⌈{maiorSala} ÷ 2⌉ = {com.qtdNB} unidades. Padrão: 20 alunos.</div>
                </div>
                <div>
                  <label style={LBL}>Anos de contrato (= parcelas sistema)</label>
                  <input type="number" min={1} max={12} value={parcelas} onChange={e => setParcelas(Math.min(12, Math.max(1, +e.target.value || 4)))} style={INP} />
                  <div style={NOTA}>Usado para calcular manutenção total ao longo do contrato.</div>
                </div>
              </div>

              {/* Derivados */}
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
                {[
                  { label: 'Parcelas comodato', value: `${com.parcelas}x`, sub: com.faixaLabel, color: '#4A7FDB' },
                  { label: 'Notebooks (⌈sala÷2⌉)', value: String(com.qtdNB), sub: `⌈${maiorSala} ÷ 2⌉`, color: '#0f172a' },
                  { label: 'Taxa manutenção', value: pct(com.txMan), sub: 'sobre preços unitários × anos', color: '#d97706' },
                  { label: 'Taxa admin', value: pct(com.txAdmin), sub: 'sobre equip+manut × anos', color: '#7c3aed' },
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
                  ↺ Restaurar padrão
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
                    {/* Linha manutenção — calculada */}
                    <tr style={{ background: '#fef9ec', borderBottom: '1px solid #fde68a', borderTop: '2px solid #fde68a' }}>
                      <td style={{ padding: '.6rem .65rem', fontWeight: 700, fontSize: '.82rem', color: '#92400e', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        Manutenção* <span style={{ fontSize: '.6rem', background: '#fde68a', color: '#92400e', padding: '.1rem .35rem', borderRadius: 99, marginLeft: '.3rem' }}>calculada</span>
                      </td>
                      <td style={{ padding: '.6rem .65rem', textAlign: 'center', color: '#92400e', fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.82rem' }}>1</td>
                      <td style={{ padding: '.6rem .65rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem', fontWeight: 700, color: '#92400e' }}>{R$(com.C12)}</td>
                      <td style={{ padding: '.6rem .65rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>{R$(com.C12)}</td>
                      <td style={{ padding: '.6rem .65rem', fontSize: '.65rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {pct(com.txMan)} × {R$(com.sumUnit)} × {parcelas} anos
                      </td>
                    </tr>
                    {/* Total */}
                    <tr style={{ background: '#0f172a' }}>
                      <td colSpan={3} style={{ padding: '.85rem 1rem', fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 700, color: '#4A7FDB' }}>TOTAL DO INVESTIMENTO (D14)</td>
                      <td style={{ padding: '.85rem 1rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{R$(com.D14)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <Nota t={`*Manutenção = ${pct(com.txMan)} × ${R$(com.sumUnit)} (soma preços unitários) × ${parcelas} anos = ${R$(com.C12)}`} />
                <Nota t={`Taxa admin (separada, não no total): ${pct(com.txAdmin)} × (${R$(com.sumUnit)} + ${R$(com.C12)}) × ${parcelas} anos = ${R$(com.C13)}`} />
              </div>
            </Card>

            {/* 3. Taxas por faixa — editáveis */}
            <Card>
              <SecTitle n={3} title="Taxas de manutenção e admin por faixa de parcelas (editáveis)" />
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Parcelas comodato', 'Faixa de alunos', 'Tx Manutenção (%)', 'Tx Admin (%)'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {cp.taxas.map((t, idx) => {
                    const faixa = t.parcelas === 48 ? 'Até 100 alunos' : t.parcelas === 36 ? '101–300 alunos' : t.parcelas === 24 ? '301–500 alunos' : 'Acima de 500 alunos'
                    const ativo = t.parcelas === com.parcelas
                    return (
                      <tr key={idx} style={{ background: ativo ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9', outline: ativo ? '2px solid #4A7FDB' : 'none', outlineOffset: -1 }}>
                        <td style={{ padding: '.6rem .85rem', fontWeight: 700, fontSize: '.88rem', color: ativo ? '#2563eb' : '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                          {ativo ? '▶ ' : ''}{t.parcelas}x
                        </td>
                        <td style={{ padding: '.6rem .85rem', fontSize: '.82rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{faixa}</td>
                        <td style={{ padding: '.5rem .85rem', minWidth: 120 }}>
                          <InlineNum value={+(t.txMan * 100).toFixed(1)} onChange={v => updTaxa(idx, 'txMan', v / 100)} suffix="%" min={0} step={1} />
                        </td>
                        <td style={{ padding: '.5rem .85rem', minWidth: 120 }}>
                          <InlineNum value={+(t.txAdmin * 100).toFixed(1)} onChange={v => updTaxa(idx, 'txAdmin', v / 100)} suffix="%" min={0} step={1} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '.65rem' }}>
                <Nota t="Taxas são aplicadas sobre a soma dos preços UNITÁRIOS × anos de contrato. A linha ▶ é a faixa ativa com base no número de alunos." />
              </div>
              <div style={{ marginTop: '.5rem' }}>
                <button onClick={() => setCp(DEFAULT_COM)} style={{ padding: '.4rem .9rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#475569' }}>
                  ↺ Restaurar taxas padrão
                </button>
              </div>
            </Card>

            {/* 4. Resultado Comodato */}
            <Card>
              <SecTitle n={4} title="Resultado — comodato" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '.75rem' }}>
                <KV label="Total do investimento" value={R$(com.D14)} sub="equipamentos + manutenção" big />
                <KV label="Parcela mensal" value={R$(com.parcelaMensal)} sub={`${R$(com.D14)} ÷ ${com.parcelas} parcelas`} color="#4A7FDB" big />
                <KV label="Por aluno / mês" value={R$(com.valorPorAlunoMes)} sub={`${R$(com.parcelaMensal)} ÷ ${alunos} alunos`} color="#7c3aed" big />
              </div>
              <Nota t={`${R$(com.D14)} ÷ ${com.parcelas} parcelas = ${R$(com.parcelaMensal)}/mês · Por aluno: ${R$(com.parcelaMensal)} ÷ ${alunos} alunos = ${R$(com.valorPorAlunoMes)}/aluno/mês`} />
            </Card>

            {/* 5. Resumo Combinado */}
            <Card style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#5FE3D0', marginBottom: '.3rem' }}>Resumo combinado — sistema + comodato</div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>O que a escola paga por aluno mensalmente</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden' }}>
                {[
                  { label: 'Sistema We Make', value: R$(alunoMesSis), sub: `${R$(sis.valorFinal)}/ano ÷ 12`, color: '#4A7FDB' },
                  { label: 'Comodato Equip.', value: R$(com.valorPorAlunoMes), sub: `${R$(com.parcelaMensal)}/mês ÷ ${alunos} al.`, color: '#5FE3D0' },
                  { label: 'Total / aluno / mês', value: R$(totalAluMes), sub: `${R$(totalAluMes * 12)}/aluno/ano`, color: '#fff', big: true },
                  { label: 'Parcela escola / mês', value: R$(parcelaTotal), sub: `sistema ${parcelas}x + comodato ${com.parcelas}x`, color: '#f59e0b' },
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
                Comodato: {R$(com.D14)} ÷ {com.parcelas}x ÷ {alunos} al. = {R$(com.valorPorAlunoMes)}/al./mês &nbsp;·&nbsp;
                Total: {R$(totalAluMes)}/al./mês · {R$(totalAluMes * 12)}/al./ano
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: ESKOLARE
            ══════════════════════════════════════════════════════ */}
        {tab === 'eskolare' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1.1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.35rem' }}>Lógica de cálculo</div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.5rem' }}>Preço = custo + comissão + taxas Eskolare + manutenção rateada</div>
                <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Manutenção da loja (<strong style={{ color: '#4A7FDB' }}>R${MANUT_TOTAL}</strong> fixo · {MANUT_MESES} meses) dividida pelos alunos totais.
                </div>
              </div>
              <div style={{ background: 'rgba(74,127,219,.12)', border: '1px solid rgba(74,127,219,.25)', borderRadius: 10, padding: '1rem 1.25rem', minWidth: 190 }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#4A7FDB', marginBottom: '.6rem' }}>Manutenção da loja</div>
                {[['R$70/mês', '3 meses'], ['Total fixo', 'R$210'], ['Alunos', `${etotal || '?'}`], ['Por aluno', etotal > 0 ? R$(MANUT_TOTAL / etotal) : '—']].map(([l, v]) => (
                  <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '.2rem 0', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: '.75rem' }}>
                    <span style={{ color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)' }}>{l}</span>
                    <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a', marginBottom: '1rem' }}>1. Segmentos ativos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {eseg.map(s => (
                  <button key={s.id} onClick={() => eupd(s.id, 'ativo', !s.ativo)} style={{ padding: '6px 16px', borderRadius: 9999, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', background: s.ativo ? '#0f172a' : '#f1f5f9', color: s.ativo ? '#fff' : '#64748b', border: `1.5px solid ${s.ativo ? '#0f172a' : '#e2e8f0'}` }}>
                    {s.ativo ? '✓ ' : ''}{s.label}
                  </button>
                ))}
              </div>
              {etotal > 0 && <div style={{ marginTop: '.75rem', fontSize: '.75rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>Total: <strong>{etotal}</strong> alunos · Manutenção/aluno: <strong style={{ color: '#4A7FDB' }}>{R$(MANUT_TOTAL / etotal)}</strong></div>}
            </Card>

            {eativos.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a', marginBottom: '1rem' }}>2. Parâmetros por segmento</div>
                {eativos.map((s, idx) => {
                  const ip = idx === 0; const herd = !ip && s.igual; const ref = herd && eprim ? eprim : s
                  return (
                    <div key={s.id} style={{ background: '#fff', border: `1.5px solid ${herd ? '#e2e8f0' : '#4A7FDB'}`, borderRadius: 14, marginBottom: '1rem', overflow: 'hidden', opacity: herd ? .75 : 1 }}>
                      <div style={{ background: herd ? '#fafafa' : '#0f172a', padding: '.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: herd ? '#e2e8f0' : '#4A7FDB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{idx + 1}</div>
                          <span style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.82rem', fontWeight: 800, color: herd ? '#475569' : '#fff' }}>{s.label}</span>
                          {herd && <span style={{ fontSize: '.65rem', background: '#dbeafe', color: '#1d4ed8', padding: '.15rem .5rem', borderRadius: 99, fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>Mesmo que {eprim?.label}</span>}
                        </div>
                        {!ip && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                            <span style={{ fontSize: '.72rem', color: herd ? '#475569' : 'rgba(255,255,255,.6)', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Mesmo valor</span>
                            <div onClick={() => eupd(s.id, 'igual', !s.igual)} style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: s.igual ? '#4A7FDB' : '#cbd5e1', position: 'relative', transition: 'background .2s' }}>
                              <div style={{ position: 'absolute', top: 2, left: s.igual ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                            </div>
                          </label>
                        )}
                      </div>
                      {!herd ? (
                        <div style={{ padding: '1.1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                          <div>
                            <label style={LBL}>Custo do Livro (R$)</label>
                            <input type="number" min={0} step={0.01} value={s.custo} onChange={e => eupd(s.id, 'custo', parseFloat(e.target.value) || 0)} style={INP} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                              <label style={{ ...LBL, marginBottom: 0 }}>Comissão</label>
                              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 7, padding: 2, gap: 1 }}>
                                {[{ v: 'pct', l: '%' }, { v: 'abs', l: 'R$' }].map(t => (
                                  <button key={t.v} type="button" onClick={() => eupd(s.id, 'ct', t.v)} style={{ padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: '.68rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)', background: s.ct === t.v ? '#4A7FDB' : 'transparent', color: s.ct === t.v ? '#fff' : '#64748b' }}>{t.l}</button>
                                ))}
                              </div>
                            </div>
                            {s.ct === 'pct'
                              ? <div style={{ position: 'relative' }}><input type="number" min={0} max={100} step={0.1} value={s.cp} onChange={e => eupd(s.id, 'cp', parseFloat(e.target.value) || 0)} style={{ ...INP, paddingRight: '2.5rem' }} /><span style={{ position: 'absolute', right: '.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.85rem', color: '#94a3b8', fontWeight: 700, pointerEvents: 'none' }}>%</span></div>
                              : <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.78rem', color: '#94a3b8', fontWeight: 700, pointerEvents: 'none' }}>R$</span><input type="number" min={0} step={0.01} value={s.ca} onChange={e => eupd(s.id, 'ca', parseFloat(e.target.value) || 0)} style={{ ...INP, paddingLeft: '2.25rem' }} /></div>}
                          </div>
                          <div>
                            <label style={LBL}>Qtd. Alunos</label>
                            <input type="number" min={1} value={s.qa} onChange={e => eupd(s.id, 'qa', parseInt(e.target.value) || 1)} style={{ ...INP, textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700 }} />
                          </div>
                          <div>
                            <label style={LBL}>Parcelas</label>
                            <select value={s.parc} onChange={e => eupd(s.id, 'parc', parseInt(e.target.value))} style={INP}>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x`}</option>)}
                            </select>
                          </div>
                        </div>
                      ) : eprim && (
                        <div style={{ padding: '.6rem 1.25rem', display: 'flex', gap: '1.5rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                          <span>Custo: <strong>{R$(eprim.custo)}</strong></span>
                          <span>Comissão: <strong>{eprim.ct === 'pct' ? `${eprim.cp}%` : R$(eprim.ca)}</strong></span>
                          <span>Alunos: <strong>{eprim.qa}</strong></span>
                          <span>Parcelas: <strong>{eprim.parc === 1 ? 'À vista' : `${eprim.parc}x`}</strong></span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {eativos.length > 0 && (
              <button onClick={ecalcular} style={{ width: '100%', maxWidth: 400, padding: '.9rem 2rem', background: 'linear-gradient(135deg, #4A7FDB, #2563b8)', color: '#fff', fontWeight: 800, fontSize: '1rem', border: 'none', borderRadius: 9999, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 6px 20px rgba(74,127,219,.4)', display: 'block', marginBottom: '2rem' }}>
                Calcular Preços por Segmento →
              </button>
            )}

            {efeito && Object.keys(ecalc).length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a', marginBottom: '1.25rem' }}>3. Resultados por segmento</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.1rem' }}>
                  {eativos.map(s => {
                    const r = ecalc[s.id]; if (!r) return null
                    const ref = s.igual && eprim ? eprim : s
                    return (
                      <div key={s.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: '4px solid #4A7FDB', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,23,42,.08)' }}>
                        <div style={{ background: '#0f172a', padding: '1rem 1.25rem' }}>
                          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.2rem' }}>Segmento</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{s.label}</div>
                          <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', marginTop: '.15rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{s.igual && eprim ? eprim.qa : s.qa} alunos · manut: {R$(r.mau)}/aluno</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
                          {[
                            { label: 'Custo Aquisição', value: R$(r.liq - r.com), sub: 'escola paga', bg: '#f8fafc' },
                            { label: 'Comissão', value: R$(r.com), sub: ref.ct === 'pct' ? `${ref.cp}%` : 'fixo', bg: '#f5f3ff' },
                            { label: 'Manutenção', value: R$(r.mau), sub: 'rateada', bg: '#eff6ff' },
                            { label: 'Preço ao Pai', value: R$(r.pr), sub: ref.parc === 1 ? 'à vista' : `${ref.parc}x de ${R$(r.pv)}`, bg: '#fffbeb', big: true },
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
                            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>{R$(r.lr)}</div>
                          </div>
                          {r.ok
                            ? <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '.25rem .75rem', borderRadius: 99, fontSize: '.65rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>✓ Válido</span>
                            : <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '.25rem .75rem', borderRadius: 99, fontSize: '.65rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>⚠ Parcela &lt; R$30</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {eativos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', color: '#0f172a', marginBottom: '.4rem' }}>Selecione pelo menos um segmento</h3>
                <p style={{ fontSize: '.85rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Clique nos botões acima para ativar os segmentos.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
