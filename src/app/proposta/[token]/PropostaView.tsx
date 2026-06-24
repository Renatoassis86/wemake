'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ── helpers ──────────────────────────────────────────────────────────────────
const R$ = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

const segLabel = (n: number) =>
  n === 1 ? 'Fundamental I'
  : n === 2 ? 'Fund. I e Fund. II'
  : 'Fund. I, II e Ensino Médio'

// ── exact site colors ─────────────────────────────────────────────────────────
const C = {
  navy:    '#0b1f44',
  royal:   '#4c8ade',
  royalD:  '#2a69ba',
  mint:    '#76f3cd',
  mintD:   '#27a884',
  amber:   '#ffcc00',
  white:   '#ffffff',
  ivory:   '#f8fafc',
}

// ── types ─────────────────────────────────────────────────────────────────────
interface Proposta {
  id: string; token: string
  escola_nome: string; escola_logo_url: string | null
  tipo: 'curriculo' | 'curriculo_comodato'
  validade: string; num_alunos: number; segmentos: number
  valor_aluno_ano: number; num_parcelas: number; duracao_meses: number
  comodato_pv: number | null; comodato_parcela: number | null
  comodato_retorno_pct: number | null; comodato_notebooks: number | null
  dados_calculo: Record<string, unknown>; texto_personalizado: string | null
  created_at: string
}

