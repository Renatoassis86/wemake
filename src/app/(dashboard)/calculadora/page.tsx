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
interface FaixaEscala {
  nome: string; min: number; max: number; s1: number; scoreCap: number
}
interface SisParams {
  livroMes: number; teto: number; piso: number; ticketMax: number
  wEscala: number; wTicket: number; wCompl: number; wFid: number
  faixas: FaixaEscala[]
}
interface LeasingParams {
  retornoAlvo: number    // 2.0 = lucro de 2×PV; total recebido = PV × (1 + retornoAlvo)
  ipca: number           // 0.055 = 5.5% annual IPCA
  duracaoMeses: number   // 60 = 5 anos
  txMan: number          // 0.25 = 25% maintenance rate
  txAdmin: number        // 0.25 = 25% admin rate
}
interface EquipItem { nome: string; qty: number; unit: number; fixedQty: boolean; nota?: string }

// ── Valores padrão ────────────────────────────────────────────────
const DEFAULT_SIS: SisParams = {
  livroMes: 16.67,  // ≈ R$200/ano
  teto: 420, piso: 260, ticketMax: 1500,
  // Escala 50%: volume é o fator dominante — mais alunos = menor preço
  // Ticket 20%, Complexidade 20%, Fidelidade 10%: calibram dentro do teto da faixa
  wEscala: 0.50, wTicket: 0.20, wCompl: 0.20, wFid: 0.10,
  faixas: [
    // scoreCap = teto máximo de score permitido para esta faixa (garante preço máximo por volume)
    { nome: 'Faixa 1', min:    1, max:  100, s1: 0.90, scoreCap: 1.00 }, // máx R$420
    { nome: 'Faixa 2', min:  101, max:  300, s1: 0.60, scoreCap: 0.85 }, // máx R$396
    { nome: 'Faixa 3', min:  301, max:  500, s1: 0.30, scoreCap: 0.60 }, // máx R$356
    { nome: 'Faixa 4', min:  501, max:  800, s1: 0.10, scoreCap: 0.40 }, // máx R$324
    { nome: 'Faixa 5', min:  801, max: 1200, s1: 0.00, scoreCap: 0.22 }, // máx R$295 (<R$300)
    { nome: 'Faixa 6', min: 1201, max: 9999, s1: 0.00, scoreCap: 0.15 }, // máx R$284 (perto do piso)
  ],
}

const DEFAULT_LEASING: LeasingParams = {
  retornoAlvo: 2.0,  // lucro = 2× PV (recupera PV + ganha 2×PV de lucro)
  ipca: 0.055,
  duracaoMeses: 60,
  txMan: 0.25,
  txAdmin: 0.25,
}

const DEFAULT_EQUIP: EquipItem[] = [
  { nome: 'Máquina digital',         qty: 1,  unit: 4280.00,  fixedQty: false },
  { nome: 'Máquina manual',          qty: 1,  unit: 237.40,   fixedQty: false },
  { nome: 'Ferramenta',              qty: 1,  unit: 1061.53,  fixedQty: false },
  { nome: 'Papelaria',               qty: 1,  unit: 430.76,   fixedQty: false },
  { nome: 'Organização',             qty: 1,  unit: 157.98,   fixedQty: false },
  { nome: 'Eletrônica',              qty: 1,  unit: 1983.82,  fixedQty: false },
  { nome: 'Informática (notebooks)', qty: 10, unit: 4000.00,  fixedQty: true, nota: 'Qtd calculada: ⌈maior sala ÷ 2⌉' },
  { nome: 'Mídias',                  qty: 1,  unit: 3800.00,  fixedQty: false },
  { nome: 'Segurança',               qty: 1,  unit: 119.70,   fixedQty: false },
  { nome: 'Seguro',                  qty: 10, unit: 2700.00,  fixedQty: true, nota: 'Qtd igual ao nº de notebooks' },
]

