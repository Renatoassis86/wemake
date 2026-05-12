'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const MODULES = [
  {
    id: 'comercial',
    label: 'Gestão Comercial',
    tagline: 'Plataforma de inteligência comercial',
    description:
      'Cadastro de escolas, pipeline Kanban, registros de negociação, contratos, dashboard e indicadores em tempo real para suas parcerias educacionais.',
    href: '/login',
    color: '#5FE3D0',
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v4H3z" /><path d="M3 11h18v10H3z" /><path d="M8 7v14" /><path d="M16 7v14" />
      </svg>
    ),
    features: ['Pipeline Kanban', 'Escolas parceiras', 'Dashboard tempo real', 'Jornada educacional'],
    status: 'ativo',
  },
  {
    id: 'contratos',
    label: 'Gestão de Contratos',
    tagline: 'Plataforma de contratos e assinaturas',
    description:
      'Gestão de contratos digitais, assinaturas eletrônicas seguras, templates reutilizáveis e acompanhamento centralizado de toda a documentação.',
    href: '#',
    color: '#4A7FDB',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
    features: ['Contratos digitais', 'Assinatura eletrônica', 'Auditoria completa', 'Templates reutilizáveis'],
    status: 'em breve',
  },
  {
    id: 'censo',
    label: 'Censo Escolar',
    tagline: 'Integração contínua com alunos',
    description:
      'Coleta de dados em momentos estratégicos do ano para criar perfis detalhados de alunos e oferecer experiências customizadas baseadas em insights reais.',
    href: '#',
    color: '#7C3AED',
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><circle cx="9" cy="9" r="1" /><circle cx="15" cy="9" r="1" />
      </svg>
    ),
    features: ['Coleta estratégica de dados', 'Perfis de alunos', 'Experiências customizadas', 'Análise de evolução'],
    status: 'em breve',
  },
]

