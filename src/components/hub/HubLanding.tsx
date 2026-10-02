'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import MobileNav from '@/components/mobile/MobileNav'
import MobileFooter from '@/components/mobile/MobileFooter'
import { MODULOS } from '@/lib/modulos'

const NAV = MODULOS.map(m => ({ label: m.curto, href: `/modulos/${m.slug}` }))

const DISPLAY = 'var(--font-inter, sans-serif)'

export default function HubLanding() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="hub">
      {/* MOBILE NAV */}
      <div style={{ display: 'none' }} className="mobile-nav-container">
        <MobileNav
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          menuItems={NAV}
          cta={{ label: 'Entrar', href: '/login' }}
        />
      </div>

      {/* TOPBAR */}
      <header className={`hub-top desktop-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="hub-top-in">
          <Link href="/" className="hub-logo" aria-label="We Make — início">
            <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} priority style={{ height: 34, width: 'auto' }} />
          </Link>
          <nav className="hub-nav" aria-label="Seções">
            {NAV.map(n => (
              <Link key={n.label} href={n.href}>{n.label}</Link>
            ))}
            <Link href="/login" className="hub-enter">Entrar</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="hub-hero">
        <div className="hub-hero-bg">
          <Image src="/images/hero-login.png" alt="" fill priority style={{ objectFit: 'cover' }} />
        </div>
        <div className="hub-hero-shade" />
        <div className="hub-hero-in">
          <p className="hub-eyebrow">Gestão geral · We Make</p>
          <h1>
            Tudo o que a We Make precisa para <em>administrar, cobrar, pagar e crescer.</em>
          </h1>
          <p className="hub-lead">
            Ferramenta exclusiva para a equipe interna. Reúne a gestão administrativa, financeira, comercial, de contratos
            e de pedidos, e a Academia We Make, cada uma com o seu acesso.
          </p>
          <div className="hero-cta-row hub-cta">
            <a href="#modulos" className="hub-btn hub-btn--solid">Conhecer os módulos</a>
            <Link href="/login" className="hub-btn hub-btn--line">Entrar na plataforma →</Link>
          </div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="modulos" className="hub-sec hub-sec--ivory">
        <div className="hub-wrap">
          <header className="hub-sec-h">
            <p className="hub-k">Módulos</p>
            <h2>Seis áreas de gestão, cada uma com o seu acesso.</h2>
            <p>Escolha um módulo para ver o que ele representa, as páginas que traz e entrar com o seu usuário.</p>
          </header>

          <ul className="hub-mods">
            {MODULOS.map(m => (
              <li key={m.slug}>
                <Link href={`/modulos/${m.slug}`}>
                  <span className="hub-mod-t">{m.nome}</span>
                  <span className="hub-mod-d">{m.descricao}</span>
                  <span className="hub-mod-a">{m.acessoRotulo}</span>
                  <span className="hub-mod-l">Conhecer e entrar →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hub-foot desktop-footer">
        <div className="hub-wrap hub-foot-in">
          <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} style={{ height: 32, width: 'auto' }} />
          <p>© {new Date().getFullYear()} We Make Educação Tecnológica · Gestão geral</p>
          <div>
            <a href="mailto:contato@wemake.tec.br">contato@wemake.tec.br</a>
            <a href="https://wemake.tec.br" target="_blank" rel="noopener noreferrer">wemake.tec.br</a>
          </div>
        </div>
      </footer>

      <div className="mobile-footer-container">
        <MobileFooter />
      </div>

      <style>{`
        .hub { --ink:#032b36; --ink2:#0b3f4d; --cyan:#00c8ff; --ivory:#f2f0ea; --line:#d8d4c8; min-height:100vh; background:#fbfaf6; color:#15272d; font-family:Georgia, 'Times New Roman', serif; }
        .hub-top { position:fixed; inset:0 0 auto 0; z-index:100; display:flex; background:rgba(3,43,54,.45); backdrop-filter:blur(12px); border-bottom:1px solid transparent; transition:background .25s, border-color .25s; }
        .hub-top.is-scrolled { background:rgba(3,43,54,.94); border-bottom-color:rgba(255,255,255,.1); }
        .hub-top-in { width:100%; max-width:1280px; margin:0 auto; padding:.8rem 1.75rem; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; }
        .hub-logo { display:flex; align-items:center; }
        .hub-nav { display:flex; align-items:center; gap:.15rem; }
        .hub-nav a { font:600 .78rem/1 ${DISPLAY}; color:rgba(255,255,255,.86); text-decoration:none; padding:.6rem .85rem; border-radius:6px; white-space:nowrap; }
        .hub-nav a:hover { background:rgba(255,255,255,.1); color:#fff; }
        .hub-nav a.hub-enter { margin-left:.6rem; background:var(--cyan); color:var(--ink); font-weight:700; border-radius:999px; padding:.6rem 1.15rem; }
        .hub-nav a.hub-enter:hover { background:#4fdcff; }

        .hub-hero { position:relative; min-height:100vh; display:flex; align-items:center; overflow:hidden; background:var(--ink); }
        .hub-hero-bg { position:absolute; inset:0; }
        .hub-hero-shade { position:absolute; inset:0; background:linear-gradient(90deg, rgba(3,43,54,.94) 0%, rgba(3,43,54,.78) 46%, rgba(3,43,54,.5) 100%); }
        .hub-hero-in { position:relative; width:100%; max-width:1280px; margin:0 auto; padding:7rem 1.75rem 4.5rem; }
        .hub-eyebrow { font:600 .72rem/1 ${DISPLAY}; letter-spacing:.2em; text-transform:uppercase; color:var(--cyan); margin:0 0 1.5rem; }
        .hub-hero h1 { font:600 clamp(2.2rem,5vw,4rem)/1.06 ${DISPLAY}; letter-spacing:-.028em; color:#fff; max-width:17ch; margin:0 0 1.5rem; text-wrap:balance; }
        .hub-hero h1 em { font-style:normal; color:var(--cyan); }
        .hub-lead { font:400 clamp(1.05rem,1.4vw,1.25rem)/1.6 Georgia, 'Times New Roman', serif; color:rgba(255,255,255,.82); max-width:56ch; margin:0 0 2.4rem; }
        .hub-cta { display:flex; gap:.85rem; flex-wrap:wrap; }
        .hub-btn { font:700 .92rem/1 ${DISPLAY}; text-decoration:none; padding:1rem 1.8rem; border-radius:999px; display:inline-block; transition:background .15s, border-color .15s; }
        .hub-btn--solid { background:var(--cyan); color:var(--ink); }
        .hub-btn--solid:hover { background:#4fdcff; }
        .hub-btn--line { color:#fff; border:1.5px solid rgba(255,255,255,.4); }
        .hub-btn--line:hover { border-color:var(--cyan); }

        .hub-sec { padding:clamp(3.5rem,7vw,6.5rem) 1.75rem; }
        .hub-sec--ivory { background:var(--ivory); }
        .hub-wrap { max-width:1280px; margin:0 auto; }
        .hub-sec-h { max-width:60ch; margin-bottom:clamp(2rem,4vw,3.5rem); }
        .hub-k { font:700 .68rem/1 ${DISPLAY}; letter-spacing:.2em; text-transform:uppercase; color:#006b8f; margin:0 0 1rem; }
        .hub-sec-h h2 { font:600 clamp(1.7rem,3.4vw,2.6rem)/1.1 ${DISPLAY}; letter-spacing:-.022em; color:var(--ink); margin:0 0 1rem; text-wrap:balance; }
        .hub-sec-h p:last-child { color:#56676d; line-height:1.6; margin:0; }

        .hub-mods { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1.25rem; }
        .hub-mods a { display:flex; flex-direction:column; gap:.75rem; height:100%; padding:1.7rem 1.5rem 1.4rem; background:#fff; border:1px solid var(--line); border-top:4px solid var(--ink); border-radius:0 0 12px 12px; text-decoration:none; color:inherit; transition:border-color .15s, transform .15s; }
        .hub-mods a:hover { border-top-color:var(--cyan); transform:translateY(-2px); }
        .hub-mod-t { font:600 1.3rem/1.2 ${DISPLAY}; letter-spacing:-.012em; color:var(--ink); }
        .hub-mod-d { font-size:.96rem; line-height:1.6; color:#3c4f55; flex:1; }
        .hub-mod-a { font:600 .66rem/1.3 ${DISPLAY}; letter-spacing:.12em; text-transform:uppercase; color:#56676d; }
        .hub-mod-l { font:700 .82rem/1 ${DISPLAY}; color:var(--ink); margin-top:.3rem; }

        .hub-foot { display:none; background:var(--ink); color:#fff; padding:3rem 1.75rem; }
        .hub-foot-in { display:flex; justify-content:space-between; align-items:center; gap:2rem; flex-wrap:wrap; }
        .hub-foot p { margin:0; font:500 .8rem/1.4 ${DISPLAY}; color:rgba(255,255,255,.55); }
        .hub-foot-in div { display:flex; gap:1.5rem; }
        .hub-foot a { color:rgba(255,255,255,.7); font:500 .85rem/1 ${DISPLAY}; text-decoration:none; }
        .hub-foot a:hover { color:#fff; }

        @media (max-width:1100px) { .hub-mods { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (min-width:769px) {
          .desktop-header { display:flex !important; }
          .desktop-footer { display:block !important; }
          .mobile-nav-container, .mobile-footer-container { display:none !important; }
        }
        @media (max-width:768px) {
          html, body { overflow-x:hidden; }
          .desktop-header, .desktop-footer { display:none !important; }
          .mobile-nav-container, .mobile-footer-container { display:block !important; }
          .hub-hero-in { padding:6.5rem 1rem 3rem; }
          .hub-hero h1 { font-size:clamp(1.9rem,8vw,2.6rem); }
          .hero-cta-row { flex-direction:column; width:100%; }
          .hero-cta-row > * { text-align:center; min-height:52px; }
          .hub-sec { padding:2.5rem 1rem; }
          .hub-mods { grid-template-columns:1fr; }
        }
      `}</style>
    </div>
  )
}