// ══════════════════════════════════════════════════════════════════
// FUNÇÕES DE CÁLCULO (puras — recebem tudo como parâmetro)
// ══════════════════════════════════════════════════════════════════
function calcSistema(
  alunos: number, ticket: number, segmentos: number,
  altaCompl: boolean, situacao: string, desconto: number,
  p: SisParams
) {
  // s1: stepped faixa-based escala score (more students = lower s1 = price closer to piso)
  const faixaEscala = p.faixas.find(f => alunos >= f.min && alunos <= f.max)
    ?? (alunos > p.faixas[p.faixas.length - 1].max ? p.faixas[p.faixas.length - 1] : p.faixas[0])
  const s1 = faixaEscala.s1

  const s2 = Math.min(1, ticket / p.ticketMax)
  const s3 = (segmentos === 3 || altaCompl) ? 1 : segmentos === 2 ? 0.5 : 0
  const s4 = situacao === 'Renovação 2º ciclo+' ? 0.4 : situacao === 'Renovação 1º ciclo' ? 0.7 : 1.0

  const scoreBruto = p.wEscala * s1 + p.wTicket * s2 + p.wCompl * s3 + p.wFid * s4
  // scoreCap: teto de score da faixa — garante que escolas grandes nunca ultrapassem o preço máximo da faixa
  const scoreFinal = Math.min(faixaEscala.scoreCap, scoreBruto)
  const capAtivo   = scoreBruto > faixaEscala.scoreCap
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
    s1, s2, s3, s4, scoreBruto, scoreFinal, capAtivo, amplitude,
    valorBruto, valorDesc, valorFinal, anual,
    custo: anual * 0.70, liquido: anual * 0.30,
    gov,
    descMax: valorBruto > p.piso ? (1 - p.piso / valorBruto) * 100 : 0,
    ticketLabel: ticket < 400 ? 'Popular' : ticket <= 800 ? 'Média-baixa' : ticket <= 1500 ? 'Padrão' : 'Premium',
    livroAno: p.livroMes * 12,
    faixaEscala,
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

  // Maintenance & admin applied on total equipment value (all items × quantities)
  const C_man = lp.txMan   * sumEquip * anos
  const C_adm = lp.txAdmin * sumEquip * anos
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
  const [showSisAdv, setShowSisAdv] = useState(false)

  const updSp = (field: keyof SisParams, val: any) => setSp(p => ({ ...p, [field]: val }))

  const updFaixa = (idx: number, field: keyof FaixaEscala, val: any) =>
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

  // ── Parâmetros de Leasing ──────────────────────────────────────
  const [lp, setLp] = useState<LeasingParams>(DEFAULT_LEASING)

  // ── Equipamentos do Comodato (todos editáveis) ─────────────────
  const [equip, setEquip] = useState<EquipItem[]>(DEFAULT_EQUIP)

  const updEquip = (idx: number, field: keyof EquipItem, val: any) =>
    setEquip(p => { const e = [...p]; e[idx] = { ...e[idx], [field]: val }; return e })

  // ── Cálculos ──────────────────────────────────────────────────
  const sis = useMemo(
    () => calcSistema(alunos, ticket, segs, altaCompl, situacao, desconto, sp),
    [alunos, ticket, segs, altaCompl, situacao, desconto, sp]
  )
  const com = useMemo(
    () => calcLeasing(alunos, maiorSala, equip, lp, sis.anual),
    [alunos, maiorSala, equip, lp, sis.anual]
  )

  // Com comodato ativo: currículo é sempre 12x (mensal) — regra de negócio
  const parcelasCurriculo = incluiComodato ? 12 : parcelas
  const alunoMesSis       = sis.valorFinal / 12
  const totalAluMes       = alunoMesSis + com.valorPorAlunoMes
  const mensalidadeEscola = sis.anual / 12 + com.parcelaPrice
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
      <PageHeader title="Calculadora We Make" subtitle="Precificação por score ponderado + faixas de volume + leasing garantido — v7" />
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
                Lógica de precificação — Calculadora_v7 · Score ponderado + Faixas de volume + Leasing retorno garantido
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '.4rem' }}>
                Valor = Piso + (Teto − Piso) × Score ponderado
              </div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
                4 fatores (escala por faixas, ticket, complexidade, fidelidade) geram score 0–1 que navega entre piso único e teto fixo. Escala por faixas discretas de volume. Todos os parâmetros são editáveis abaixo.
              </div>
            </div>

            {/* 1. Entradas principais */}
            <Card>
              <SecTitle n={1} title="Entradas principais" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                <div>
                  <label style={LBL}>Número de alunos</label>
                  <input type="number" min={1} value={alunos} onChange={e => setAlunos(+e.target.value || 1)} style={INP} />
                  <div style={NOTA}>Total de alunos We Make na escola. Determina qual faixa de escala é aplicada (score s1 fixo por faixa).</div>
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

                  {/* Valores gerais */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.65rem' }}>Valores gerais</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
                      {[
                        { label: 'Livro/aluno/mês (R$)', field: 'livroMes' as keyof SisParams, val: sp.livroMes, nota: 'Custo fixo do material didático ≈ R$200/ano', prefix: 'R$' },
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

                  {/* Faixas de escala */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.65rem' }}>
                      Faixas de escala — score fixo (s1) + teto de score por faixa (garante preço máximo por volume)
                    </div>
                    <div style={{ overflowX: 'auto', marginBottom: '.65rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Faixa', 'Alunos de', 'Alunos até', 'Score s1 (fixo)', 'Teto score (cap)', 'Preço máx', 'Ativa?'].map(h => (
                              <th key={h} style={th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sp.faixas.map((f, idx) => {
                            const isAtiva = sis.faixaEscala.nome === f.nome
                            const precoMax = sp.piso + (sp.teto - sp.piso) * f.scoreCap
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
                                <td style={{ padding: '.5rem .65rem', minWidth: 80 }}>
                                  <InlineNum value={f.min} onChange={v => updFaixa(idx, 'min', Math.round(v))} min={1} step={1} />
                                </td>
                                <td style={{ padding: '.5rem .65rem', minWidth: 80 }}>
                                  <InlineNum value={f.max} onChange={v => updFaixa(idx, 'max', Math.round(v))} min={1} step={1} />
                                </td>
                                <td style={{ padding: '.5rem .65rem', minWidth: 110 }}>
                                  <InlineNum value={+f.s1.toFixed(2)} onChange={v => updFaixa(idx, 's1', Math.min(1, Math.max(0, v)))} min={0} step={0.05} style={{ maxWidth: 100 }} />
                                </td>
                                <td style={{ padding: '.5rem .65rem', minWidth: 120 }}>
                                  <InlineNum value={+f.scoreCap.toFixed(2)} onChange={v => updFaixa(idx, 'scoreCap', Math.min(1, Math.max(0, v)))} min={0} step={0.01} style={{ maxWidth: 100 }} />
                                </td>
                                <td style={{ padding: '.5rem .65rem', minWidth: 90, fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem', fontWeight: 700, color: precoMax < 300 ? '#16a34a' : '#0f172a' }}>
                                  {R$(precoMax)}
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
                    <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.55 }}>
                      <strong>s1:</strong> score de escala da faixa (contribui 50% do score bruto). <strong>Teto (cap):</strong> limite máximo de score que esta faixa permite — garante que o preço nunca ultrapasse o valor na coluna "Preço máx" independente dos outros fatores. Escolas maiores = teto menor = preço obrigatoriamente menor.
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
                        { label: 'Peso Escala (%)', field: 'wEscala' as keyof SisParams, val: sp.wEscala, nota: 'Volume de alunos — faixas discretas' },
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
                    <button onClick={() => setSp(DEFAULT_SIS)} style={{ padding: '.45rem 1rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#64748b' }}>Restaurar padrão</button>
                  </div>
                </div>
              )}
            </Card>

            {/* 3. Scores */}
            <Card>
              <SecTitle n={3} title="Scores dos fatores (0 a 1 cada)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

                {/* Score 1 — Escala (faixa-based) */}
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
                    <strong>Faixa ativa:</strong> {sis.faixaEscala.nome} ({sis.faixaEscala.min}–{sis.faixaEscala.max} al.) — Score s1 fixo para esta faixa: <strong style={{ color: scoreClr(sis.s1) }}>{dec(sis.s1)}</strong>
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)', borderTop: '1px solid #e2e8f0', paddingTop: '.5rem' }}>
                    <strong>Regra ({pct(sp.wEscala)} do score bruto):</strong> Fator dominante. Escolas maiores caem para faixas com s1 menor E com teto de score menor — dupla pressão para baixo. Score menor = preço perto do piso ({R$(sp.piso)}).
                  </div>
                </div>

                {/* Score 2 — Ticket */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Score 2 — Ticket médio <span style={{ color: '#94a3b8' }}>({pct(sp.wTicket)})</span></div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: scoreClr(sis.s2) }}>{dec(sis.s2)}</div>
                    </div>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', border: `3px solid ${scoreClr(sis.s2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.75rem', color: scoreClr(sis.s2), fontFamily: 'var(--font-montserrat,sans-serif)' }}>{pct(sis.s2)}</div>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: '.65rem' }}>
                    <div style={{ height: '100%', width: `${sis.s2 * 100}%`, background: scoreClr(sis.s2), borderRadius: 99, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: '.7rem', color: '#1e293b', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.5rem' }}>
                    <strong>Fórmula:</strong> MIN(1 ; {R$(ticket)} / {R$(sp.ticketMax)}) = <strong style={{ color: scoreClr(sis.s2) }}>{dec(sis.s2)}</strong> — Perfil: <strong>{sis.ticketLabel}</strong>
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)', borderTop: '1px solid #e2e8f0', paddingTop: '.5rem' }}>
                    <strong>Regra ({pct(sp.wTicket)} do score bruto):</strong> Mensalidade que a escola cobra dos pais. Ticket maior = escola com maior capacidade de pagamento = score maior = preço próximo do TETO. Ticket acima de {R$(sp.ticketMax)} = score máximo (1,000).<br />
                    <strong>Perfis:</strong> Popular (&lt;R$400) · Média-baixa (R$400–R$800) · Padrão (R$800–{R$(sp.ticketMax)}) · Premium (&gt;{R$(sp.ticketMax)}).
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
                    <strong>Fórmula:</strong> {segs === 3 || altaCompl ? '3 segmentos / alta complexidade = score 1,000 (máximo)' : segs === 2 ? '2 segmentos = score 0,500' : '1 segmento = score 0,000 (mínimo)'}
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)', borderTop: '1px solid #e2e8f0', paddingTop: '.5rem' }}>
                    <strong>Regra ({pct(sp.wCompl)} do score bruto):</strong> Número de ciclos escolares atendidos. Mais segmentos = maior estrutura de entrega = custo operacional maior = preço mais próximo do TETO.<br />
                    <strong>Escala:</strong> 1 seg = 0,000 · 2 seg = 0,500 · 3 seg = 1,000. "Alta complexidade: SIM" força score 1,000 independente do número de segmentos.
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
                    <strong>Fórmula:</strong> {situacao === 'Renovação 2º ciclo+' ? 'Renovação 2º ciclo ou mais = score 0,400 (maior benefício de fidelidade)' : situacao === 'Renovação 1º ciclo' ? 'Renovação 1º ciclo = score 0,700 (benefício moderado)' : 'Contrato novo = score 1,000 (sem benefício de fidelidade)'}
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)', borderTop: '1px solid #e2e8f0', paddingTop: '.5rem' }}>
                    <strong>Regra ({pct(sp.wFid)} do score bruto):</strong> Situação do contrato com a escola. Renovação = desconto implícito por lealdade — escola fiel paga menos que escola nova. Score menor = preço mais próximo do PISO. Quanto mais ciclos de renovação, maior o benefício.<br />
                    <strong>Escala:</strong> Novo = 1,000 (preço cheio) · Renovação 1° ciclo = 0,700 · Renovação 2° ciclo+ = 0,400 (preço mais baixo possível dentro do piso único).
                  </div>
                </div>
              </div>
              <div style={{ background: '#0f172a', borderRadius: 10, padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.25rem' }}>Score Final Ponderado</div>
                  <div style={{ fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.72rem', color: 'rgba(255,255,255,.45)', marginBottom: '.15rem' }}>
                    Bruto: {pct(sp.wEscala)}×{dec(sis.s1)} + {pct(sp.wTicket)}×{dec(sis.s2)} + {pct(sp.wCompl)}×{dec(sis.s3)} + {pct(sp.wFid)}×{dec(sis.s4)} = {dec(sis.scoreBruto)}
                  </div>
                  {sis.capAtivo && (
                    <div style={{ fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.7rem', color: '#fbbf24', marginBottom: '.15rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                      ⚠ Teto da faixa ({dec(sis.faixaEscala.scoreCap)}) aplicado — escola grande tem preço garantido abaixo de {R$(sp.piso + (sp.teto - sp.piso) * sis.faixaEscala.scoreCap)}
                    </div>
                  )}
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
                  <KV label="(1) Piso único" value={R$(sp.piso)} sub={`Piso único: ${sis.faixaEscala.nome} ativa`} />
                  <KV label="(2) Amplitude × Score" value={R$(sis.valorBruto - sp.piso)} sub={`(${R$(sp.teto)} − ${R$(sp.piso)}) × ${dec(sis.scoreFinal)}`} />
                  <KV label="(3) Valor bruto" value={R$(sis.valorBruto)} sub="Piso + amplitude × score" color="#4A7FDB" />
                </div>
                <Nota t={`${R$(sp.piso)} + (${R$(sp.teto)} − ${R$(sp.piso)}) × ${dec(sis.scoreFinal)} = ${R$(sis.valorBruto)}/aluno/ano`} />

                {desconto > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      <KV label="(4) Desconto aplicado" value={`-${desconto}%`} sub={`-${R$(sis.valorBruto * desconto / 100)}`} color="#dc2626" />
                      <KV label="(5) Valor com desconto" value={R$(sis.valorDesc)} sub="Antes da proteção do piso" />
                    </div>
                    <Nota t={`${R$(sis.valorBruto)} × (1 − ${desconto}%) = ${R$(sis.valorDesc)}. Desconto máximo sem furar o piso: ${sis.descMax.toFixed(1)}%.`} />
                  </>
                )}

                <div style={{ background: sis.valorFinal <= sp.piso ? '#fef3c7' : '#f0fdf4', border: `1.5px solid ${sis.valorFinal <= sp.piso ? '#fde68a' : '#86efac'}`, borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.3rem' }}>(6) Proteção piso — MAX(piso, valor_com_desconto)</div>
                    <div style={{ fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.75rem', color: '#475569', marginBottom: '.2rem' }}>
                      MAX({R$(sp.piso)}, {R$(sis.valorDesc)}) = <strong>{R$(sis.valorFinal)}</strong>
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {sis.valorFinal <= sp.piso ? 'Atenção: desconto limitado pelo piso — valor travado no mínimo' : 'OK: desconto válido — não ultrapassou o piso'}
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
            </div>

            {/* 7. Parcelamento */}
            <Card>
              <SecTitle n={7} title="Painel de parcelamento — 4x a 12x" />
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

            {/* 8. Fechamento do Orçamento */}
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
                      <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>piso único {R$(sp.piso)}</div>
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
                  <div style={NOTA}>Lucro sobre o PV. 200% = recupera PV + ganha 2×PV de lucro = recebe 3× o total investido.</div>
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
                  <div style={NOTA}>Taxa sobre o total de equipamentos (com quantidades) × anos. Padrão 25%.</div>
                </div>
                <div>
                  <label style={LBL}>Tx. Admin (%)</label>
                  <InlineNum value={+(lp.txAdmin * 100).toFixed(1)} onChange={v => setLp(p => ({ ...p, txAdmin: v / 100 }))} suffix="%" min={0} step={1} />
                  <div style={NOTA}>Taxa administrativa sobre o total de equipamentos (com quantidades) × anos. Padrão 25%.</div>
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
                  label={`Manutenção: ${pct(lp.txMan)} × total equipamentos × ${com.anos} anos`}
                  value={R$(com.C_man)}
                  sub={`${pct(lp.txMan)} × ${R$(com.sumEquip)} × ${com.anos}`}
                  color="#0f172a"
                />
                <KV
                  label={`Admin: ${pct(lp.txAdmin)} × total equipamentos × ${com.anos} anos`}
                  value={R$(com.C_adm)}
                  sub={`${pct(lp.txAdmin)} × ${R$(com.sumEquip)} × ${com.anos}`}
                  color="#0f172a"
                />
              </div>
              <Nota t={`Manutenção: ${pct(lp.txMan)} × ${R$(com.sumEquip)} (total equip.) × ${com.anos} anos = ${R$(com.C_man)}`} />
              <Nota t={`Admin: ${pct(lp.txAdmin)} × ${R$(com.sumEquip)} (total equip.) × ${com.anos} anos = ${R$(com.C_adm)}`} />
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