export default function HubLanding() {
  const [scrolled, setScrolled] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(0)
  const videos = ['hero.mp4', 'hero1.mp4', 'hero2.mp4']

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-rotate videos com fade suave
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length)
    }, 8000) // Troca a cada 8 segundos, antes do texto aparecer

    return () => clearInterval(timer)
  }, [])

  function scrollToModulos() {
    document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#0f172a' }}>

      {/* ══════════ TOPBAR ══════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(15,23,42,.92)' : 'rgba(15,23,42,.4)',
        backdropFilter: 'blur(14px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
        transition: 'all .3s',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '.85rem 1.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem',
        }}>
          {/* Logo We Make - Official */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', height: '44px', minWidth: '160px' }}>
            <Image
              src="/images/we-make-1.png"
              alt="We Make"
              width={160}
              height={44}
              style={{ objectFit: 'contain', objectPosition: 'left', opacity: 0.95 }}
              priority
            />
          </Link>

          {/* Menu de módulos */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }} className="hub-nav">
            {MODULES.map(m => (
              <Link key={m.id} href={m.href}
                style={{
                  padding: '.5rem .95rem', borderRadius: 8,
                  fontSize: '.78rem', fontWeight: 600,
                  color: 'rgba(255,255,255,.85)', textDecoration: 'none',
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  transition: 'background .15s, color .15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.08)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,.85)'
                }}
              >
                {m.label}
              </Link>
            ))}
            <Link href="/login" style={{
              marginLeft: '.5rem', padding: '.5rem 1.1rem', borderRadius: 9999,
              background: 'linear-gradient(135deg, #5FE3D0, #4A7FDB)',
              color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '.78rem',
              fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: '0 4px 14px rgba(95,227,208,.4)',
            }}>
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* ══════════ HERO COM VÍDEOS ══════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        {/* Vídeos em rotação com fade */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {videos.map((video, idx) => (
            <video
              key={idx}
              autoPlay={idx === currentVideo}
              muted
              playsInline
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
                opacity: idx === currentVideo ? 1 : 0,
                transition: 'opacity 1.5s ease-in-out',
              }}
              onEnded={() => {
                if (idx === currentVideo) {
                  setCurrentVideo((prev) => (prev + 1) % videos.length)
                }
              }}
            >
              <source src={`/videos/${video}`} type="video/mp4" />
            </video>
          ))}
        </div>

        {/* Máscara superior para cortar textos (fade out antes deles aparecerem) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '20%',
          zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(15,23,42,.95), transparent)',
        }} />

        {/* Overlay escuro principal */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(180deg, rgba(15,23,42,.75) 0%, rgba(15,23,42,.65) 50%, rgba(15,23,42,.85) 100%)',
        }} />

        {/* Máscara inferior para cortar textos */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20%',
          zIndex: 1,
          background: 'linear-gradient(to top, rgba(15,23,42,.95), transparent)',
        }} />

        {/* Conteúdo do hero */}
        <div style={{
          position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto',
          padding: '7rem 1.75rem 4rem', width: '100%',
        }}>
          <div style={{ maxWidth: 780 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.45rem',
              background: 'rgba(95,227,208,.15)', border: '1px solid rgba(95,227,208,.4)',
              borderRadius: 9999, padding: '.4rem 1rem', marginBottom: '1.75rem',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5FE3D0' }} />
              <span style={{ fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: '#5FE3D0', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Gestão Comercial Para Educação
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-cormorant,serif)',
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              fontWeight: 700, color: '#fff', lineHeight: 1.05,
              letterSpacing: '-.02em', marginBottom: '1.5rem',
            }}>
              Gestão comercial<br />
              <span style={{
                background: 'linear-gradient(135deg, #5FE3D0, #4A7FDB)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                inteligente e integrada
              </span>
            </h1>

            <p style={{
              fontFamily: 'var(--font-inter,sans-serif)',
              fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
              color: 'rgba(255,255,255,.78)', lineHeight: 1.65,
              maxWidth: 640, marginBottom: '2.5rem',
            }}>
              Ferramenta exclusiva para a equipe interna da We Make. Gerencie escolas parceiras, registre interações, acompanhe negociações e monitore indicadores comerciais em tempo real.
            </p>

            <div style={{ display: 'flex', gap: '.85rem', flexWrap: 'wrap' }}>
              <button onClick={scrollToModulos} style={{
                padding: '.8rem 2.2rem', borderRadius: 9999, fontWeight: 700,
                background: 'linear-gradient(135deg, #5FE3D0, #4A7FDB)', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: '.95rem',
                fontFamily: 'var(--font-montserrat,sans-serif)',
                boxShadow: '0 4px 20px rgba(95,227,208,.4)',
                transition: 'all .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(95,227,208,.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(95,227,208,.4)' }}
              >
                Conhecer os módulos
              </button>
              <Link href="/login" style={{
                padding: '.8rem 2.2rem', borderRadius: 9999, fontWeight: 700,
                background: 'rgba(255,255,255,.1)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,.2)', cursor: 'pointer', fontSize: '.95rem',
                fontFamily: 'var(--font-montserrat,sans-serif)',
                textDecoration: 'none',
                transition: 'all .2s',
                display: 'inline-block',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(95,227,208,.1)'; e.currentTarget.style.borderColor = 'rgba(95,227,208,.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)' }}
              >
                Entrar na plataforma →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ MÓDULOS ══════════ */}
      <section id="modulos" style={{ background: '#fff', padding: '6rem 1.75rem', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-cormorant,serif)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700, color: '#0f172a', marginBottom: '1rem',
            }}>
              Módulos da Plataforma
            </h2>
            <p style={{
              fontFamily: 'var(--font-inter,sans-serif)',
              fontSize: '1.05rem', color: 'rgba(15,23,42,.7)',
              maxWidth: 600, margin: '0 auto',
            }}>
              Soluções completas para gestão comercial educacional
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {MODULES.map(m => (
              <div key={m.id} style={{
                background: m.bg, borderRadius: 16, padding: '2.5rem 2rem',
                border: `1px solid ${m.color}33`,
                transition: 'all .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}20` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: m.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#fff', marginBottom: '1.5rem',
                }}>
                  {m.icon}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-cormorant,serif)',
                  fontSize: '1.3rem', fontWeight: 700, color: '#0f172a',
                  marginBottom: '.3rem',
                }}>
                  {m.label}
                </h3>

                <p style={{
                  fontSize: '.8rem', color: m.color, fontWeight: 600,
                  marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)',
                  textTransform: 'uppercase', letterSpacing: '.05em',
                }}>
                  {m.tagline}
                </p>

                <p style={{
                  fontSize: '.95rem', color: 'rgba(15,23,42,.7)',
                  lineHeight: 1.6, marginBottom: '1.5rem',
                  fontFamily: 'var(--font-inter,sans-serif)',
                }}>
                  {m.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBottom: '1.5rem' }}>
                  {m.features.map(f => (
                    <span key={f} style={{
                      fontSize: '.75rem', background: 'rgba(15,23,42,.05)',
                      padding: '.4rem .8rem', borderRadius: 6, color: '#0f172a',
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                    }}>
                      {f}
                    </span>
                  ))}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontSize: '.75rem', fontWeight: 700, color: m.color,
                    textTransform: 'uppercase', fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>
                    {m.status}
                  </span>
                  {m.href !== '#' && (
                    <Link href={m.href} style={{
                      color: m.color, textDecoration: 'none', fontWeight: 600,
                      fontSize: '.85rem', fontFamily: 'var(--font-montserrat,sans-serif)',
                    }}>
                      Acessar →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{
        background: '#0f172a', borderTop: '1px solid rgba(255,255,255,.06)',
        padding: '4rem 1.75rem 2rem', color: '#fff',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr',
            gap: '3rem', marginBottom: '3rem',
          }}>
            {/* Coluna 1 - Branding We Make */}
            <div>
              <p style={{
                fontFamily: 'var(--font-cormorant,serif)',
                fontSize: '1rem', fontStyle: 'italic',
                color: 'rgba(255,255,255,.5)', lineHeight: 1.6,
                marginBottom: '1.5rem', maxWidth: 300,
              }}>
                Transformando educação através da tecnologia e inovação comercial.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                <a href="mailto:comercial@wemake.org" style={{
                  color: 'rgba(255,255,255,.45)', textDecoration: 'none',
                  fontSize: '.85rem', fontFamily: 'var(--font-inter,sans-serif)',
                }}>
                  📧 comercial@wemake.org
                </a>
                <a href="https://wemake.com.br" target="_blank" rel="noopener noreferrer" style={{
                  color: 'rgba(255,255,255,.45)', textDecoration: 'none',
                  fontSize: '.85rem', fontFamily: 'var(--font-inter,sans-serif)',
                }}>
                  🌐 wemake.com.br
                </a>
              </div>
            </div>

            {/* Coluna 2 - Módulos */}
            <div>
              <h4 style={{
                fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase',
                color: '#5FE3D0', marginBottom: '1.2rem',
                fontFamily: 'var(--font-montserrat,sans-serif)',
              }}>
                Módulos
              </h4>
              {MODULES.map(m => (
                <p key={m.id} style={{
                  fontSize: '.85rem', color: 'rgba(255,255,255,.4)',
                  padding: '.3rem 0', fontFamily: 'var(--font-inter,sans-serif)',
                }}>
                  {m.label}
                </p>
              ))}
            </div>

            {/* Coluna 3 - Links */}
            <div>
              <h4 style={{
                fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase',
                color: '#5FE3D0', marginBottom: '1.2rem',
                fontFamily: 'var(--font-montserrat,sans-serif)',
              }}>
                Links
              </h4>
              <a href="https://wemake.com.br" target="_blank" rel="noopener noreferrer" style={{
                display: 'block', color: 'rgba(255,255,255,.4)', textDecoration: 'none',
                fontSize: '.85rem', padding: '.2rem 0', fontFamily: 'var(--font-inter,sans-serif)',
              }}>
                Sobre We Make
              </a>
              <a href="/login" style={{
                display: 'block', color: 'rgba(255,255,255,.4)', textDecoration: 'none',
                fontSize: '.85rem', padding: '.2rem 0', fontFamily: 'var(--font-inter,sans-serif)',
              }}>
                Plataforma de Login
              </a>
            </div>
          </div>

          {/* Logo We Make - Linha Separada */}
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
            <Image
              src="/images/we-make-1.png"
              alt="We Make"
              width={140}
              height={44}
              style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
            />
          </div>

          {/* Bottom bar com logo Arkos */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: '1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1rem',
          }}>
            <p style={{
              fontSize: '.75rem', color: 'rgba(255,255,255,.2)',
              fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              © 2025 We Make · Gestão Comercial para Educação
            </p>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M12 8L14 12L12 16L10 12Z" stroke="white" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
        </div>
      </footer>
    </div>
  )
}
