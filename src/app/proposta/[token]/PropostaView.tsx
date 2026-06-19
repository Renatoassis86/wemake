'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ── helpers ──────────────────────────────────────────────────────────────────
const R$ = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

const segLabel = (n: number) =>
  n === 1 ? 'Fund. I' : n === 2 ? 'Fund. I e II' : 'Fund. I, II e Ens. Médio'

// ── brand ─────────────────────────────────────────────────────────────────────
const B = {
  blue:  '#4c8ade',
  mint:  '#76f3cd',
  navy:  '#0b1f44',
  amber: '#ffcc00',
  deepBlue: '#2a69ba',
  softBlue: '#e8f2ff',
  white: '#ffffff',
  gray:  '#f5f7fb',
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
  dados_calculo: any; texto_personalizado: string | null
  created_at: string
}

// ── animated counter ──────────────────────────────────────────────────────────
function Counter({ to, prefix = '', suffix = '', duration = 1400 }: {
  to: number; prefix?: string; suffix?: string; duration?: number
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(ease * to))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])
  return <span ref={ref}>{prefix}{val.toLocaleString('pt-BR')}{suffix}</span>
}

// ── fade-in wrapper ───────────────────────────────────────────────────────────
function Fade({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
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
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : 'translateY(28px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function PropostaView({ proposta: p, isExpired }: { proposta: Proposta; isExpired: boolean }) {
  const [active, setActive] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  const hasComodato = p.tipo === 'curriculo_comodato'
  const totalAnual = p.valor_aluno_ano * p.num_alunos
  const parcelaCurr = totalAnual / p.num_parcelas
  const mensalCurr = totalAnual / 12
  const mensalComodato = p.comodato_parcela ?? 0
  const mensalTotal = mensalCurr + mensalComodato
  const porAluno = mensalTotal / (p.num_alunos || 1)

  const sections = [
    'capa', 'carta', 'div1', 'config', 'investimento', 'escopo',
    ...(hasComodato ? ['div2', 'comodato', 'resumo'] : []),
    'contato',
  ]

  const scrollTo = useCallback((i: number) => {
    const el = sectionRefs.current[i]
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const container = containerRef.current; if (!container) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sectionRefs.current.indexOf(e.target as HTMLElement)
          if (idx >= 0) setActive(idx)
        }
      })
    }, { root: container, threshold: 0.5 })
    sectionRefs.current.forEach(el => { if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  const sec = (i: number) => (el: HTMLElement | null) => { sectionRefs.current[i] = el }

  if (isExpired) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: B.navy, gap: 16, padding: 32 }}>
      <img src="/proposta/logo-white.png" alt="We Make" style={{ height: 36, marginBottom: 16 }} />
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', color: B.white, textAlign: 'center' }}>Proposta expirada</div>
      <div style={{ color: 'rgba(255,255,255,.5)', fontFamily: 'Geist, sans-serif', textAlign: 'center', maxWidth: 380 }}>
        Esta proposta não está mais disponível. Entre em contato com a equipe We Make para renovar.
      </div>
      <a href="mailto:contato@wemake.tec.br" style={{ marginTop: 12, color: B.mint, fontFamily: 'Geist, sans-serif', textDecoration: 'none' }}>
        contato@wemake.tec.br
      </a>
    </div>
  )

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      {/* progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 100, background: 'rgba(255,255,255,.1)' }}>
        <div style={{ height: '100%', background: `linear-gradient(90deg,${B.blue},${B.mint})`, width: `${((active + 1) / sections.length) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      {/* nav dots */}
      <div style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)} aria-label={`Ir para seção ${i + 1}`} style={{
            width: i === active ? 10 : 7, height: i === active ? 10 : 7,
            borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: i === active ? B.mint : 'rgba(255,255,255,.35)',
            transition: 'all .25s', padding: 0,
          }} />
        ))}
      </div>

      {/* scroll container */}
      <div ref={containerRef} style={{ height: '100dvh', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}>

        {/* ── 0 CAPA ───────────────────────────────────────────────────────── */}
        <section ref={sec(0)} style={{ scrollSnapAlign: 'start', height: '100dvh', position: 'relative', display: 'flex', flexDirection: 'column', background: `linear-gradient(135deg, ${B.navy} 0%, #122b5a 60%, #1a3a6e 100%)`, overflow: 'hidden' }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, rgba(76,138,222,.18) 0%, transparent 70%)`, top: -200, right: -100, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(118,243,205,.12) 0%, transparent 70%)`, bottom: -100, left: -50, pointerEvents: 'none' }} />

          {/* header logos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 40px 0', position: 'relative', zIndex: 2 }}>
            <img src="/proposta/logo-white.png" alt="We Make" style={{ height: 30, objectFit: 'contain' }} />
            {p.escola_logo_url
              ? <img src={p.escola_logo_url} alt={p.escola_nome} style={{ height: 44, maxWidth: 140, objectFit: 'contain', borderRadius: 8, background: 'rgba(255,255,255,.08)', padding: 6 }} />
              : <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg,${B.blue},${B.mint})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: '1.1rem', color: B.navy }}>
                  {p.escola_nome.charAt(0)}
                </div>
            }
          </div>

          {/* center content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px', position: 'relative', zIndex: 2 }}>
            <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', color: B.mint, marginBottom: 20 }}>
              PROPOSTA DE PARCERIA
            </div>
            <h1 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2.6rem, 6vw, 4.5rem)', color: B.white, lineHeight: 1.1, marginBottom: 16, maxWidth: 780 }}>
              {p.escola_nome}
            </h1>
            <div style={{ width: 64, height: 2, background: `linear-gradient(90deg,${B.blue},${B.mint})`, margin: '20px auto' }} />
            <p style={{ fontFamily: 'Geist,sans-serif', color: 'rgba(255,255,255,.55)', fontSize: '1rem', maxWidth: 420, lineHeight: 1.65 }}>
              Preparado exclusivamente para você pela equipe We Make
            </p>
            <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 99, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', fontFamily: 'Geist,sans-serif', color: 'rgba(255,255,255,.5)', fontSize: '.8rem' }}>
              Válido até {fmtDate(p.validade)}
            </div>
          </div>

          {/* scroll hint */}
          <div style={{ textAlign: 'center', paddingBottom: 28, position: 'relative', zIndex: 2 }}>
            <button onClick={() => scrollTo(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '0 auto', fontFamily: 'Geist,sans-serif', fontSize: '.7rem', letterSpacing: '.1em' }}>
              <span>DESLIZAR</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'bob 1.8s ease-in-out infinite' }}>
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </button>
          </div>
          <style>{`@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }`}</style>
        </section>

        {/* ── 1 CARTA CEO ──────────────────────────────────────────────────── */}
        <section ref={sec(1)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', alignItems: 'stretch', background: B.white, overflow: 'hidden' }}>
          {/* photo side */}
          <div style={{ width: '38%', minWidth: 0, background: `linear-gradient(160deg,${B.navy},#1a3a6e)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle,rgba(118,243,205,.15) 0%,transparent 70%)`, bottom: -50, right: -50 }} />
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{ width: 160, height: 160, borderRadius: '50%', border: `3px solid ${B.mint}`, padding: 4, background: B.navy }}>
                <img src="/proposta/denis.png" alt="Denis Júlio" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: '50%', background: B.mint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={B.navy}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div style={{ fontFamily: 'Fraunces,serif', fontSize: '1.1rem', color: B.white, fontWeight: 600, textAlign: 'center' }}>Denis Júlio</div>
            <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.75rem', color: B.mint, textAlign: 'center', marginTop: 4 }}>CEO — We Make</div>
            <div style={{ marginTop: 24, width: 40, height: 2, background: `linear-gradient(90deg,${B.blue},${B.mint})` }} />
          </div>

          {/* letter side */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(32px,6vw,72px) clamp(32px,5vw,64px)' }}>
            <Fade>
              <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: B.blue, marginBottom: 20 }}>Carta do CEO</div>
              <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(1.5rem,3vw,2rem)', color: B.navy, marginBottom: 28, fontWeight: 400 }}>
                Prezado(a) {p.escola_nome},
              </h2>
            </Fade>
            <Fade delay={120}>
              <p style={{ fontFamily: 'Geist,sans-serif', fontSize: 'clamp(.88rem,1.2vw,1rem)', color: '#334155', lineHeight: 1.85, marginBottom: 20 }}>
                {p.texto_personalizado
                  ? p.texto_personalizado
                  : `É com grande entusiasmo que apresentamos esta proposta de parceria. A We Make nasce do sonho de transformar a educação no Brasil por meio da tecnologia — não como um fim em si mesmo, mas como um instrumento da Cosmovisão Cristã, baseada no Verdadeiro, no Belo e no Bom.`
                }
              </p>
            </Fade>
            <Fade delay={240}>
              <p style={{ fontFamily: 'Geist,sans-serif', fontSize: 'clamp(.88rem,1.2vw,1rem)', color: '#334155', lineHeight: 1.85, marginBottom: 20 }}>
                Nos últimos anos, temos construído pontes entre tecnologia e propósito pedagógico em escolas que, como a <strong style={{ color: B.navy }}>{p.escola_nome}</strong>, acreditam que educar é mais do que transmitir conteúdo — é formar pessoas.
              </p>
            </Fade>
            <Fade delay={360}>
              <p style={{ fontFamily: 'Geist,sans-serif', fontSize: 'clamp(.88rem,1.2vw,1rem)', color: '#334155', lineHeight: 1.85, marginBottom: 32 }}>
                Esta proposta foi elaborada com cuidado especial para a realidade de vocês. Será uma honra acompanhar a jornada de{' '}
                <strong style={{ color: B.blue }}>{p.num_alunos.toLocaleString('pt-BR')} alunos</strong> nessa transformação.
              </p>
              <div>
                <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.9rem', color: '#64748b', marginBottom: 2 }}>Cordialmente,</div>
                <div style={{ fontFamily: 'Fraunces,serif', fontSize: '1.5rem', color: B.navy, fontWeight: 600, fontStyle: 'italic' }}>Denis Júlio</div>
                <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.8rem', color: B.blue, marginTop: 2 }}>CEO — We Make Tecnologia Educacional</div>
              </div>
            </Fade>
          </div>
        </section>

        {/* ── 2 DIVISÓRIA PARTE 1 ──────────────────────────────────────────── */}
        <section ref={sec(2)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: B.navy, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(160px,28vw,280px)', color: 'rgba(76,138,222,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em' }}>01</div>
          <div style={{ position: 'absolute', width: '100%', height: 2, background: `linear-gradient(90deg,transparent,${B.blue},${B.mint},transparent)`, top: '50%' }} />
          <Fade style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: 32 }}>
            <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.2em', color: B.mint, textTransform: 'uppercase', marginBottom: 16 }}>PARTE 1</div>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', color: B.white, lineHeight: 1.15, marginBottom: 12 }}>
              Proposta de Parceria
            </h2>
            <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(1rem,2.5vw,1.5rem)', color: B.blue, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Currículo We Make
            </div>
          </Fade>
        </section>

        {/* ── 3 CONFIGURAÇÃO ───────────────────────────────────────────────── */}
        <section ref={sec(3)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: B.gray, padding: 'clamp(32px,6vh,64px) clamp(24px,6vw,80px)', overflow: 'auto' }}>
          <Fade>
            <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: B.blue, marginBottom: 12 }}>Configuração</div>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontWeight: 600, fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: B.navy, marginBottom: 36 }}>
              Configuração do Contrato
            </h2>
          </Fade>

          {/* 3 big stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 36 }}>
            {[
              { label: 'Alunos', value: p.num_alunos, suffix: '', note: 'alunos matriculados' },
              { label: 'Segmentos', value: p.segmentos, suffix: '', note: segLabel(p.segmentos) },
              { label: 'Duração', value: p.duracao_meses, suffix: ' meses', note: `${p.duracao_meses / 12} anos de contrato` },
            ].map((s, i) => (
              <Fade key={s.label} delay={i * 100}>
                <div style={{ background: B.white, borderRadius: 16, padding: 'clamp(20px,3vw,32px)', border: `1px solid rgba(76,138,222,.1)`, boxShadow: '0 4px 24px rgba(11,31,68,.06)' }}>
                  <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#94a3b8', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: B.navy, lineHeight: 1, marginBottom: 8 }}>
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.78rem', color: '#64748b' }}>{s.note}</div>
                </div>
              </Fade>
            ))}
          </div>

          {/* included / not included */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Fade delay={300}>
              <div style={{ background: B.white, borderRadius: 14, padding: '20px 24px', border: '1px solid rgba(76,138,222,.1)', boxShadow: '0 2px 12px rgba(11,31,68,.04)' }}>
                <div style={{ fontFamily: 'Geist,sans-serif', fontWeight: 700, fontSize: '.75rem', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>✓</span> Incluído
                </div>
                {['Currículo completo anual', 'Livro Maker do aluno', 'Plataforma digital', 'Acompanhamento pedagógico', 'Formação docente contínua', 'Onboarding presencial', 'Suporte contínuo', 'Memorial descritivo do espaço maker'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontFamily: 'Geist,sans-serif', fontSize: '.82rem', color: '#334155' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: B.mint, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </Fade>
            <Fade delay={400}>
              <div style={{ background: '#fef8f8', borderRadius: 14, padding: '20px 24px', border: '1px solid rgba(220,38,38,.08)', boxShadow: '0 2px 12px rgba(11,31,68,.04)' }}>
                <div style={{ fontFamily: 'Geist,sans-serif', fontWeight: 700, fontSize: '.75rem', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>✗</span> Não incluído
                </div>
                {['Visitas extraordinárias não previstas', 'Formações adicionais fora do escopo', 'Equipamentos e kits físicos*', 'Personalizações fora do padrão', 'Licenças de software externas'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontFamily: 'Geist,sans-serif', fontSize: '.82rem', color: '#64748b' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
                {hasComodato && <div style={{ marginTop: 10, fontSize: '.7rem', color: '#94a3b8', fontFamily: 'Geist,sans-serif', fontStyle: 'italic' }}>* Equipamentos via Comodato — ver Parte 2</div>}
              </div>
            </Fade>
          </div>
        </section>

        {/* ── 4 INVESTIMENTO ───────────────────────────────────────────────── */}
        <section ref={sec(4)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: B.white, padding: 'clamp(32px,6vh,64px) clamp(24px,6vw,80px)', overflow: 'auto' }}>
          <Fade>
            <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: B.blue, marginBottom: 12 }}>Financeiro</div>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontWeight: 600, fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: B.navy, marginBottom: 36 }}>
              Investimento
            </h2>
          </Fade>

          {/* hero price */}
          <Fade delay={100}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Valor por aluno / ano</div>
                <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(3rem,7vw,5rem)', color: B.blue, lineHeight: 1 }}>
                  {R$(p.valor_aluno_ano)}
                </div>
              </div>
              <div style={{ height: 64, width: 1, background: '#e2e8f0', alignSelf: 'flex-end', marginBottom: 8 }} />
              <div>
                <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Taxa de Implantação</div>
                <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(1.5rem,3vw,2.2rem)', color: p.duracao_meses >= 48 ? '#16a34a' : B.navy, lineHeight: 1 }}>
                  {p.duracao_meses >= 48 ? 'ISENTA' : R$(5000)}
                </div>
                {p.duracao_meses >= 48 && <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', color: '#64748b', marginTop: 2 }}>Contratos ≥ 48 meses</div>}
              </div>
            </div>
          </Fade>

          {/* financials grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Anual', value: R$(totalAnual), note: `${p.num_alunos.toLocaleString('pt-BR')} al. × ${R$(p.valor_aluno_ano)}`, color: B.navy },
              { label: `Parcela (${p.num_parcelas}x)`, value: R$(parcelaCurr), note: `Total anual ÷ ${p.num_parcelas}`, color: B.blue },
              { label: 'Por aluno / mês', value: R$(p.valor_aluno_ano / 12), note: 'Custo unitário mensal', color: B.deepBlue },
            ].map((c, i) => (
              <Fade key={c.label} delay={200 + i * 80}>
                <div style={{ background: B.gray, borderRadius: 12, padding: '18px 22px', border: '1px solid rgba(76,138,222,.08)' }}>
                  <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94a3b8', marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(1.2rem,2vw,1.6rem)', color: c.color, lineHeight: 1, marginBottom: 4 }}>{c.value}</div>
                  <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', color: '#94a3b8' }}>{c.note}</div>
                </div>
              </Fade>
            ))}
          </div>

          <Fade delay={500}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Boleto bancário', 'Vencimento dia 7', 'Reajuste anual IPCA', `Início: ${fmtDate(p.validade)}`].map(tag => (
                <div key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(76,138,222,.07)', border: '1px solid rgba(76,138,222,.15)', fontFamily: 'Geist,sans-serif', fontSize: '.78rem', color: B.deepBlue }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: B.blue }} />
                  {tag}
                </div>
              ))}
            </div>
          </Fade>
        </section>

        {/* ── 5 ESCOPO ─────────────────────────────────────────────────────── */}
        <section ref={sec(5)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: `linear-gradient(135deg,${B.navy} 0%,#122b5a 100%)`, padding: 'clamp(32px,6vh,64px) clamp(24px,6vw,80px)', overflow: 'auto' }}>
          <Fade>
            <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: B.mint, marginBottom: 12 }}>Escopo</div>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontWeight: 600, fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: B.white, marginBottom: 36 }}>
              O que está incluído
            </h2>
          </Fade>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {[
              { icon: '📚', title: 'Currículo Completo', desc: 'Conteúdo maker anual alinhado à BNCC' },
              { icon: '📖', title: 'Livro Maker do Aluno', desc: 'Material físico por estudante' },
              { icon: '💻', title: 'Plataforma Digital', desc: 'LMS exclusivo com trilhas maker' },
              { icon: '🧑‍🏫', title: 'Formação Docente', desc: 'Capacitação contínua para professores' },
              { icon: '🚀', title: 'Onboarding Presencial', desc: 'Implantação com equipe We Make' },
              { icon: '🎯', title: 'Acompanhamento', desc: 'Pedagógico, tecnológico e teológico' },
              { icon: '💬', title: 'Suporte Contínuo', desc: 'Atendimento durante todo o contrato' },
              { icon: '🗺️', title: 'Memorial Descritivo', desc: 'Projeto do espaço maker' },
            ].map((item, i) => (
              <Fade key={item.title} delay={i * 60}>
                <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(118,243,205,.1)', backdropFilter: 'blur(4px)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontFamily: 'Geist,sans-serif', fontWeight: 600, fontSize: '.88rem', color: B.white, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.75rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* ── COMODATO SECTIONS ─────────────────────────────────────────────── */}
        {hasComodato && (
          <>
            {/* ── 6 DIVISÓRIA PARTE 2 ──────────────────────────────────────── */}
            <section ref={sec(6)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/proposta/sala-maker.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.22)' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,rgba(11,31,68,.92),rgba(26,58,110,.82))` }} />
              <div style={{ position: 'absolute', inset: 0, fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(160px,28vw,280px)', color: 'rgba(118,243,205,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, userSelect: 'none', letterSpacing: '-0.04em' }}>02</div>
              <Fade style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: 32 }}>
                <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.2em', color: B.mint, textTransform: 'uppercase', marginBottom: 16 }}>PARTE 2</div>
                <h2 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', color: B.white, lineHeight: 1.15, marginBottom: 12 }}>
                  Espaço Maker
                </h2>
                <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(1rem,2.5vw,1.5rem)', color: B.blue, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  Comodato de Equipamentos
                </div>
              </Fade>
            </section>

            {/* ── 7 COMODATO ───────────────────────────────────────────────── */}
            <section ref={sec(7)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: `linear-gradient(135deg,#0a1628,#0f2040)`, padding: 'clamp(32px,6vh,64px) clamp(24px,6vw,80px)', overflow: 'auto' }}>
              <Fade>
                <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: B.mint, marginBottom: 12 }}>Equipamentos</div>
                <h2 style={{ fontFamily: 'Fraunces,serif', fontWeight: 600, fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: B.white, marginBottom: 8 }}>
                  Cessão de Equipamentos
                </h2>
                <p style={{ fontFamily: 'Geist,sans-serif', color: 'rgba(255,255,255,.5)', fontSize: '.9rem', marginBottom: 32, maxWidth: 560, lineHeight: 1.65 }}>
                  A We Make disponibiliza todos os equipamentos durante o contrato e transfere o patrimônio à escola ao final do período.
                </p>
              </Fade>

              {/* stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Notebooks', value: p.comodato_notebooks ?? 0, suffix: ' unid.', color: B.mint },
                  { label: 'PV (Investimento)', value: 0, formatted: R$(p.comodato_pv ?? 0), color: B.blue },
                  { label: 'Retorno Garantido', value: 0, formatted: `${p.comodato_retorno_pct ?? 200}%`, color: B.amber },
                  { label: 'Duração', value: p.duracao_meses, suffix: ' meses', color: B.white },
                ].map((s, i) => (
                  <Fade key={s.label} delay={i * 80}>
                    <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '22px 24px', border: '1px solid rgba(118,243,205,.1)' }}>
                      <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', color: s.color, lineHeight: 1 }}>
                        {s.formatted ? s.formatted : <Counter to={s.value} suffix={s.suffix} />}
                      </div>
                    </div>
                  </Fade>
                ))}
              </div>

              <Fade delay={400}>
                <div style={{ background: `linear-gradient(135deg,rgba(76,138,222,.15),rgba(118,243,205,.08))`, borderRadius: 14, padding: '18px 24px', border: '1px solid rgba(76,138,222,.2)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.65rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Parcela mensal</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: '2rem', color: B.blue }}>{R$(p.comodato_parcela ?? 0)}</div>
                  </div>
                  <div style={{ height: 44, width: 1, background: 'rgba(255,255,255,.1)' }} />
                  <div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.65rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Por aluno / mês</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: '2rem', color: 'rgba(255,255,255,.85)' }}>{R$((p.comodato_parcela ?? 0) / (p.num_alunos || 1))}</div>
                  </div>
                </div>
              </Fade>
            </section>

            {/* ── 8 RESUMO TOTAL ───────────────────────────────────────────── */}
            <section ref={sec(8)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: B.gray, padding: 'clamp(32px,6vh,64px) clamp(24px,6vw,80px)', overflow: 'auto' }}>
              <Fade>
                <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: B.blue, marginBottom: 12 }}>Resumo</div>
                <h2 style={{ fontFamily: 'Fraunces,serif', fontWeight: 600, fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: B.navy, marginBottom: 36 }}>
                  Investimento Total Combinado
                </h2>
              </Fade>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <Fade delay={100}>
                  <div style={{ background: B.white, borderRadius: 16, padding: '28px 32px', border: '1px solid rgba(76,138,222,.1)', boxShadow: '0 4px 20px rgba(11,31,68,.06)' }}>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94a3b8', marginBottom: 12 }}>Currículo We Make</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: B.blue, marginBottom: 4 }}>{R$(mensalCurr)}<span style={{ fontSize: '1rem', fontWeight: 400, color: '#94a3b8' }}>/mês</span></div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.75rem', color: '#64748b' }}>{p.num_alunos.toLocaleString('pt-BR')} al. × {R$(p.valor_aluno_ano)}/ano ÷ 12</div>
                  </div>
                </Fade>
                <Fade delay={180}>
                  <div style={{ background: `linear-gradient(135deg,${B.navy},#1a3a6e)`, borderRadius: 16, padding: '28px 32px', boxShadow: '0 4px 20px rgba(11,31,68,.12)' }}>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: B.mint, marginBottom: 12 }}>Comodato Equipamentos</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: B.white, marginBottom: 4 }}>{R$(mensalComodato)}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,.4)' }}>/mês</span></div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.75rem', color: 'rgba(255,255,255,.45)' }}>{p.duracao_meses} parcelas mensais fixas</div>
                  </div>
                </Fade>
              </div>

              <Fade delay={300}>
                <div style={{ background: `linear-gradient(135deg,${B.blue},${B.deepBlue})`, borderRadius: 16, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, boxShadow: '0 8px 32px rgba(76,138,222,.3)' }}>
                  <div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>Total escola / mês</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(2.2rem,4vw,3rem)', color: B.white, lineHeight: 1 }}>{R$(mensalTotal)}</div>
                  </div>
                  <div style={{ height: 52, width: 1, background: 'rgba(255,255,255,.2)' }} />
                  <div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>Por aluno / mês</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(2.2rem,4vw,3rem)', color: B.mint, lineHeight: 1 }}>{R$(porAluno)}</div>
                  </div>
                  <div style={{ height: 52, width: 1, background: 'rgba(255,255,255,.2)' }} />
                  <div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>Total contrato ({p.duracao_meses}m)</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 'clamp(2.2rem,4vw,3rem)', color: B.amber, lineHeight: 1 }}>{R$(mensalTotal * p.duracao_meses)}</div>
                  </div>
                </div>
              </Fade>
            </section>
          </>
        )}

        {/* ── CONTATO ──────────────────────────────────────────────────────── */}
        <section ref={sec(sections.length - 1)} style={{ scrollSnapAlign: 'start', height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: B.navy, padding: 'clamp(32px,6vh,64px) clamp(24px,6vw,80px)', overflow: 'auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(76,138,222,.18) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 560, width: '100%' }}>
            <Fade>
              <img src="/proposta/logo-white.png" alt="We Make" style={{ height: 36, marginBottom: 32, objectFit: 'contain' }} />
              <h2 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: B.white, lineHeight: 1.2, marginBottom: 12 }}>
                Próximos Passos
              </h2>
              <p style={{ fontFamily: 'Geist,sans-serif', color: 'rgba(255,255,255,.5)', fontSize: '.95rem', lineHeight: 1.7, marginBottom: 36 }}>
                Estamos prontos para transformar a educação de <strong style={{ color: B.white }}>{p.escola_nome}</strong>. Entre em contato para avançar.
              </p>
            </Fade>

            <Fade delay={150}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
                {[
                  { icon: '📸', label: 'Instagram', value: '@wemake.tec' },
                  { icon: '✉️', label: 'E-mail', value: 'contato@wemake.tec.br' },
                  { icon: '📞', label: 'WhatsApp', value: '(83) 98230-1530' },
                  { icon: '🌐', label: 'Site', value: 'wemake.tec.br' },
                ].map(c => (
                  <div key={c.label} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 18px', textAlign: 'left' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>{c.icon}</div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.62rem', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontFamily: 'Geist,sans-serif', fontSize: '.88rem', color: B.mint, fontWeight: 500 }}>{c.value}</div>
                  </div>
                ))}
              </div>
            </Fade>

            <Fade delay={300}>
              <a href="https://wa.me/5583982301530" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 99, background: `linear-gradient(135deg,${B.blue},${B.deepBlue})`, color: B.white, fontFamily: 'Geist,sans-serif', fontWeight: 600, fontSize: '.9rem', textDecoration: 'none', boxShadow: '0 8px 24px rgba(76,138,222,.4)', letterSpacing: '.02em' }}>
                Falar com a equipe We Make
              </a>
              <div style={{ marginTop: 32, fontFamily: 'Geist,sans-serif', fontSize: '.68rem', color: 'rgba(255,255,255,.2)' }}>
                © We Make Tecnologia Educacional — Proposta Confidencial · Válida até {fmtDate(p.validade)}
              </div>
            </Fade>
          </div>
        </section>

      </div>
    </div>
  )
}
