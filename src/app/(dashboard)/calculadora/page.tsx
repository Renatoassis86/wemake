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
interface SisParams {
  livroMes: number; teto: number; piso: number; ticketMax: number
  wEscala: number; wTicket: number; wCompl: number; wFid: number
  alunosMin: number; alunosMax: number
}
interface LeasingParams {
  i: number          // taxa mensal leasing (default 0.022 = 2.2%)
  ipca: number       // IPCA anual estimado (default 0.055 = 5.5%)
  duracaoMeses: number  // duração total contrato em meses (default 60 = 5 anos)
}
interface EquipItem { nome: string; qty: number; unit: number; fixedQty: boolean; nota?: string }
interface ComParams {
  taxas: { parcelas: number; txMan: number; txAdmin: number }[]
}

// ── Valores padrão ────────────────────────────────────────────────
const DEFAULT_SIS: SisParams = {
  livroMes: 16.50, teto: 420, piso: 280, ticketMax: 1500,
  wEscala: 0.35, wTicket: 0.30, wCompl: 0.20, wFid: 0.15,
  alunosMin: 1, alunosMax: 800,
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

// Taxas padrão por faixa de parcelas
const DEFAULT_COM: ComParams = {
  taxas: [
    { parcelas: 48, txMan: 0.25, txAdmin: 0.25 },
    { parcelas: 36, txMan: 0.20, txAdmin: 0.20 },
    { parcelas: 24, txMan: 0.15, txAdmin: 0.15 },
    { parcelas: 12, txMan: 0.10, txAdmin: 0.10 },
  ],
}

const DEFAULT_LEASING: LeasingParams = {
  i: 0.022, ipca: 0.055, duracaoMeses: 60,
}

// ══════════════════════════════════════════════════════════════════
// FUNÇÕES DE CÁLCULO (puras — recebem tudo como parâmetro)
// ══════════════════════════════════════════════════════════════════
function calcSistema(
  alunos: number, ticket: number, segmentos: number,
  altaCompl: boolean, situacao: string, desconto: number,
  p: SisParams
) {
  const scaleRange = (p.alunosMax - p.alunosMin) || 1
  const s1 = Math.max(0, Math.min(1, 1 - (alunos - p.alunosMin) / scaleRange))
  const s2 = Math.min(1, ticket / p.ticketMax)
  const s3 = (segmentos === 3 || altaCompl) ? 1 : segmentos === 2 ? 0.5 : 0
  const s4 = situacao === 'Renovação 2º ciclo+' ? 0.4 : situacao === 'Renovação 1º ciclo' ? 0.7 : 1.0

  const scoreFinal = p.wEscala * s1 + p.wTicket * s2 + p.wCompl * s3 + p.wFid * s4
  const amplitude  = p.teto - p.piso
  const valorBruto = p.piso + amplitude * scoreFinal
  const valorDesc  = valorBruto * (1 - desconto / 100)
  const valorFinal = Math.max(p.piso, valorDesc)
  const anual      = valorFinal * alunos

  const gov = desconto === 0 ? { label: '— Sem desconto', status: 'ok' as const }
    : desconto <= 5  ? { label: 'Comercial (autônomo)', status: 'ok' as const }
    : desconto <= 10 ? { label: 'Gerência — Renato', status: 'warn' as const }
    : { label: 'Diretoria — Dênis', status: 'error' as const }

  return {
    s1, s2, s3, s4, scoreFinal, amplitude,
    valorBruto, valorDesc, valorFinal, anual,
    custo: anual * 0.70, liquido: anual * 0.30,
    gov,
    descMax: valorBruto > p.piso ? (1 - p.piso / valorBruto) * 100 : 0,
    ticketLabel: ticket < 400 ? 'Popular' : ticket <= 800 ? 'Média-baixa' : ticket <= 1500 ? 'Padrão' : 'Premium',
    livroAno: p.livroMes * 12,
  }
}

function calcLeasing(
  alunos: number, maiorSala: number,
  equip: EquipItem[], cp: ComParams, lp: LeasingParams,
  anualCurriculo: number
) {
  const qtdNB      = Math.ceil(maiorSala / 2)
  const comParcelas = alunos <= 100 ? 48 : alunos <= 300 ? 36 : alunos <= 500 ? 24 : 12
  const faixaLabel  = alunos <= 100 ? 'Até 100 al.' : alunos <= 300 ? '101–300 al.' : alunos <= 500 ? '301–500 al.' : 'Acima 500 al.'

  const taxaRow = cp.taxas.find(t => t.parcelas === comParcelas) ?? cp.taxas[cp.taxas.length - 1]
  const txMan   = taxaRow.txMan
  const txAdmin = taxaRow.txAdmin

  const itens    = equip.map(e => ({ ...e, qtyReal: e.fixedQty ? qtdNB : e.qty, total: (e.fixedQty ? qtdNB : e.qty) * e.unit }))
  const sumEquip = itens.reduce((s, e) => s + e.total, 0)
  const sumUnit  = equip.reduce((s, e) => s + e.unit, 0)

  const anos  = lp.duracaoMeses / 12
  const C_man = txMan   * sumUnit * anos
  const C_adm = txAdmin * sumUnit * anos

  // PV = equipamentos + manutenção + admin
  const PV = sumEquip + C_man + C_adm

  // Fórmula PRICE: PMT = PV × [i×(1+i)^n ÷ ((1+i)^n − 1)]
  const i = lp.i
  const n = comParcelas
  const N = lp.duracaoMeses
  const factor = Math.pow(1 + i, n)
  const parcelaPrice = PV * (i * factor) / (factor - 1)

  const totalRecebido   = parcelaPrice * N
  const resultadoBruto  = totalRecebido - PV
  const retorno         = PV > 0 ? resultadoBruto / PV : 0
  const mesesMargem     = N - n
  const taxaEfetivAnual = Math.pow(1 + i, 12) - 1

  // Tabela anual: parcela currículo cresce por IPCA, comodato é fixo
  const anosContrato = Math.ceil(N / 12)
  const mensalCurriculo1 = anualCurriculo / 12
  const tabela = Array.from({ length: anosContrato }, (_, y) => {
    const fatorIpca      = Math.pow(1 + lp.ipca, y)
    const parcelaCurr    = mensalCurriculo1 * fatorIpca
    const totalEscola    = parcelaCurr + parcelaPrice
    const recCurr        = parcelaCurr * 12
    const recCom         = parcelaPrice * 12
    return { ano: y + 1, fatorIpca, parcelaCurr, parcelaComodato: parcelaPrice, totalEscola, recCurr, recCom, recTotal: recCurr + recCom }
  })

  return {
    qtdNB, comParcelas, faixaLabel, txMan, txAdmin,
    itens, sumEquip, sumUnit, C_man, C_adm, PV,
    i, n, N, factor,
    parcelaPrice, totalRecebido, resultadoBruto, retorno,
    mesesMargem, taxaEfetivAnual, tabela,
    // compat aliases used in combined view
    parcelaMensal: parcelaPrice,
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
  const [showSisAdv, setShowSisAdv] = useState(false)

  const updSp = (field: keyof SisParams, val: any) => setSp(p => ({ ...p, [field]: val }))

  // ── Parâmetros compartilhados sistema+comodato ─────────────────
  const [alunos,    setAlunos]    = useState(100)
  const [ticket,    setTicket]    = useState(700)
  const [segs,      setSegs]      = useState(2)
  const [altaCompl, setAltaCompl] = useState(false)
  const [situacao,  setSituacao]  = useState('Novo')
  const [desconto,  setDesconto]  = useState(0)
  const [parcelas,  setParcelas]  = useState(4)
  const [maiorSala, setMaiorSala] = useState(20)

  // ── Parâmetros de Leasing ──────────────────────────────────────
  const [lp, setLp] = useState<LeasingParams>(DEFAULT_LEASING)

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
    () => calcLeasing(alunos, maiorSala, equip, cp, lp, sis.anual),
    [alunos, maiorSala, equip, cp, lp, sis.anual]
  )

  // Com comodato ativo: currículo é sempre 12x (mensal) — regra de negócio
  const parcelasCurriculo = incluiComodato ? 12 : parcelas
  const alunoMesSis       = sis.valorFinal / 12
  const totalAluMes       = alunoMesSis + com.valorPorAlunoMes
  // Mensalidade escola = curriculo 12x + leasing mensal (base sempre mensal quando há leasing)
  const mensalidadeEscola = sis.anual / 12 + com.parcelaPrice
  // Parcela curriculo conforme regra ativa
  const parcelaCurriculo  = sis.anual / parcelasCurriculo

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
      <PageHeader title="Calculadora We Make" subtitle="Precificação por score + leasing de equipamentos — v6" />
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

            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1.1rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4A7FDB', marginBottom: '.3rem' }}>Lógica de precificação — Calculadora_v6 · Piso único + Leasing PRICE</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.4rem' }}>Valor = Piso + (Teto − Piso) × Score ponderado</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
                4 fatores (escala global, ticket, complexidade, fidelidade) geram score 0–1 que navega entre piso único e teto fixo. Escala global de {sp.alunosMin} a {sp.alunosMax} alunos. Todos os parâmetros são editáveis abaixo.
              </div>
            </div>

            {/* 1. Entradas principais */}
            <Card>
              <SecTitle n={1} title="Entradas principais" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                <div>
                  <label style={LBL}>Número de alunos</label>
                  <input type="number" min={1} value={alunos} onChange={e => setAlunos(+e.target.value || 1)} style={INP} />
                  <div style={NOTA}>Total de alunos We Make na escola. Escala global de {sp.alunosMin} a {sp.alunosMax} alunos.</div>
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
                  <div style={NOTA}>Frequência de pagamento do currículo. Independente do prazo do leasing (definido na aba Leasing).</div>
                </div>
              </div>
            </Card>

            {/* 2. Parâmetros avançados (editáveis) */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSisAdv ? '1rem' : 0 }}>
                <SecTitle n={2} title="Parâmetros e pesos (editáveis)" />
                <button onClick={() => setShowSisAdv(v => !v)} style={{ padding: '.4rem .9rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#475569' }}>
                  {showSisAdv ? 'Fechar' : 'Editar'}
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
                        { label: 'Teto único (R$/aluno/ano)', field: 'teto' as keyof SisParams, val: sp.teto, nota: 'Limite máximo absoluto', prefix: 'R$' },
                        { label: 'Piso único (R$/aluno/ano)', field: 'piso' as keyof SisParams, val: sp.piso, nota: 'Mínimo garantido — igual para todos', prefix: 'R$' },
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

                  {/* Escala global */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.65rem' }}>Escala global de alunos</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
                      <div>
                        <label style={LBL}>Alunos mín. referência</label>
                        <InlineNum value={sp.alunosMin} onChange={v => updSp('alunosMin', v)} min={1} step={1} />
                        <div style={NOTA}>Score escala = 1,000 neste mínimo (preço perto do teto)</div>
                      </div>
                      <div>
                        <label style={LBL}>Alunos máx. referência</label>
                        <InlineNum value={sp.alunosMax} onChange={v => updSp('alunosMax', v)} min={1} step={1} />
                        <div style={NOTA}>Score escala = 0,000 neste máximo (preço perto do piso)</div>
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
                        { label: 'Peso Escala (%)', field: 'wEscala' as keyof SisParams, val: sp.wEscala, nota: 'Nº de alunos — escala global' },
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

                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button onClick={() => setSp(DEFAULT_SIS)} style={{ padding: '.45rem 1rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#64748b' }}>Restaurar padrao</button>
                  </div>
                </div>
              )}
            </Card>

            {/* 3. Scores */}
            <Card>
              <SecTitle n={3} title="Scores dos fatores (0 a 1 cada)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

                {/* Score 1 — Escala */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Score 1 — Escala <span style={{ color: '#94a3b8' }}>({pct(sp.wEscala)})</span></div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: scoreClr(sis.s1) }}>{dec(sis.s1)}</div>
                    </div>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', border: `3px solid ${scoreClr(sis.s1)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.75rem', color: scoreClr(sis.s1), fontFamily: 'var(--font-montserrat,sans-serif)' }}>{pct(sis.s1)}</div>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: '.65rem' }}>
                    <div style={{ height: '100%', width: `${sis.s1 * 100}%`, background: scoreClr(sis.s1), borderRadius: 99, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: '.7rem', color: '#1e293b', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.5rem' }}>
                    <strong>Formula:</strong> 1 − ({alunos} − {sp.alunosMin}) ÷ ({sp.alunosMax} − {sp.alunosMin}) = <strong style={{ color: scoreClr(sis.s1) }}>{dec(sis.s1)}</strong>
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)', borderTop: '1px solid #e2e8f0', paddingTop: '.5rem' }}>
                    <strong>Regra (35% do score):</strong> Escala global única de {sp.alunosMin} a {sp.alunosMax} alunos. Escola menor = score maior = preço perto do teto. Escola maior = score menor = preço perto do piso (desconto por volume).<br />
                    <strong>Escala global:</strong> Score varia de 1,000 ({sp.alunosMin} aluno) a 0,000 ({sp.alunosMax} alunos).
                  </div>
                </div>

                {/* Score 2 — Ticket */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Score 2 — Ticket medio <span style={{ color: '#94a3b8' }}>({pct(sp.wTicket)})</span></div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: scoreClr(sis.s2) }}>{dec(sis.s2)}</div>
                    </div>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', border: `3px solid ${scoreClr(sis.s2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.75rem', color: scoreClr(sis.s2), fontFamily: 'var(--font-montserrat,sans-serif)' }}>{pct(sis.s2)}</div>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: '.65rem' }}>
                    <div style={{ height: '100%', width: `${sis.s2 * 100}%`, background: scoreClr(sis.s2), borderRadius: 99, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: '.7rem', color: '#1e293b', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.5rem' }}>
                    <strong>Formula:</strong> MIN(1 ; {R$(ticket)} / {R$(sp.ticketMax)}) = <strong style={{ color: scoreClr(sis.s2) }}>{dec(sis.s2)}</strong> — Perfil: <strong>{sis.ticketLabel}</strong>
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)', borderTop: '1px solid #e2e8f0', paddingTop: '.5rem' }}>
                    <strong>Regra (30% do score):</strong> Mensalidade que a escola cobra dos pais. Ticket maior = escola com maior capacidade de pagamento = score maior = preco proximo do TETO. Ticket acima de {R$(sp.ticketMax)} = score maximo (1,000).<br />
                    <strong>Perfis:</strong> Popular (&lt;R$400) · Media-baixa (R$400–R$800) · Padrao (R$800–{R$(sp.ticketMax)}) · Premium (&gt;{R$(sp.ticketMax)}).
                  </div>
                </div>

                {/* Score 3 — Complexidade */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Score 3 — Complexidade <span style={{ color: '#94a3b8' }}>({pct(sp.wCompl)})</span></div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: scoreClr(sis.s3) }}>{dec(sis.s3)}</div>
                    </div>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', border: `3px solid ${scoreClr(sis.s3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.75rem', color: scoreClr(sis.s3), fontFamily: 'var(--font-montserrat,sans-serif)' }}>{pct(sis.s3)}</div>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: '.65rem' }}>
                    <div style={{ height: '100%', width: `${sis.s3 * 100}%`, background: scoreClr(sis.s3), borderRadius: 99, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: '.7rem', color: '#1e293b', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.5rem' }}>
                    <strong>Formula:</strong> {segs === 3 || altaCompl ? '3 segmentos / alta complexidade = score 1,000 (maximo)' : segs === 2 ? '2 segmentos = score 0,500' : '1 segmento = score 0,000 (minimo)'}
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)', borderTop: '1px solid #e2e8f0', paddingTop: '.5rem' }}>
                    <strong>Regra (20% do score):</strong> Numero de ciclos escolares atendidos (ex: infantil, fundamental I, fundamental II). Mais segmentos = maior estrutura de entrega (mais formacao, visitas, materiais) = custo operacional maior = preco mais proximo do TETO.<br />
                    <strong>Escala:</strong> 1 seg = 0,000 · 2 seg = 0,500 · 3 seg = 1,000. "Alta complexidade: SIM" forca score 1,000 independente do numero de segmentos.
                  </div>
                </div>

                {/* Score 4 — Fidelidade */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Score 4 — Fidelidade <span style={{ color: '#94a3b8' }}>({pct(sp.wFid)})</span></div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: scoreClr(sis.s4) }}>{dec(sis.s4)}</div>
                    </div>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', border: `3px solid ${scoreClr(sis.s4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.75rem', color: scoreClr(sis.s4), fontFamily: 'var(--font-montserrat,sans-serif)' }}>{pct(sis.s4)}</div>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: '.65rem' }}>
                    <div style={{ height: '100%', width: `${sis.s4 * 100}%`, background: scoreClr(sis.s4), borderRadius: 99, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: '.7rem', color: '#1e293b', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.5rem' }}>
                    <strong>Formula:</strong> {situacao === 'Renovação 2º ciclo+' ? 'Renovacao 2º ciclo ou mais = score 0,400 (maior beneficio de fidelidade)' : situacao === 'Renovação 1º ciclo' ? 'Renovacao 1º ciclo = score 0,700 (beneficio moderado)' : 'Contrato novo = score 1,000 (sem beneficio de fidelidade)'}
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)', borderTop: '1px solid #e2e8f0', paddingTop: '.5rem' }}>
                    <strong>Regra (15% do score):</strong> Situacao do contrato com a escola. Renovacao = desconto implicito por lealdade — escola fiel paga menos que escola nova. Score menor = preco mais proximo do PISO. Quanto mais ciclos de renovacao, maior o beneficio.<br />
                    <strong>Escala:</strong> Novo = 1,000 (preco cheio) · Renovacao 1° ciclo = 0,700 · Renovacao 2° ciclo+ = 0,400 (preco mais baixo possivel dentro do piso unico).
                  </div>
                </div>
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
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.85rem', fontWeight: 800, color: '#5FE3D0' }}>{R$(sp.piso)} a {R$(sp.teto)}</div>
                  <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', marginTop: '.1rem', fontFamily: 'var(--font-inter,sans-serif)' }}>piso único {R$(sp.piso)}</div>
                </div>
              </div>
            </Card>

            {/* 4. Equação Central */}
            <Card>
              <SecTitle n={4} title="Equação central — memória de cálculo" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <KV label="(1) Piso único" value={R$(sp.piso)} sub={`Piso único: ${sp.alunosMin}–${sp.alunosMax} alunos`} />
                  <KV label="(2) Amplitude x Score" value={R$(sis.valorBruto - sp.piso)} sub={`(${R$(sp.teto)} - ${R$(sp.piso)}) x ${dec(sis.scoreFinal)}`} />
                  <KV label="(3) Valor bruto" value={R$(sis.valorBruto)} sub="Piso + amplitude x score" color="#4A7FDB" />
                </div>
                <Nota t={`${R$(sp.piso)} + (${R$(sp.teto)} − ${R$(sp.piso)}) × ${dec(sis.scoreFinal)} = ${R$(sis.valorBruto)}/aluno/ano`} />

                {desconto > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      <KV label="(4) Desconto aplicado" value={`-${desconto}%`} sub={`-${R$(sis.valorBruto * desconto / 100)}`} color="#dc2626" />
                      <KV label="(5) Valor com desconto" value={R$(sis.valorDesc)} sub="Antes da protecao do piso" />
                    </div>
                    <Nota t={`${R$(sis.valorBruto)} × (1 − ${desconto}%) = ${R$(sis.valorDesc)}. Desconto máximo sem furar o piso: ${sis.descMax.toFixed(1)}%.`} />
                  </>
                )}

                <div style={{ background: sis.valorFinal <= sp.piso ? '#fef3c7' : '#f0fdf4', border: `1.5px solid ${sis.valorFinal <= sp.piso ? '#fde68a' : '#86efac'}`, borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.3rem' }}>(6) Protecao piso — MAX(piso, valor_com_desconto)</div>
                    <div style={{ fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.75rem', color: '#475569', marginBottom: '.2rem' }}>
                      MAX({R$(sp.piso)}, {R$(sis.valorDesc)}) = <strong>{R$(sis.valorFinal)}</strong>
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {sis.valorFinal <= sp.piso ? 'Atencao: desconto limitado pelo piso — valor travado no minimo' : 'OK: desconto valido — nao ultrapassou o piso'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: sis.valorFinal <= sp.piso ? '#d97706' : '#16a34a' }}>{R$(sis.valorFinal)}</div>
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
                <Nota t={`Custo do livro ${R$(sis.livroAno)}/aluno/ano incluído na margem. Piso único ${R$(sp.piso)} garante cobertura mínima.`} />
              </Card>

              <Card>
                <SecTitle n={6} title="Governança do desconto" />
                <div style={{ background: govBg(sis.gov.status), border: `1.5px solid ${govBorder(sis.gov.status)}`, borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '.85rem' }}>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: govClr(sis.gov.status), marginBottom: '.3rem' }}>
                    {desconto === 0 ? 'Sem desconto' : `Desconto ${desconto}%`}
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
                    {r.ativo && <span style={{ fontSize: '.6rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: govClr(r.s) }}>atual</span>}
                  </div>
                ))}
              </Card>
            </div>

            {/* 7. Parcelamento */}
            <Card>
              <SecTitle n={7} title="Painel de parcelamento — 4x a 12x" />
              {incluiComodato ? (
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '.7rem 1rem', marginBottom: '.85rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                  <div style={{ fontSize: '.73rem', fontFamily: 'var(--font-inter,sans-serif)', color: '#1d4ed8', lineHeight: 1.4 }}>
                    <strong>Leasing ativo — curriculo fixado em 12x (mensal).</strong> O parcelamento do curriculo e sempre mensal quando ha leasing, independente da selecao abaixo.
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
                            {desconto === 0 ? 'Livre' : desconto <= 5 ? 'Comercial' : desconto <= 10 ? 'Gerencia — Renato' : 'Diretoria — Denis'}
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

            {/* 8. Fechamento do Orçamento */}
            <Card style={{ border: `2px solid ${incluiComodato ? '#4A7FDB' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0f172a', marginBottom: '.25rem' }}>Fechamento do Orcamento</div>
                  <div style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>Este orcamento inclui leasing de equipamentos?</div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {[
                    { v: false, l: 'Somente curriculo' },
                    { v: true,  l: 'Curriculo + Leasing' },
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

              {/* Resumo somente curriculo */}
              {!incluiComodato && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '.75rem' }}>
                    <div style={{ padding: '1rem 1.1rem', background: '#f8fafc' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Valor / aluno / ano</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#4A7FDB', lineHeight: 1 }}>{R$(sis.valorFinal)}</div>
                      <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>piso único {R$(sp.piso)}</div>
                    </div>
                    <div style={{ padding: '1rem 1.1rem', background: '#f8fafc' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Valor / aluno / mes</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{R$(sis.valorFinal / 12)}</div>
                      <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{R$(sis.valorFinal)}/ano ÷ 12</div>
                    </div>
                    <div style={{ padding: '1rem 1.1rem', background: '#f8fafc' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Parcela escola ({parcelasCurriculo}x)</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{R$(parcelaCurriculo)}</div>
                      <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{R$(sis.anual)}/ano ÷ {parcelasCurriculo}x</div>
                    </div>
                  </div>
                  <Nota t={`Somente curriculo — parcela ${parcelasCurriculo}x de ${R$(parcelaCurriculo)}. Sem leasing. Para incluir equipamentos, selecione "Curriculo + Leasing" acima.`} />
                </div>
              )}

              {/* Resumo curriculo + leasing */}
              {incluiComodato && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
                    {/* Curriculo */}
                    <div style={{ background: '#f8fafc', padding: '.85rem 1.1rem' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.5rem' }}>Curriculo (sistema)</div>
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
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Parcela Price ({com.comParcelas}x)</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>{R$(com.parcelaPrice)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Mensal / aluno</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>{R$(com.valorPorAlunoMes)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.58rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Faixa</div>
                          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>{com.faixaLabel}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total combinado */}
                  <div style={{ background: '#0f172a', borderRadius: 10, padding: '1.1rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px' }}>
                    <div style={{ padding: '.75rem 1rem' }}>
                      <div style={{ fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Total / aluno / mes</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{R$(totalAluMes)}</div>
                      <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.3)', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>curriculo {R$(alunoMesSis)} + leasing {R$(com.valorPorAlunoMes)}</div>
                    </div>
                    <div style={{ padding: '.75rem 1rem' }}>
                      <div style={{ fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Total / aluno / ano</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: '#5FE3D0', lineHeight: 1 }}>{R$(totalAluMes * 12)}</div>
                      <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.3)', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{R$(totalAluMes)}/mes x 12</div>
                    </div>
                    <div style={{ padding: '.75rem 1rem' }}>
                      <div style={{ fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Mensalidade escola (total)</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{R$(mensalidadeEscola)}</div>
                      <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.3)', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>curriculo 12x {R$(sis.anual/12)} + leasing {R$(com.parcelaPrice)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '.65rem' }}>
                    <Nota t={`Curriculo: ${alunos} al. x ${R$(sis.valorFinal)}/ano ÷ 12 = ${R$(alunoMesSis)}/al./mes. Leasing: ${R$(com.PV)} amortizado em ${com.comParcelas}x PRICE ÷ ${alunos} al. = ${R$(com.valorPorAlunoMes)}/al./mes. Total: ${R$(totalAluMes)}/al./mes.`} />
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

            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1.1rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#5FE3D0', marginBottom: '.3rem' }}>Leasing de equipamentos — Tabela PRICE + IPCA</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.4rem' }}>Todos os preços, quantidades e taxas são editáveis</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
                Parcela calculada por fórmula PRICE. Currículo reajustado por IPCA ao longo do contrato. Nº de alunos compartilhado com a aba Sistema.
              </div>
            </div>

            {/* 1. Parâmetros do leasing */}
            <Card>
              <SecTitle n={1} title="Parâmetros do leasing" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                <div>
                  <label style={LBL}>Nº de alunos</label>
                  <input type="number" min={1} value={alunos} onChange={e => setAlunos(+e.target.value || 1)} style={INP} />
                  <div style={NOTA}>Ate 100 alunos: 48 parcelas · 101-300: 36x · 301-500: 24x · acima de 500: 12x</div>
                </div>
                <div>
                  <label style={LBL}>Alunos na maior sala</label>
                  <input type="number" min={2} max={60} value={maiorSala} onChange={e => setMaiorSala(+e.target.value || 20)} style={INP} />
                  <div style={NOTA}>Define notebooks: ⌈{maiorSala} ÷ 2⌉ = {com.qtdNB} unidades. Padrão: 20 alunos.</div>
                </div>
                <div>
                  <label style={LBL}>Taxa mensal leasing i (%)</label>
                  <InlineNum value={+(lp.i * 100).toFixed(2)} onChange={v => setLp(p => ({ ...p, i: v / 100 }))} suffix="%" min={0} step={0.1} />
                  <div style={NOTA}>Taxa PRICE para amortização. Padrão 2,2% a.m.</div>
                </div>
                <div>
                  <label style={LBL}>IPCA anual estimado (%)</label>
                  <InlineNum value={+(lp.ipca * 100).toFixed(2)} onChange={v => setLp(p => ({ ...p, ipca: v / 100 }))} suffix="%" min={0} step={0.1} />
                  <div style={NOTA}>Reajuste anual do currículo. Padrão 5,5% a.a.</div>
                </div>
                <div>
                  <label style={LBL}>Duração contrato (meses)</label>
                  <input type="number" min={12} max={120} step={12} value={lp.duracaoMeses} onChange={e => setLp(p => ({ ...p, duracaoMeses: Math.max(12, +e.target.value || 60) }))} style={INP} />
                  <div style={NOTA}>Duração total do contrato. Padrão 60 meses (5 anos).</div>
                </div>
              </div>

              {/* Derivados */}
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
                {[
                  { label: 'PV (investimento total)', value: R$(com.PV), sub: 'equip + manut + admin', color: '#4A7FDB' },
                  { label: 'Parcelas amortização', value: `${com.comParcelas}x`, sub: com.faixaLabel, color: '#0f172a' },
                  { label: 'Notebooks (⌈sala÷2⌉)', value: String(com.qtdNB), sub: `⌈${maiorSala} ÷ 2⌉`, color: '#0f172a' },
                  { label: 'Duração total', value: `${lp.duracaoMeses} meses`, sub: `${lp.duracaoMeses / 12} anos`, color: '#7c3aed' },
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
                  Restaurar padrao
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
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Parcelas amort.', 'Faixa de alunos', 'Tx Manutenção (%)', 'Tx Admin (%)'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {cp.taxas.map((t, idx) => {
                    const faixa = t.parcelas === 48 ? 'Até 100 alunos' : t.parcelas === 36 ? '101–300 alunos' : t.parcelas === 24 ? '301–500 alunos' : 'Acima de 500 alunos'
                    const ativo = t.parcelas === com.comParcelas
                    return (
                      <tr key={idx} style={{ background: ativo ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9', outline: ativo ? '2px solid #4A7FDB' : 'none', outlineOffset: -1 }}>
                        <td style={{ padding: '.6rem .85rem', fontWeight: 700, fontSize: '.88rem', color: ativo ? '#2563eb' : '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                          {t.parcelas}x
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
              <div style={{ marginTop: '.65rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <Nota t={`Manutenção = ${pct(com.txMan)} × ${R$(com.sumUnit)} × ${lp.duracaoMeses / 12} anos = ${R$(com.C_man)}`} />
                <Nota t={`Admin = ${pct(com.txAdmin)} × ${R$(com.sumUnit)} × ${lp.duracaoMeses / 12} anos = ${R$(com.C_adm)}`} />
                <Nota t={`PV total = ${R$(com.sumEquip)} (equip.) + ${R$(com.C_man)} (manut.) + ${R$(com.C_adm)} (adm.) = ${R$(com.PV)}`} />
              </div>
              <div style={{ marginTop: '.5rem' }}>
                <button onClick={() => setCp(DEFAULT_COM)} style={{ padding: '.4rem .9rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#475569' }}>
                  Restaurar taxas padrao
                </button>
              </div>
            </Card>

            {/* 4. Cálculo Price e resultado */}
            <Card>
              <SecTitle n={4} title="Cálculo Price e resultado" />

              {/* Sub-section A — Fórmula Price */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.5rem' }}>
                  Fórmula Price — PMT = PV × [i×(1+i)^n ÷ ((1+i)^n−1)]
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.8rem', fontFamily: 'var(--font-inter,sans-serif)', color: '#1e293b', marginBottom: '.75rem', lineHeight: 1.7 }}>
                  {R$(com.PV)} × [{pct(com.i)}×{dec3(com.factor)} ÷ ({dec3(com.factor)}−1)] = <strong style={{ color: '#4A7FDB' }}>{R$(com.parcelaPrice)}/mês</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <KV label="PV (investimento total)" value={R$(com.PV)} sub="equip + manut + admin" big />
                  <KV label="Parcela Price (FIXA)" value={R$(com.parcelaPrice)} sub={`${R$(com.PV)} amortizado em ${com.n} meses a ${pct(com.i)}/mês`} color="#4A7FDB" big />
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
                    value={`${(com.retorno * 100).toFixed(1)}%`}
                    sub={`${(com.taxaEfetivAnual * 100).toFixed(2)}% a.a. efetivo`}
                    color={com.retorno > 0 ? '#7c3aed' : '#94a3b8'}
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
                  { label: 'Mensalidade escola', value: R$(mensalidadeEscola), sub: `curriculo 12x + leasing ${com.comParcelas}x`, color: '#f59e0b' },
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
                Leasing: {R$(com.PV)} ÷ {com.comParcelas}x PRICE ÷ {alunos} al. = {R$(com.valorPorAlunoMes)}/al./mês &nbsp;·&nbsp;
                Total: {R$(totalAluMes)}/al./mês · {R$(totalAluMes * 12)}/al./ano
              </div>
            </Card>
          </div>
        )}


      </div>
    </div>
  )
}