// ── glow orb ─────────────────────────────────────────────────────────────────
function Glow({ color, size, style }: { color: string; size: number; style?: React.CSSProperties }) {
  return (
    <div aria-hidden style={{
      position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`,
      pointerEvents: 'none', ...style,
    }} />
  )
}

// ── wave SVG divider (bottom of section) ─────────────────────────────────────
function Wave({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <div aria-hidden style={{ position: 'absolute', bottom: flip ? 'auto' : 0, top: flip ? 0 : 'auto', left: 0, right: 0, lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none', zIndex: 3 }}>
      <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', height: 64, display: 'block' }}>
        <path d="M0,32 C240,64 480,0 720,40 C960,80 1200,8 1440,32 L1440,64 L0,64 Z" fill={fill} />
      </svg>
    </div>
  )
}

// ── aurora blob ───────────────────────────────────────────────────────────────
function Aurora({ color1, color2, style }: { color1: string; color2: string; style?: React.CSSProperties }) {
  return (
    <div aria-hidden style={{
      position: 'absolute', width: 520, height: 520, borderRadius: '62% 38% 47% 53% / 45% 60% 40% 55%',
      background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      opacity: 0.12, filter: 'blur(1px)',
      animation: 'aurora 20s ease-in-out infinite',
      pointerEvents: 'none',
      ...style,
    }} />
  )
}

// ── eyebrow label (exact site pattern) ───────────────────────────────────────
function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p style={{
      fontFamily: 'Geist, sans-serif', fontWeight: 700,
      fontSize: 'clamp(0.7rem, 0.68rem + 0.1vw, 0.75rem)',
      textTransform: 'uppercase', letterSpacing: '0.22em',
      color: dark ? C.royal : C.mint,
      marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ display: 'inline-block', width: 22, height: 1.5, background: dark ? C.royal : C.mint, opacity: 0.7, borderRadius: 1 }} />
      {children}
    </p>
  )
}

// ── animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * to))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])
  return <span ref={ref}>{val.toLocaleString('pt-BR')}{suffix}</span>
}

// ── fade-in on scroll (site's Reveal pattern) ─────────────────────────────────
// ── status badge para a tabela ────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  'Obrigatório': { bg: 'rgba(11,31,68,0.08)',    color: '#0b1f44', dot: '#0b1f44' },
  'Recomendado': { bg: 'rgba(76,138,222,0.10)',  color: '#2a69ba', dot: '#4c8ade' },
  'Opcional':    { bg: 'rgba(148,163,184,0.15)', color: '#64748b', dot: '#94a3b8' },
}

function TableRow({ row, delay, catColor, pct }: { row: { req: string; spec: string; status: string }; delay: number; catColor: string; pct?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const st = STATUS_STYLE[row.status] ?? STATUS_STYLE['Opcional']
  // modo "custo" (quando pct está presente): 3 colunas sem badge de status
  if (pct !== undefined) {
    return (
      <div ref={ref} style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
        padding: '9px 24px', gap: 12,
        borderTop: '1px solid rgba(11,31,68,0.05)',
        alignItems: 'center',
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'translateX(-16px)',
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        background: 'transparent',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(76,138,222,0.04)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 3, height: 12, borderRadius: 2, background: catColor, display: 'inline-block', flexShrink: 0 }} />
          {row.req}
        </span>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--text-sm)', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{row.spec}</span>
        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'right' }}>{pct}</span>
      </div>
    )
  }
  return (
    <div ref={ref} style={{
      display: 'grid', gridTemplateColumns: '2fr 3fr 1fr',
      padding: '9px 20px', gap: 12,
      borderTop: '1px solid rgba(11,31,68,0.05)',
      alignItems: 'center',
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : 'translateX(-16px)',
      transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      background: 'transparent',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(76,138,222,0.04)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 3, height: 14, borderRadius: 2, background: catColor, display: 'inline-block', flexShrink: 0 }} />
        {row.req}
      </span>
      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: '#475569', lineHeight: 1.45 }}>{row.spec}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: st.bg, fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: st.color, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
        {row.status}
      </span>
    </div>
  )
}

// ── fade-in on scroll (site's Reveal pattern) ─────────────────────────────────
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : 'translateY(24px)',
      transition: `opacity 0.72s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.72s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── monochromatic SVG icons ───────────────────────────────────────────────────
const I = {
  book:    (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  book2:   (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  screen:  (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  users:   (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bolt:    (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  clock:   (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  chat:    (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  home:    (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  check:   (c='currentColor') => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       (c='currentColor') => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  arrow:   (c='currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>,
  tag:     (c='currentColor') => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  insta:   (c='currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  mail:    (c='currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone:   (c='currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  globe:   (c='currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  laptop:  (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 20h20"/></svg>,
}

// ── countdown hook ────────────────────────────────────────────────────────────
type Tick = { days: number; hours: number; minutes: number; seconds: number; expired: boolean }

function useCountdown(targetDate: string): Tick | null {
  const [tick, setTick] = useState<Tick | null>(null)
  useEffect(() => {
    const calcDiff = (): Tick => {
      const diff = Math.max(0, new Date(targetDate + 'T23:59:59').getTime() - Date.now())
      return {
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000)  / 60_000),
        seconds: Math.floor((diff % 60_000)      / 1_000),
        expired: diff === 0,
      }
    }
    setTick(calcDiff())
    const id = setInterval(() => setTick(calcDiff()), 1_000)
    return () => clearInterval(id)
  }, [targetDate])
  return tick
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function PropostaView({ proposta: p, isExpired }: { proposta: Proposta; isExpired: boolean }) {
  const [active, setActive] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  const countdown = useCountdown(p.validade)

  const hasComodato = p.tipo === 'curriculo_comodato'
  const totalAnual   = p.valor_aluno_ano * p.num_alunos
  const parcelaCurr  = totalAnual / p.num_parcelas
  const mensalComd   = p.comodato_parcela ?? 0
  const descPct      = Math.max(0, Math.round((1 - p.valor_aluno_ano / 420) * 100))

  // Itens reais do comodato vindos do dados_calculo
  type ComItem = { nome: string; total: number }
  const comData = (p.dados_calculo as Record<string, Record<string, unknown>>)?.com ?? {}
  const comItens: ComItem[] = (comData.itens as ComItem[] | undefined) ?? []
  const sumEquip = comItens.reduce((s, it) => s + it.total, 0)

  const sections = [
    'capa', 'carta', 'div1', 'config', 'escopo',
    ...(hasComodato ? ['div2', 'maker-intro', 'modelo1', 'modelo2', 'investimento', 'resumo'] : ['maker-assessoria', 'investimento']),
    'contato',
  ]

  const scrollTo = useCallback((i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const container = containerRef.current; if (!container) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sectionRefs.current.indexOf(e.target as HTMLElement)
          if (idx >= 0) setActive(idx)
        }
      })
    }, { root: container, threshold: 0.15 })
    sectionRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const sec = (i: number) => (el: HTMLElement | null) => { sectionRefs.current[i] = el }

  // ── expired ──
  if (isExpired) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.navy, gap: 20, padding: 40, textAlign: 'center' }}>
      <img src="/proposta/logo-white.png" alt="We Make" style={{ height: 40, marginBottom: 8 }} />
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--text-3xl)', color: C.white, fontWeight: 300 }}>Proposta expirada</h1>
      <p style={{ fontFamily: 'Geist, sans-serif', color: 'rgba(255,255,255,.45)', maxWidth: 380, lineHeight: 1.7 }}>
        Esta proposta não está mais disponível. Entre em contato para renovar.
      </p>
      <a href="mailto:contato@wemake.tec.br" className="btn-primary" style={{ marginTop: 8 }}>contato@wemake.tec.br</a>
    </div>
  )

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden', background: C.navy }}>

      {/* progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 200, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '100%', background: `linear-gradient(90deg,${C.royal},${C.mint})`, width: `${((active + 1) / sections.length) * 100}%`, transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>

      {/* nav dots */}
      <nav aria-label="Navegação" style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)} aria-label={`Ir para seção ${i + 1}`} style={{
            width: i === active ? 10 : 6, height: i === active ? 10 : 6,
            borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
            background: i === active ? C.mint : 'rgba(255,255,255,0.28)',
            boxShadow: i === active ? `0 0 10px ${C.mint}` : 'none',
            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
          }} />
        ))}
      </nav>

      {/* scroll container */}
      <div ref={containerRef} style={{ height: '100dvh', overflowY: 'scroll', scrollSnapType: 'y proximity', scrollBehavior: 'smooth' }}>

        {/* ══════════════════════════════════════════════════════════════
            0 · CAPA  — layout fiel ao PDF, visual We Make
        ══════════════════════════════════════════════════════════════ */}
        <section ref={sec(0)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden', position: 'relative' }}>

          {/* topo: 2 colunas */}
          <div style={{ display: 'flex', flex: '0 0 clamp(44%,48%,54%)', minHeight: 0 }}>

            {/* esquerda — royal blue */}
            <div style={{ width: '42%', background: C.royal, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'var(--gutter) var(--gutter) clamp(36px,5vw,56px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg,${C.royal},${C.royalD})` }} />
              <Glow color="rgba(118,243,205,0.2)" size={320} style={{ bottom: -80, right: -80 }} />
              <Aurora color1="rgba(118,243,205,0.15)" color2="rgba(42,105,186,0.08)" style={{ bottom: -160, right: -160 }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <p style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
                  PROPOSTA DE PARCERIA
                </p>
                <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-4xl)', color: '#fff', lineHeight: 1.08, textTransform: 'uppercase', letterSpacing: '-0.01em', textWrap: 'balance' } as React.CSSProperties}>
                  {p.escola_nome}
                </h1>
                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 3, background: C.mint, borderRadius: 2 }} />
                  <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', color: C.mint, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>We Make</span>
                </div>
              </div>
            </div>

            {/* direita — logo escola */}
            <div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,2vw,24px)', borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
              {p.escola_logo_url
                ? <img src={p.escola_logo_url} alt={p.escola_nome} style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
                : <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-5xl)', color: C.navy, opacity: 0.15 }}>{p.escola_nome.charAt(0)}</div>
              }
            </div>
          </div>

          {/* baixo — foto de fundo */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: C.navy }}>
            <img
              src="/proposta/foto_propostacomercial.png"
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center center' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg,rgba(11,31,68,0.55) 0%,transparent 30%,transparent 70%,rgba(11,31,68,0.75) 100%)` }} />
            <Glow color="rgba(118,243,205,0.14)" size={400} style={{ bottom: -100, left: -80 }} />

            {/* We Make logo */}
            <div style={{ position: 'absolute', bottom: 28, left: 'var(--gutter)' }}>
              <img src="/proposta/logo-white.png" alt="We Make" style={{ height: 36, objectFit: 'contain' }} />
            </div>

            {/* direita: validade + scroll */}
            <div style={{ position: 'absolute', bottom: 28, right: 'var(--gutter)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: 12, padding: '8px 14px', textAlign: 'right' }}>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,204,0,0.55)', marginBottom: 4 }}>
                  {countdown?.expired ? 'Proposta expirada' : 'Proposta válida por'}
                </p>
                {countdown?.expired ? (
                  <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '0.9rem', color: '#f87171', lineHeight: 1 }}>Expirada</p>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', justifyContent: 'flex-end' }}>
                    {([
                      { v: countdown?.days,    u: 'd' },
                      { v: countdown?.hours,   u: 'h' },
                      { v: countdown?.minutes, u: 'm' },
                      { v: countdown?.seconds, u: 's' },
                    ] as { v: number | undefined; u: string }[]).map(({ v, u }) => (
                      <span key={u} style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.9rem', fontWeight: 700, color: C.amber, lineHeight: 1 }}>
                        {v !== undefined ? String(v).padStart(2, '0') : '--'}<span style={{ fontSize: '0.55rem', color: 'rgba(255,204,0,0.5)', marginLeft: 1 }}>{u}</span>
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.56rem', color: 'rgba(255,204,0,0.4)', marginTop: 3 }}>
                  até {fmtDate(p.validade)}
                </p>
              </div>
              <button onClick={() => scrollTo(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', letterSpacing: '0.14em' }}>
                DESLIZAR
                <span style={{ animation: 'bob 1.8s ease-in-out infinite', display: 'block' }}>{I.arrow()}</span>
              </button>
            </div>

            {/* disclaimer */}
            <p style={{ position: 'absolute', top: 14, left: 0, right: 0, textAlign: 'center', fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', padding: '0 48px', letterSpacing: '0.04em' }}>
              Esta proposta é confidencial e deve ser tratada com sigilo.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            1 · CARTA CEO  — tone: ivory (branco, como o site)
        ══════════════════════════════════════════════════════════════ */}
        <section ref={sec(1)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', alignItems: 'stretch', background: C.ivory, overflow: 'hidden', position: 'relative' }}>
          <Glow color="rgba(76,138,222,0.06)" size={500} style={{ top: -120, right: -120 }} />

          {/* foto lateral — preenchimento total da coluna */}
          <div style={{ width: 'clamp(280px,38%,480px)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            {/* foto preenchendo toda a coluna */}
            <img
              src="/proposta/denis_ceo.png"
              alt="Denis Júlio"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
            />
            {/* gradiente: navy nas bordas para fundir */}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${C.navy} 0%, rgba(11,31,68,0.15) 30%, transparent 60%)` }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.navy} 0%, rgba(11,31,68,0.4) 20%, transparent 50%)` }} />
            {/* anel de glow decorativo */}
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 60% 40%, rgba(118,243,205,0.08) 0%, transparent 60%)`, pointerEvents: 'none' }} />
            {/* badge de nome na base */}
            <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'rgba(11,31,68,0.88)', backdropFilter: 'blur(16px)', border: `1px solid rgba(118,243,205,0.3)`, borderRadius: 999, padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', zIndex: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.mint, flexShrink: 0, boxShadow: `0 0 8px ${C.mint}` }} />
              <div>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: '0.9rem', color: C.white, fontWeight: 600, lineHeight: 1.2 }}>Dênis Júlio</p>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', color: C.mint, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.2 }}>Fundador · We Make</p>
              </div>
            </div>
          </div>

          {/* carta */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'clamp(48px,7vh,80px) clamp(20px,3vw,48px) clamp(32px,5vh,56px)', position: 'relative', zIndex: 2 }}>
            <Reveal>
              <Eyebrow dark>Carta do CEO</Eyebrow>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 'var(--text-3xl)', color: C.navy, marginBottom: 20, lineHeight: 1.2, letterSpacing: '-0.015em', textWrap: 'balance' } as React.CSSProperties}>
                Prezado(a) gestor(a) de <em style={{ color: C.royal }}>{p.escola_nome}</em>,
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-base)', color: '#334155', lineHeight: 1.75, marginBottom: 14 }}>
                {p.texto_personalizado
                  ? p.texto_personalizado
                  : `A We Make é uma editora de soluções tecnológicas para escolas confessionais, criada com o objetivo de pensar, estudar, ensinar e desenvolver tecnologia a partir da Cosmovisão Cristã. Somos referência no compromisso da educação escolar distintamente cristã, que prima pela Verdade, Beleza e Bondade.`
                }
              </p>
            </Reveal>
            <Reveal delay={220}>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-base)', color: '#334155', lineHeight: 1.75, marginBottom: 14 }}>
                Atuamos como parceira de escolas que desejam oferecer aos seus estudantes uma formação tecnológica consistente, organizada curricularmente e acompanhada com intencionalidade pedagógica. Nossa proposta não se limita ao fornecimento de aulas ou materiais: trabalhamos com currículo estruturado, formação docente, acompanhamento contínuo, orientação de implantação e apoio à organização do espaço maker, de modo coerente e com fidelidade à Cosmovisão Cristã.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-base)', color: '#334155', lineHeight: 1.75, marginBottom: 14 }}>
                É com grande gratidão que agradecemos à <strong style={{ color: C.navy }}>{p.escola_nome}</strong> pela oportunidade de considerar a We Make como uma parceira estratégica para enriquecer o trabalho pedagógico envolvendo a tecnologia e a cultura maker.
              </p>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-base)', color: '#334155', lineHeight: 1.75, marginBottom: 24 }}>
                Valorizamos profundamente o compromisso da sua escola com a inovação educacional e estamos entusiasmados com a possibilidade de colaborar para promover experiências de aprendizagem criativas e significativas, mas sem abrir mão dos princípios e valores cristãos.
              </p>
              <div className="surface-glass-ivory" style={{ padding: '16px 22px', display: 'inline-flex', alignItems: 'center', gap: 16, borderRadius: 14 }}>
                <div>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Com gratidão,</p>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--text-2xl)', color: C.navy, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.1 }}>Denis Júlio</p>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.72rem', color: C.royal, marginTop: 2 }}>CEO — We Make Tecnologia Educacional</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            2 · DIVISÓRIA — tone: navy
        ══════════════════════════════════════════════════════════════ */}
        <section ref={sec(2)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <Glow color="rgba(76,138,222,0.22)" size={600} style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <Aurora color1="rgba(118,243,205,0.1)" color2="rgba(76,138,222,0.12)" style={{ top: -200, right: -200 }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'clamp(160px,30vw,320px)', color: 'rgba(76,138,222,0.045)', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, userSelect: 'none', letterSpacing: '-0.04em' }}>01</div>
          <div aria-hidden style={{ position: 'absolute', width: '100%', height: 1, background: `linear-gradient(90deg,transparent,rgba(76,138,222,0.4),rgba(118,243,205,0.4),transparent)`, top: '50%' }} />
          <Reveal style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: 48 }}>
            <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', color: C.mint, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ width: 28, height: 1, background: C.mint, opacity: 0.6, display: 'inline-block' }} />PARTE 1<span style={{ width: 28, height: 1, background: C.mint, opacity: 0.6, display: 'inline-block' }} />
            </p>
            <h2 className="text-gradient-cinematic" style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'var(--text-5xl)', lineHeight: 1.05, marginBottom: 16, letterSpacing: '-0.025em', textWrap: 'balance' } as React.CSSProperties}>
              Proposta de Parceria
            </h2>
            <p style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 'var(--text-lg)', color: C.royal, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Currículo We Make
            </p>
          </Reveal>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3 · CONFIGURAÇÃO — tone: royal (azul We Make, como Services)
        ══════════════════════════════════════════════════════════════ */}
        <section ref={sec(3)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.royal, display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg,${C.royal},${C.royalD})` }} />
          <Glow color="rgba(118,243,205,0.18)" size={480} style={{ top: -100, right: -100 }} />
          <Glow color="rgba(11,31,68,0.3)" size={400} style={{ bottom: -80, left: -80 }} />
          <Aurora color1="rgba(118,243,205,0.1)" color2="rgba(11,31,68,0.15)" style={{ bottom: -200, right: -120 }} />

          {/* coluna conteúdo — esquerda */}
          <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'var(--section-py) var(--gutter)', overflowY: 'auto' }}><div>
            <Reveal>
              <Eyebrow>Objetivo da Parceria</Eyebrow>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-4xl)', color: C.white, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.05, textWrap: 'balance' } as React.CSSProperties}>
                Configuração considerada
              </h2>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.7)', marginBottom: 10, maxWidth: 540, lineHeight: 1.7 }}>
                A presente proposta tem como objetivo apoiar a escola na implantação e/ou consolidação da disciplina de Educação Tecnológica e Maker, contemplando:
              </p>
              <ul style={{ margin: '0 0 clamp(14px,2vh,22px) 0', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Currículo estruturado por segmento', 'Livro Maker do Aluno', 'Acesso à Plataforma da We Make', 'Acompanhamento pedagógico, tecnológico e teológico', 'Formação e orientação de professores', 'Onboarding de implantação presencial', 'Apoio à coordenação pedagógica', 'Suporte ao longo de toda a vigência contratual'].map(item => (
                  <li key={item} style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.5, listStyleType: 'none', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.mint, flexShrink: 0, marginTop: 6 }} />{item}
                  </li>
                ))}
              </ul>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: 'clamp(14px,2vh,22px)', maxWidth: 520, lineHeight: 1.6 }}>
                Para esta proposta, está sendo considerado o atendimento a <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{p.num_alunos.toLocaleString('pt-BR')} alunos</strong> em <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{p.segmentos === 3 ? '3 segmentos (EF1, EF2 e Médio)' : p.segmentos === 2 ? '2 segmentos' : '1 segmento'}</strong>, pelo prazo de <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{p.duracao_meses} meses</strong>.
              </p>
            </Reveal>

            {/* 3 stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
              {[
                { icon: I.users(), label: 'Alunos', val: p.num_alunos, suffix: '', note: 'alunos no escopo' },
                { icon: I.book(),  label: 'Segmentos', val: p.segmentos, suffix: '', note: segLabel(p.segmentos) },
                { icon: I.clock(), label: 'Duração',  val: p.duracao_meses, suffix: ' meses', note: `${p.duracao_meses / 12} anos de contrato` },
              ].map((s, i) => (
                <Reveal key={s.label} delay={i * 80}>
                  <div className="surface-card-royal card-lift" style={{ borderRadius: 16, padding: '18px 20px' }}>
                    <div style={{ color: C.mint, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.38)', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-4xl)', color: C.white, lineHeight: 1.05, marginBottom: 4 }}>
                      <Counter to={s.val} suffix={s.suffix} />
                    </div>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.48)', lineHeight: 1.4 }}>{s.note}</div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* incluído / não incluído */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Reveal delay={260}>
                <div className="surface-card-royal" style={{ borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: C.mint, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {I.check(C.mint)} Incluído
                  </div>
                  {['Currículo completo anual', 'Livro Maker do aluno', 'Plataforma digital', 'Acompanhamento pedagógico', 'Formação docente contínua', 'Onboarding presencial', 'Suporte contínuo', 'Memorial descritivo'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0', fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.4 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.mint, flexShrink: 0 }} />{item}
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={340}>
                <div className="surface-card-royal" style={{ borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {I.x('#fca5a5')} Não incluído
                  </div>
                  {['Visitas presenciais extras', 'Formações extraordinárias', 'Personalizações fora do escopo padrão', 'Produção de materiais adicionais não previstos', 'Aquisição de kits, insumos, máquinas, ferramentas ou equipamentos'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0', fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.48)', lineHeight: 1.4 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fca5a5', flexShrink: 0, opacity: 0.7 }} />{item}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div></div>
          </div>

          {/* coluna imagem — direita */}
          <div style={{ width: 'clamp(280px,38%,480px)', flexShrink: 0, position: 'relative', zIndex: 2, overflow: 'hidden' }}>
            <img src="/proposta/proposta1.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(76,138,222,0.75) 0%, rgba(76,138,222,0.2) 35%, transparent 70%)' }} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4 · ESCOPO — tone: navy (escuro, igual à seção Soluções)
        ══════════════════════════════════════════════════════════════ */}
        <section ref={sec(4)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.navy, display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative' }}>
          <Glow color="rgba(118,243,205,0.14)" size={500} style={{ top: -100, right: -100 }} />
          <Glow color="rgba(76,138,222,0.18)" size={400} style={{ bottom: -80, left: -100 }} />
          <Aurora color1="rgba(118,243,205,0.08)" color2="rgba(76,138,222,0.1)" style={{ bottom: -200, right: -80 }} />

          {/* coluna conteúdo — esquerda */}
          <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'var(--section-py) var(--gutter)', overflowY: 'auto' }}><div>
            <Reveal>
              <Eyebrow>Escopo da Parceria</Eyebrow>
              <h2 className="text-gradient-cinematic" style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-4xl)', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                O que está incluído
              </h2>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', marginBottom: 6, maxWidth: 560, lineHeight: 1.7 }}>
                Esta proposta contempla, durante toda a vigência contratual, acesso completo ao ecossistema We Make:
              </p>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginBottom: 20, maxWidth: 560, lineHeight: 1.65 }}>
                Currículo estruturado · Plataforma digital · Livro Maker do Aluno · Onboarding presencial · Acompanhamento pedagógico recorrente · Assessoria tecnológica e teológica · Reuniões com professores e coordenação · Suporte contínuo · Orientação pedagógica da disciplina · Apoio à implantação do espaço maker · Memorial descritivo arquitetônico.
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
              {[
                { icon: I.book(),   title: 'Currículo Completo',    desc: 'Conteúdo maker anual alinhado à BNCC' },
                { icon: I.book2(),  title: 'Livro Maker do Aluno',  desc: 'Material físico por estudante' },
                { icon: I.screen(), title: 'Plataforma Digital',    desc: 'LMS exclusivo com trilhas maker' },
                { icon: I.users(),  title: 'Formação Docente',      desc: 'Capacitação contínua para professores' },
                { icon: I.bolt(),   title: 'Onboarding Presencial', desc: 'Implantação com equipe We Make' },
                { icon: I.clock(),  title: 'Acompanhamento',        desc: 'Pedagógico, tecnológico e teológico' },
                { icon: I.chat(),   title: 'Suporte Contínuo',      desc: 'Atendimento durante todo o contrato' },
                { icon: I.home(),   title: 'Memorial Descritivo',   desc: 'Projeto arquitetônico do espaço maker' },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 50}>
                  <div className="surface-glass card-lift" style={{ borderRadius: 14, padding: '15px 16px' }}>
                    <div style={{ color: C.mint, marginBottom: 10 }}>{item.icon}</div>
                    <p style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600, fontSize: 'var(--text-sm)', color: C.white, marginBottom: 4, lineHeight: 1.35 }}>{item.title}</p>
                    <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

          </div></div>

          {/* coluna imagem — direita */}
          <div style={{ width: 'clamp(280px,36%,460px)', flexShrink: 0, position: 'relative', zIndex: 2, overflow: 'hidden' }}>
            <img src="/proposta/proposta5.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(11,31,68,0.8) 0%, rgba(11,31,68,0.2) 40%, transparent 70%)' }} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5 · ASSESSORIA SALA MAKER — apenas quando NÃO tem comodato
        ══════════════════════════════════════════════════════════════ */}
        {!hasComodato && (
          <section ref={sec(5)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.navy, display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative' }}>
            <Glow color="rgba(118,243,205,0.12)" size={560} style={{ top: -120, left: -120 }} />
            <Glow color="rgba(76,138,222,0.18)" size={420} style={{ bottom: -80, right: -80 }} />
            <Aurora color1="rgba(76,138,222,0.08)" color2="rgba(118,243,205,0.06)" style={{ top: -180, right: -80 }} />

            {/* coluna conteúdo — esquerda */}
            <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'var(--section-py) var(--gutter)', overflowY: 'auto' }}><div style={{ maxWidth: 640, width: '100%' }}>
              <Reveal>
                <Eyebrow>Espaço Maker</Eyebrow>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-4xl)', color: C.white, marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.05, textWrap: 'balance' } as React.CSSProperties}>
                  Apoio completo para sua Sala Maker
                </h2>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 8, maxWidth: 580 }}>
                  Para apoiar a escola na organização de um espaço adequado ao desenvolvimento da Educação Tecnológica e Maker, a We Make oferece orientação completa para a implantação dos recursos necessários à operação da disciplina.
                </p>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: 24, maxWidth: 580 }}>
                  A organização e a aquisição dos recursos do espaço maker são realizadas pela própria escola. A We Make atua como parceira estratégica em todo o processo de planejamento e implantação.
                </p>
              </Reveal>

              <Reveal delay={100}>
                <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px', marginBottom: 20 }}>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.mint, marginBottom: 14 }}>O que a We Make oferece</p>
                  {[
                    'Planejamento e orientação para implantação da disciplina',
                    'Onboarding presencial de implantação',
                    'Apoio à organização do espaço maker em nível compatível com a proposta',
                    'Memorial descritivo do espaço maker (projeto arquitetônico)',
                    'Acompanhamento pedagógico recorrente ao longo da vigência',
                    'Assessoria tecnológica e teológica para uso do espaço',
                  ].map((item, i) => (
                    <Reveal key={item} delay={i * 40}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.mint, flexShrink: 0, marginTop: 5 }} />
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </Reveal>

              {/* Tabela de referência de custos — exibe se houver dados no dados_calculo */}
              {comItens.length > 0 && (
                <Reveal delay={220}>
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.mint, marginBottom: 10 }}>
                      Simulação de custos — referência para aquisição
                    </p>
                    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {/* cabeçalho */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: 'rgba(11,31,68,0.6)', padding: '10px 18px', gap: 8 }}>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)' }}>Item</span>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>Valor</span>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>%</span>
                      </div>
                      {/* linha TOTAL */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '11px 18px', gap: 8, background: 'rgba(118,243,205,0.07)', borderBottom: '2px solid rgba(118,243,205,0.15)' }}>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 'var(--text-sm)', color: C.white }}>TOTAL ESTIMADO</span>
                        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-sm)', color: C.mint, textAlign: 'right' }}>{R$(sumEquip)}</span>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: C.white, textAlign: 'right', fontWeight: 600 }}>100%</span>
                      </div>
                      {/* itens */}
                      {comItens.map((item, i) => (
                        <div key={item.nome} style={{
                          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '8px 18px', gap: 8,
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        }}>
                          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 3, height: 10, borderRadius: 2, background: C.mint, flexShrink: 0 }} />
                            {item.nome}
                          </span>
                          <span style={{ fontFamily: 'Fraunces, serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', textAlign: 'right' }}>{R$(item.total)}</span>
                          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>
                            {sumEquip > 0 ? `${((item.total / sumEquip) * 100).toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      ))}
                      {/* rodapé */}
                      <div style={{ padding: '8px 18px', background: 'rgba(11,31,68,0.4)' }}>
                        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.55 }}>
                          * Simulação com base no memorial descritivo We Make. Valores referenciais sujeitos a atualização na aquisição.
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              <Reveal delay={360}>
                <div style={{ padding: '12px 18px', borderLeft: `3px solid ${C.mint}`, background: 'rgba(118,243,205,0.06)', borderRadius: '0 12px 12px 0' }}>
                  <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                    A aquisição dos equipamentos, máquinas e recursos do espaço maker é de responsabilidade da escola. Não está incluída nesta proposta, salvo contratação específica.
                  </p>
                </div>
              </Reveal>
            </div></div>

            {/* coluna imagem — direita */}
            <div style={{ width: 'clamp(260px,36%,460px)', flexShrink: 0, position: 'relative', zIndex: 2, overflow: 'hidden' }}>
              <img src="/proposta/proposta4.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(11,31,68,0.85) 0%, rgba(11,31,68,0.25) 40%, transparent 70%)' }} />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            COMODATO — sections 5 (div2), 6, 7, 8
        ══════════════════════════════════════════════════════════════ */}
        {hasComodato && (
          <>
            {/* 5 · DIVISOR PARTE 2 */}
            <section ref={sec(5)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.royal, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', textAlign: 'center', padding: 'var(--section-py) var(--gutter)' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg,${C.royalD},${C.navy})` }} />
              <Glow color="rgba(118,243,205,0.18)" size={600} style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              <Aurora color1="rgba(118,243,205,0.1)" color2="rgba(76,138,222,0.08)" style={{ top: -200, right: -200 }} />
              <div style={{ position: 'relative', zIndex: 2, maxWidth: 680 }}>
                <Reveal>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.mint, marginBottom: 20 }}>
                    Parte 2
                  </p>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'var(--text-5xl)', color: C.white, lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 24 }}>
                    Modelos de Implantação do Espaço Maker
                  </h2>
                  <div style={{ width: 60, height: 2, background: C.mint, margin: '0 auto 24px', borderRadius: 1 }} />
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>
                    A We Make apresenta duas possibilidades de implantação dos recursos necessários à operação da disciplina maker na sua escola.
                  </p>
                </Reveal>
              </div>
            </section>

            {/* 6 · ESPAÇO MAKER INTRO — tony navy, dois modelos */}
            <section ref={sec(6)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.navy, display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative' }}>
              {/* imagem de fundo com pouca opacidade */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/proposta/proposta1.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(11,31,68,0.92) 0%, rgba(11,31,68,0.7) 50%, rgba(11,31,68,0.85) 100%)' }} />
              <Glow color="rgba(118,243,205,0.16)" size={620} style={{ top: -180, left: -100 }} />
              <Glow color="rgba(76,138,222,0.22)" size={520} style={{ bottom: -140, right: -120 }} />

              {/* coluna conteúdo — esquerda, scroll natural */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'clamp(36px,5vh,56px) var(--gutter)', position: 'relative', zIndex: 2, overflowY: 'auto' }}>
                <div style={{ maxWidth: 660 }}>

                  <Reveal>
                    <Eyebrow>Infraestrutura</Eyebrow>
                    <h2 className="text-gradient-cinematic" style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'var(--text-4xl)', lineHeight: 1.05, marginBottom: 14, letterSpacing: '-0.025em' }}>
                      Espaço Maker We Make
                    </h2>
                    <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: 14 }}>
                      Para apoiar a escola na organização de um espaço adequado ao desenvolvimento da Educação Tecnológica e Maker, a We Make apresenta duas possibilidades de implantação dos recursos necessários à operação da disciplina.
                    </p>
                  </Reveal>

                  {/* tags de recursos */}
                  <Reveal delay={50}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                      {['Máquinas Digitais', 'Robótica & Eletrônica', 'Computadores', 'Ferramentas', 'Mídias', 'Organização & Segurança'].map(tag => (
                        <span key={tag} style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', fontWeight: 600, color: C.mint, background: 'rgba(118,243,205,0.08)', border: '1px solid rgba(118,243,205,0.2)', borderRadius: 99, padding: '3px 10px' }}>{tag}</span>
                      ))}
                    </div>
                  </Reveal>

                  {/* divisor */}
                  <Reveal delay={80}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 18 }} />
                  </Reveal>

                  {/* Modelo 1 */}
                  <Reveal delay={100}>
                    <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                      <div style={{ flexShrink: 0, paddingTop: 3 }}>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.royal, background: 'rgba(76,138,222,0.15)', border: '1px solid rgba(76,138,222,0.3)', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>Modelo 1</span>
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '0.95rem', color: C.white, marginBottom: 6, lineHeight: 1.2 }}>Investimento Patrimonial da Escola</h3>
                        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.7 }}>
                          A própria instituição realiza a aquisição dos recursos reutilizáveis, máquinas, ferramentas, equipamentos e demais itens necessários para a composição do espaço maker. Os bens adquiridos passam a integrar o patrimônio da escola e podem ser utilizados em outras atividades pedagógicas, projetos interdisciplinares, formações docentes e experiências educativas desenvolvidas pela própria instituição.
                        </p>
                      </div>
                    </div>
                  </Reveal>

                  {/* divisor */}
                  <Reveal delay={130}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 18 }} />
                  </Reveal>

                  {/* Modelo 2 */}
                  <Reveal delay={160}>
                    <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                      <div style={{ flexShrink: 0, paddingTop: 3 }}>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.mint, background: 'rgba(118,243,205,0.12)', border: '1px solid rgba(118,243,205,0.3)', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>Modelo 2</span>
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '0.95rem', color: C.white, marginBottom: 6, lineHeight: 1.2 }}>Cessão de Uso com Transferência Final</h3>
                        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.7 }}>
                          A We Make disponibiliza à escola, durante o período do contrato, os recursos reutilizáveis necessários ao desenvolvimento das aulas previstas na proposta pedagógica. Ao final da vigência contratual, desde que cumpridas integralmente as condições estabelecidas, esses recursos poderão ser transferidos definitivamente à escola, passando a compor seu patrimônio.
                        </p>
                        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, marginTop: 8 }}>
                          Esse modelo permite que a escola reduza o investimento inicial necessário para a implantação do espaço maker, sem abrir mão da possibilidade de, ao final da parceria, consolidar uma estrutura própria para a continuidade da Educação Tecnológica e Maker.
                        </p>
                      </div>
                    </div>
                  </Reveal>

                  {/* nota rodapé */}
                  <Reveal delay={200}>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                        * Não incluídos: adequações estruturais, reformas, instalações elétricas, climatização, mobiliário planejado ou materiais consumíveis.
                      </p>
                    </div>
                  </Reveal>

                </div>
              </div>

              {/* coluna fotos — direita */}
              <div style={{ width: 'clamp(220px,30%,380px)', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
                {['proposta3.png', 'proposta4.png', 'proposta5.png'].map((src) => (
                  <div key={src} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <img src={`/proposta/${src}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(11,31,68,0.6) 0%, transparent 55%)' }} />
                  </div>
                ))}
              </div>
            </section>

            {/* 7 · MODELO 1 — Investimento Patrimonial (tabela de custos) */}
            <section ref={sec(7)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.ivory, display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative' }}>
              <Glow color="rgba(76,138,222,0.06)" size={480} style={{ top: -80, right: -80 }} />
              <Glow color="rgba(118,243,205,0.04)" size={360} style={{ bottom: -60, left: -80 }} />

              {/* coluna conteúdo — esquerda */}
              <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'var(--section-py) var(--gutter)', overflowY: 'auto' }}><div style={{ maxWidth: 700, width: '100%' }}>
                <Reveal>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.royal, background: 'rgba(76,138,222,0.1)', border: `1px solid ${C.royal}`, borderRadius: 999, padding: '3px 12px' }}>Modelo 1</span>
                  </div>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-4xl)', color: C.navy, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                    Investimento Patrimonial da Escola
                  </h2>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: '#475569', lineHeight: 1.75, maxWidth: 680, marginBottom: 6 }}>
                    Neste modelo, a escola realiza a aquisição dos recursos necessários para a implantação do espaço maker, conforme memorial descritivo e relação de referência apresentados pela We Make. Os equipamentos, ferramentas, máquinas e demais recursos passam a pertencer à escola, tornando-se parte de sua infraestrutura pedagógica permanente.
                  </p>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: '#475569', lineHeight: 1.75, maxWidth: 680, marginBottom: 24 }}>
                    Este modelo é indicado para instituições que desejam fortalecer seu patrimônio próprio e utilizar o espaço maker de maneira ampla, tanto nas aulas da We Make quanto em outras iniciativas pedagógicas da escola.
                  </p>
                </Reveal>

                {/* Tabela de custos */}
                <Reveal delay={100}>
                  <div className="surface-glass-ivory" style={{ borderRadius: 16, overflow: 'hidden' }}>
                    {/* cabeçalho */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: C.navy, padding: '12px 24px', gap: 12 }}>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)' }}>Relação de Custos</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>Total</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>%</span>
                    </div>

                    {/* linha TOTAL */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '14px 24px', gap: 12, background: `rgba(11,31,68,0.06)`, borderBottom: `2px solid rgba(11,31,68,0.12)` }}>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: C.navy }}>TOTAL</span>
                      <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-base)', color: C.royal, textAlign: 'right' }}>{R$(sumEquip)}</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: C.navy, textAlign: 'right', fontWeight: 600 }}>100%</span>
                    </div>

                    {/* linhas de itens — vindas do dados_calculo */}
                    {comItens.map((item, i) => (
                      <TableRow
                        key={item.nome}
                        row={{ req: item.nome, spec: R$(item.total), status: '' }}
                        delay={i * 40}
                        catColor={C.royal}
                        pct={sumEquip > 0 ? `${((item.total / sumEquip) * 100).toFixed(2)}%` : '—'}
                      />
                    ))}

                    {/* rodapé */}
                    <div style={{ padding: '10px 24px', background: 'rgba(11,31,68,0.03)', borderTop: '1px solid rgba(11,31,68,0.06)' }}>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1.6 }}>
                        * Relação de referência conforme memorial descritivo We Make. Valores finais sujeitos a atualização no momento da aquisição.
                        Não estão incluídos: adequações estruturais, reformas, instalações elétricas, mobiliário e materiais consumíveis.
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div></div>

              {/* coluna imagem — direita */}
              <div style={{ width: 'clamp(240px,32%,400px)', flexShrink: 0, position: 'relative', zIndex: 2, overflow: 'hidden' }}>
                <img src="/proposta/proposta3.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(248,250,252,0.9) 0%, rgba(248,250,252,0.3) 30%, transparent 60%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,31,68,0.06)' }} />
              </div>
            </section>

            {/* 8 · MODELO 2 (COMODATO) — tone: royal */}
            <section ref={sec(8)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.royalD, display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg,${C.royal},${C.royalD})` }} />
              <Glow color="rgba(118,243,205,0.18)" size={460} style={{ top: -80, right: -80 }} />
              <Aurora color1="rgba(118,243,205,0.1)" color2="rgba(11,31,68,0.15)" style={{ bottom: -200, left: -160 }} />

              {/* coluna imagem — esquerda */}
              <div style={{ width: 'clamp(260px,36%,460px)', flexShrink: 0, position: 'relative', zIndex: 2, overflow: 'hidden' }}>
                <img src="/proposta/proposta4.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(42,105,186,0.85) 0%, rgba(76,138,222,0.25) 35%, transparent 65%)' }} />
              </div>

              {/* coluna conteúdo — direita */}
              <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'var(--section-py) clamp(20px,3vw,48px)', overflowY: 'auto' }}><div style={{ maxWidth: 700, width: '100%' }}>
                <Reveal>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.mint, background: 'rgba(118,243,205,0.12)', border: '1px solid rgba(118,243,205,0.3)', borderRadius: 999, padding: '3px 12px' }}>Modelo 2</span>
                  </div>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-4xl)', color: C.white, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                    Implantação com Transferência Patrimonial
                  </h2>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 660, marginBottom: 6 }}>
                    Neste modelo, a We Make disponibiliza à escola, durante a vigência contratual, os recursos reutilizáveis necessários à execução da proposta pedagógica contratada, incluindo máquinas digitais, manuais, ferramentas, recursos de robótica e eletrônica, computadores, mídias, itens de organização e segurança.
                  </p>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 660, marginBottom: 6 }}>
                    Durante o período contratual, os bens deverão ser utilizados exclusivamente para os fins educacionais previstos na parceria, observadas as orientações de uso, conservação e armazenamento fornecidas pela We Make.
                  </p>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 660, marginBottom: 24 }}>
                    Ao final da vigência contratual, desde que cumpridas integralmente as obrigações previstas, os recursos reutilizáveis disponibilizados à escola poderão ser transferidos definitivamente à instituição, passando a integrar seu patrimônio.
                  </p>
                </Reveal>

                {/* Tabela de recursos cedidos */}
                <Reveal delay={100}>
                  <div style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
                    {/* cabeçalho */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: 'rgba(11,31,68,0.5)', padding: '12px 24px', gap: 12 }}>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)' }}>Relação de Recursos</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>Valor</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>%</span>
                    </div>
                    {/* linha TOTAL */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '14px 24px', gap: 12, background: 'rgba(118,243,205,0.08)', borderBottom: '2px solid rgba(118,243,205,0.2)' }}>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: C.white }}>TOTAL</span>
                      <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-base)', color: C.mint, textAlign: 'right' }}>{R$(sumEquip)}</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: C.white, textAlign: 'right', fontWeight: 600 }}>100%</span>
                    </div>
                    {/* linhas de itens — vindas do dados_calculo */}
                    {comItens.map((item) => (
                      <div key={item.nome} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 24px', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 3, height: 12, borderRadius: 2, background: C.mint, display: 'inline-block', flexShrink: 0 }} />
                          {item.nome}
                        </span>
                        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--text-sm)', fontWeight: 600, color: C.mint, textAlign: 'right' }}>{R$(item.total)}</span>
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>{sumEquip > 0 ? `${((item.total / sumEquip) * 100).toFixed(2)}%` : '—'}</span>
                      </div>
                    ))}
                    {/* rodapé */}
                    <div style={{ padding: '10px 24px', background: 'rgba(11,31,68,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                        * Relação de referência conforme memorial descritivo We Make. Recursos disponibilizados em comodato durante a vigência contratual e transferidos ao final do período, cumpridas as condições estabelecidas.
                      </p>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={320}>
                  <div style={{ borderRadius: 16, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', background: 'rgba(118,243,205,0.08)', border: '1px solid rgba(118,243,205,0.2)' }}>
                    <div>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Investimento mensal total</p>
                      <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-3xl)', color: C.mint, lineHeight: 1 }}>{R$(totalAnual / 12 + mensalComd)}</p>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                        {R$((totalAnual / 12 + mensalComd) * 12 / (p.num_alunos || 1))} por aluno / ano
                      </p>
                    </div>
                    <div style={{ height: 44, width: 1, background: 'rgba(255,255,255,0.15)' }} />
                    <div>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Duração</p>
                      <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-2xl)', color: C.white, lineHeight: 1 }}>{p.duracao_meses} meses</p>
                    </div>
                    <div style={{ height: 44, width: 1, background: 'rgba(255,255,255,0.15)' }} />
                    <div>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Condições</p>
                      <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-lg)', color: C.white, lineHeight: 1 }}>Boleto · Dia 7</p>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Reajuste anual IPCA</p>
                    </div>
                  </div>
                </Reveal>
              </div></div>
            </section>

          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            INVESTIMENTO — narrativa: valores revelados por último
        ══════════════════════════════════════════════════════════════ */}
        <section ref={hasComodato ? sec(9) : sec(6)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.navy, display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative' }}>
          <Glow color="rgba(118,243,205,0.12)" size={600} style={{ top: -160, right: -160 }} />
          <Glow color="rgba(76,138,222,0.2)" size={500} style={{ bottom: -120, left: -120 }} />
          <Aurora color1="rgba(76,138,222,0.08)" color2="rgba(118,243,205,0.06)" style={{ top: -200, left: -100 }} />

          {/* coluna imagem — esquerda */}
          <div style={{ width: 'clamp(240px,34%,420px)', flexShrink: 0, position: 'relative', zIndex: 2, overflow: 'hidden' }}>
            <img src="/proposta/proposta2.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(11,31,68,0.8) 0%, rgba(11,31,68,0.25) 40%, transparent 75%)' }} />
          </div>

          {/* coluna conteúdo — direita */}
          <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'var(--section-py) var(--gutter)', overflowY: 'auto' }}><div style={{ maxWidth: 700, width: '100%' }}>

            <Reveal>
              <Eyebrow>Financeiro</Eyebrow>
              <h2 className="text-gradient-cinematic" style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontStyle: 'italic', fontSize: 'var(--text-5xl)', marginBottom: 20, letterSpacing: '-0.03em', lineHeight: 1 }}>
                Investimento da Parceria
              </h2>
            </Reveal>

            {hasComodato ? (
              <>
                <Reveal delay={60}>
                  <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20, maxWidth: 560 }}>
                    Esta proposta apresenta dois modelos de parceria. Escolha o que melhor se adapta à realidade da sua escola.
                  </p>
                </Reveal>
                <Reveal delay={100}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                    <div className="surface-glass" style={{ borderRadius: 20, padding: '22px 24px', borderColor: 'rgba(76,138,222,0.25)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(76,138,222,0.15)', border: '1px solid rgba(76,138,222,0.35)', borderRadius: 99, padding: '3px 12px', marginBottom: 12 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.royal }} />
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.royal }}>Modelo 1</span>
                      </div>
                      <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-lg)', color: C.white, marginBottom: 4, lineHeight: 1.2 }}>Somente Currículo</p>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, marginBottom: 18 }}>
                        A escola adquire os equipamentos da Sala Maker com recursos próprios.
                      </p>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>Por aluno / ano</span>
                          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: C.royal }}>{R$(p.valor_aluno_ano)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>Por aluno / mês</span>
                          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.6)' }}>{R$(p.valor_aluno_ano / 12)}</span>
                        </div>
                        <div style={{ background: 'rgba(76,138,222,0.12)', border: '1px solid rgba(76,138,222,0.25)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: C.royal }}>Parcela mensal escola</span>
                          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-2xl)', color: C.white }}>{R$(totalAnual / 12)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="surface-glass" style={{ borderRadius: 20, padding: '22px 24px', borderColor: 'rgba(118,243,205,0.3)', boxShadow: '0 0 40px rgba(118,243,205,0.08)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(118,243,205,0.12)', border: '1px solid rgba(118,243,205,0.35)', borderRadius: 99, padding: '3px 12px', marginBottom: 12 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.mint }} />
                        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.mint }}>Modelo 2</span>
                      </div>
                      <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-lg)', color: C.white, marginBottom: 4, lineHeight: 1.2 }}>Currículo + Sala Maker Equipada</p>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, marginBottom: 18 }}>
                        Equipamentos disponibilizados pela We Make — investimento diluído no contrato.
                      </p>
                      <div style={{ height: 1, background: 'rgba(118,243,205,0.12)', marginBottom: 16 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>Por aluno / ano</span>
                          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: C.mint }}>{R$((totalAnual / 12 + mensalComd) * 12 / p.num_alunos)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>Por aluno / mês</span>
                          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.6)' }}>{R$((totalAnual / 12 + mensalComd) / p.num_alunos)}</span>
                        </div>
                        <div style={{ background: 'rgba(118,243,205,0.1)', border: '1px solid rgba(118,243,205,0.3)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: C.mint }}>Parcela mensal escola</span>
                          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 'var(--text-2xl)', color: C.white }}>{R$(totalAnual / 12 + mensalComd)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </>
            ) : (
              <>
                <Reveal delay={80}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>Valor por aluno / ano</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.28)', textDecoration: 'line-through' }}>R$ 420,00</span>
                        <span style={{ background: 'rgba(255,204,0,0.15)', color: C.amber, fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, letterSpacing: '0.08em', border: '1px solid rgba(255,204,0,0.25)' }}>
                          {descPct}% OFF
                        </span>
                      </div>
                      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-display)', color: C.white, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
                        {R$(p.valor_aluno_ano)}
                      </div>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 10, letterSpacing: '0.02em' }}>
                        Valor negociado exclusivo para esta proposta
                      </p>
                    </div>
                    <div style={{ width: 1, alignSelf: 'stretch', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent)', margin: '0 clamp(20px,4vw,48px)' }} />
                    <div>
                      <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>Taxa de Implantação</p>
                      {p.duracao_meses >= 48 && (
                        <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.28)', textDecoration: 'line-through', marginBottom: 8 }}>R$ 5.000,00</p>
                      )}
                      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-4xl)', color: p.duracao_meses >= 48 ? C.mint : C.white, lineHeight: 1, letterSpacing: '-0.03em' }}>
                        {p.duracao_meses >= 48 ? 'ISENTA' : R$(5000)}
                      </div>
                      {p.duracao_meses >= 48 && (
                        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.65rem', color: C.mint, marginTop: 10, letterSpacing: '0.04em' }}>Contratos ≥ 48 meses</p>
                      )}
                    </div>
                  </div>
                </Reveal>
                <Reveal delay={140}>
                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)', marginBottom: 18 }} />
                </Reveal>
                <Reveal delay={180}>
                  <div style={{ borderLeft: `2px solid ${C.mint}`, padding: '10px 18px', marginBottom: 20 }}>
                    <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                      Esta referência facilita a leitura gerencial. O investimento contempla currículo, formação, acompanhamento e implantação — não se reduz ao custo unitário por aluno.
                    </p>
                  </div>
                </Reveal>
                <Reveal delay={240}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
                    {[
                      { label: `Parcela (${p.num_parcelas}×)`, val: R$(parcelaCurr), note: `Total anual ÷ ${p.num_parcelas}`, hi: true },
                      { label: 'Por aluno / ano', val: R$(p.valor_aluno_ano), note: `${p.num_alunos} alunos × ${R$(p.valor_aluno_ano)}`, hi: false },
                      { label: 'Por aluno / mês', val: R$(p.valor_aluno_ano / 12), note: 'Custo unitário mensal', hi: false },
                    ].map((c) => (
                      <div key={c.label} className="surface-glass card-lift" style={{ borderRadius: 16, padding: '18px 20px', borderColor: c.hi ? `rgba(118,243,205,0.25)` : 'rgba(255,255,255,0.08)' }}>
                        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: c.hi ? C.mint : 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{c.label}</p>
                        <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-2xl)', color: c.hi ? C.mint : C.white, lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em' }}>{c.val}</p>
                        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.4 }}>{c.note}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </>
            )}

            <Reveal delay={320}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  `${descPct}% de desconto aplicado`, 'Boleto bancário', 'Vencimento dia 7',
                  'Reajuste anual IPCA', `Validade: ${fmtDate(p.validade)}`,
                ].map(t => (
                  <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Geist, sans-serif', fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.02em' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.mint, flexShrink: 0 }} />{t}
                  </div>
                ))}
              </div>
            </Reveal>

          </div></div>
        </section>

        {hasComodato && (
          <section ref={sec(10)} style={{ scrollSnapAlign: 'start', height: '100dvh', background: C.navy, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'var(--section-py) var(--gutter)', overflow: 'hidden', position: 'relative' }}>
            <Glow color="rgba(255,204,0,0.1)" size={440} style={{ top: -80, right: -80 }} />
            <Glow color="rgba(76,138,222,0.18)" size={380} style={{ bottom: -80, left: -80 }} />

            <div style={{ position: 'relative', zIndex: 2, maxWidth: 920, width: '100%', margin: '0 auto' }}>
              <Reveal>
                <Eyebrow>Resumo Final</Eyebrow>
                <h2 className="text-gradient-cinematic" style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-4xl)', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                  Comparativo dos Modelos
                </h2>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 820, marginBottom: 8 }}>
                  Em ambos os modelos, a implantação do espaço maker considera recursos que apoiam aulas de engenharia, fabricação digital, programação, robótica educacional, eletrônica, cidadania digital e projetos criativos.
                </p>
              </Reveal>

              <Reveal delay={80}>
                <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', background: 'rgba(255,255,255,0.06)', padding: '12px 20px', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)' }}>Critério</span>
                    <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.royal }}>Modelo 1 — Patrimonial</span>
                    <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.mint }}>Modelo 2 — Cessão</span>
                  </div>
                  {[
                    { criterio: 'Formato', m1: 'Escola adquire diretamente os equipamentos da Sala Maker.', m2: 'We Make disponibiliza equipamentos durante a vigência contratual.' },
                    { criterio: 'Propriedade', m1: 'Os recursos pertencem à escola desde a aquisição.', m2: 'Recursos pertencem à We Make durante o contrato; transferência possível ao final.' },
                    { criterio: 'Investimento inicial', m1: R$(sumEquip), m2: '—' },
                    { criterio: 'Parcela mensal', m1: R$(totalAnual / 12), m2: R$(totalAnual / 12 + mensalComd) },
                    { criterio: 'Por aluno / mês', m1: R$(p.valor_aluno_ano / 12), m2: R$((totalAnual / 12 + mensalComd) / (p.num_alunos || 1)) },
                  ].map((row, i) => (
                    <div key={row.criterio} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '12px 20px', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.criterio}</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{row.m1}</span>
                      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: C.mint, lineHeight: 1.5 }}>{row.m2}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            CONTATO — tone: navy (footer do site)
        ══════════════════════════════════════════════════════════════ */}
        <section ref={sec(sections.length - 1)} style={{ scrollSnapAlign: 'start', minHeight: '100dvh', background: C.navy, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 'clamp(40px,6vh,64px) var(--gutter)', overflow: 'hidden', textAlign: 'center', position: 'relative' }}>
          <Glow color="rgba(76,138,222,0.2)" size={600} style={{ top: -150, left: '50%', transform: 'translateX(-50%)' }} />
          <Glow color="rgba(118,243,205,0.12)" size={440} style={{ bottom: -120, left: '50%', transform: 'translateX(-50%)' }} />
          <Aurora color1="rgba(118,243,205,0.08)" color2="rgba(76,138,222,0.1)" style={{ top: -200, right: -200 }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 580, width: '100%' }}>
            <Reveal>
              <img src="/proposta/logo-white.png" alt="We Make" style={{ height: 44, marginBottom: 40, objectFit: 'contain' }} />
              <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'var(--text-5xl)', color: C.white, lineHeight: 1.1, marginBottom: 14, letterSpacing: '-0.025em' }}>
                Quer conversar conosco?
              </h2>
              <p style={{ fontFamily: 'Geist, sans-serif', color: 'rgba(255,255,255,0.5)', fontSize: 'var(--text-base)', lineHeight: 1.75, marginBottom: 32 }}>
                Estamos prontos para transformar a educação de <strong style={{ color: C.white }}>{p.escola_nome}</strong>.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                {[
                  { icon: I.insta(C.mint), label: 'Instagram', val: '@wemake.tec' },
                  { icon: I.mail(C.mint),  label: 'E-mail',    val: 'contato@wemake.tec.br' },
                  { icon: I.phone(C.mint), label: 'WhatsApp',  val: '(83) 98230-1530' },
                  { icon: I.globe(C.mint), label: 'Site',      val: 'wemake.tec.br' },
                ].map(c => (
                  <div key={c.label} className="surface-glass card-lift" style={{ borderRadius: 14, padding: '14px 16px', textAlign: 'left' }}>
                    <div style={{ marginBottom: 8 }}>{c.icon}</div>
                    <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>{c.label}</p>
                    <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 'var(--text-sm)', color: C.white, fontWeight: 500, lineHeight: 1.35 }}>{c.val}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={260}>
              <a href="https://wa.me/5583982301530" target="_blank" rel="noopener noreferrer" className="btn-primary">
                {I.phone('#0b1f44')} Falar com a equipe We Make
              </a>
              <div style={{ marginTop: 24, background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.28)', borderRadius: 14, padding: '14px 20px' }}>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,204,0,0.5)', marginBottom: 8, textAlign: 'center' }}>
                  {countdown?.expired ? 'Proposta expirada' : 'Esta proposta expira em'}
                </p>
                {countdown?.expired ? (
                  <p style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'var(--text-xl)', color: '#f87171', textAlign: 'center' }}>Expirada em {fmtDate(p.validade)}</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
                      {([
                        { v: countdown?.days,    label: 'dias' },
                        { v: countdown?.hours,   label: 'horas' },
                        { v: countdown?.minutes, label: 'min' },
                        { v: countdown?.seconds, label: 'seg' },
                      ] as { v: number | undefined; label: string }[]).map(({ v, label }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <p style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 700, fontSize: 'var(--text-2xl)', color: C.amber, lineHeight: 1, marginBottom: 2 }}>
                            {v !== undefined ? String(v).padStart(2, '0') : '--'}
                          </p>
                          <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.52rem', color: 'rgba(255,204,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.6rem', color: 'rgba(255,204,0,0.4)', textAlign: 'center' }}>até {fmtDate(p.validade)}</p>
                  </>
                )}
              </div>
              <p style={{ marginTop: 20, fontFamily: 'Geist, sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
                © We Make Tecnologia Educacional · Proposta Confidencial
              </p>
            </Reveal>
          </div>
        </section>

      </div>
    </div>
  )
}
