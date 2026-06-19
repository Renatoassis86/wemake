'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, ArrowLeft, ClipboardList, Phone, Mail, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import MobileNav from '@/components/mobile/MobileNav'
import MobileFooter from '@/components/mobile/MobileFooter'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [currentVideo, setCurrentVideo] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const videos = ['hero.mp4', 'hero1.mp4', 'hero2.mp4']

  // Auto-rotate videos com fade suave
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length)
    }, 8000) // Troca a cada 8 segundos, antes do texto aparecer

    return () => clearInterval(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }
    window.location.href = '/comercial'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-inter, var(--font-montserrat), system-ui, sans-serif)',
      background: '#0f172a',
    }}>

      {/* ══════════════════════════════════════════════════════════
          MOBILE NAV (mobile only)
          ══════════════════════════════════════════════════════════ */}
      <div style={{ display: 'none' }} className="mobile-nav-container">
        <MobileNav
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          menuItems={[
            { label: 'Início', href: '/' },
            { label: 'Sobre We Make', href: 'https://wemake.tec.br' },
            { label: 'Contato', href: 'mailto:contato@wemake.tec.br' },
          ]}
          cta={{ label: 'Formulário da Escola', href: '/formulario' }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE TOP CTA - Formulário da Escola com destaque
          ══════════════════════════════════════════════════════════ */}
      <div className="mobile-cta-header" style={{
        display: 'none',
        background: 'linear-gradient(135deg, rgba(95,227,208,.2) 0%, rgba(95,227,208,.1) 100%)',
        borderBottom: '2px solid #5FE3D0',
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <a href="/formulario" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem',
          background: '#5FE3D0', color: '#0f172a',
          padding: '.8rem 1.2rem', borderRadius: 9999,
          fontSize: '.9rem', fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 6px 20px rgba(95,227,208,.5)',
          fontFamily: 'var(--font-montserrat, sans-serif)',
          width: '100%', justifyContent: 'center', textAlign: 'center',
        }}
          onTouchStart={e => { e.currentTarget.style.background = '#4A7FDB'; e.currentTarget.style.color = '#fff' }}
          onTouchEnd={e => { e.currentTarget.style.background = '#5FE3D0'; e.currentTarget.style.color = '#0f172a' }}
        >
          <ClipboardList size={18} />
          <span>Formulário da Escola</span>
        </a>
      </div>

      {/* ══════════════════════════════════════════════════════════
          HEADER — Logo + link formulário (desktop only)
          ══════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(15,23,42,.9) 0%, transparent 100%)',
      }} className="desktop-header">
        <Link href="/" aria-label="Voltar à página inicial" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Image
            src="/images/we-make-1.png"
            alt="We Make"
            width={160}
            height={44}
            style={{ objectFit: 'contain', opacity: 0.92, width: 'auto', height: 'auto', cursor: 'pointer' }}
            priority
          />
        </Link>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.35rem',
            background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)',
            padding: '.45rem 1rem', borderRadius: 9999,
            fontSize: '.78rem', fontWeight: 600, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,.15)',
            fontFamily: 'var(--font-montserrat, sans-serif)',
            transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.14)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'rgba(255,255,255,.85)' }}
          >
            <ArrowLeft size={14} />
            Voltar ao início
          </Link>
          <a href="/formulario" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            background: '#5FE3D0', color: '#0f172a',
            padding: '.45rem 1.1rem', borderRadius: 9999,
            fontSize: '.78rem', fontWeight: 700, textDecoration: 'none',
          letterSpacing: '.03em', boxShadow: '0 4px 14px rgba(95,227,208,.4)',
          transition: 'all .2s',
          fontFamily: 'var(--font-montserrat, sans-serif)',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4A7FDB'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#5FE3D0'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
            <ClipboardList size={14} />
            Formulário da Escola
          </a>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO — Vídeo de fundo + conteúdo + formulário de login
          ══════════════════════════════════════════════════════════ */}
      <section style={{
        flex: 1, position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        overflow: 'hidden',
      }}>

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

        {/* Máscara superior para cortar textos */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '20%',
          zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(15,23,42,.95), transparent)',
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

        {/* Overlay gradiente profundo */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(110deg, rgba(15,23,42,.95) 0%, rgba(15,23,42,.8) 45%, rgba(15,23,42,.6) 100%)',
        }} />

        {/* Conteúdo principal */}
        <div className="hero-grid" style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 1200,
          margin: '0 auto',
          padding: '7rem 2rem 4rem',
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: '4rem',
          alignItems: 'center',
        }}>

          {/* Coluna esquerda — Texto hero */}
          <div>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              background: 'rgba(15,23,42,.7)',
              border: '1px solid rgba(95,227,208,.4)',
              backdropFilter: 'blur(8px)',
              borderRadius: 9999, padding: '.3rem .9rem',
              marginBottom: '1.5rem',
              fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em',
              textTransform: 'uppercase', color: '#5FE3D0',
              fontFamily: 'var(--font-montserrat, sans-serif)',
              boxShadow: '0 4px 16px rgba(0,0,0,.3)',
            }}>
              ✦ Plataforma Interna — Equipe We Make
            </div>

            {/* Título Cormorant */}
            <h1 style={{
              fontFamily: 'var(--font-cormorant, serif)',
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 700, lineHeight: 1.1, color: '#fff',
              marginBottom: '1rem',
              textShadow: '0 2px 20px rgba(0,0,0,.5)',
              textWrap: 'balance' as any,
            }}>
              Gestão comercial<br />
              <span style={{ color: '#5FE3D0' }}>inteligente e integrada</span>
            </h1>

            <p style={{
              fontSize: '1rem', color: 'rgba(255,255,255,.7)',
              lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 480,
              fontFamily: 'var(--font-inter, sans-serif)',
            }}>
              Ferramenta exclusiva para a equipe interna We Make. Gerencie escolas parceiras, registre interações, acompanhe negociações e monitore indicadores comerciais em tempo real.
            </p>

            {/* Bloco para escolas parceiras */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(95,227,208,.18) 0%, rgba(95,227,208,.08) 100%)',
              border: '1px solid rgba(95,227,208,.35)',
              borderLeft: '4px solid #5FE3D0',
              borderRadius: 14, padding: '1.35rem 1.5rem',
              backdropFilter: 'blur(8px)',
              maxWidth: 500,
              boxShadow: '0 8px 32px rgba(95,227,208,.12)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Ícone */}
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, #5FE3D0, #4A7FDB)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(95,227,208,.4)',
                }}>
                  <ClipboardList size={21} color="#fff" />
                </div>

                <div style={{ flex: 1 }}>
                  {/* Eyebrow label */}
                  <div style={{
                    fontSize: '.6rem', fontWeight: 800, letterSpacing: '.1em',
                    textTransform: 'uppercase', color: '#5FE3D0',
                    marginBottom: '.3rem',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                  }}>
                    ✦ Sua escola quer ser parceira We Make?
                  </div>

                  {/* Título */}
                  <div style={{
                    fontFamily: 'var(--font-cormorant, serif)',
                    fontSize: '1.1rem', fontWeight: 700, color: '#fff',
                    lineHeight: 1.2, marginBottom: '.5rem',
                  }}>
                    Parceria Educacional
                  </div>

                  {/* Descrição */}
                  <p style={{
                    fontSize: '.78rem', color: 'rgba(255,255,255,.7)',
                    lineHeight: 1.6, marginBottom: '.9rem',
                    fontFamily: 'var(--font-inter, sans-serif)',
                  }}>
                    Preencha o formulário de pré-cadastro e nossa equipe We Make entrará em contato com uma proposta personalizada para a sua escola.
                  </p>

                  {/* CTA */}
                  <a href="/formulario" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.45rem',
                    background: '#5FE3D0', color: '#0f172a',
                    padding: '.55rem 1.25rem', borderRadius: 9999,
                    fontSize: '.8rem', fontWeight: 700, textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(95,227,208,.45)',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                    letterSpacing: '.01em',
                  }}>
                    Acessar Formulário de Pré-Cadastro <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita — Card de Login */}
          <div style={{
            background: 'rgba(15,23,42,.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 20,
            padding: '2.5rem',
            boxShadow: '0 24px 64px rgba(0,0,0,.5)',
          }}>

            {/* Header do card */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{
                fontSize: '.65rem', fontWeight: 700, letterSpacing: '.12em',
                textTransform: 'uppercase', color: '#5FE3D0', marginBottom: '.65rem',
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                ✦ Acesso Restrito — Equipe We Make
              </div>
              <h2 style={{
                fontFamily: 'var(--font-cormorant, serif)',
                fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1.2,
              }}>
                Entre na plataforma
              </h2>
              <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.45)', marginTop: '.3rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                Use as credenciais fornecidas pelo seu gestor
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)',
                borderRadius: 8, padding: '.7rem 1rem', marginBottom: '1.25rem',
                color: '#fca5a5', fontSize: '.82rem',
                fontFamily: 'var(--font-inter, sans-serif)',
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '.68rem', fontWeight: 700,
                  color: 'rgba(255,255,255,.45)', marginBottom: '.4rem',
                  textTransform: 'uppercase', letterSpacing: '.08em',
                  fontFamily: 'var(--font-montserrat, sans-serif)',
                }}>E-mail</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoFocus placeholder="seu@wemake.tec.br"
                  style={{
                    width: '100%', padding: '.75rem 1rem',
                    background: 'rgba(255,255,255,.06)',
                    border: '1.5px solid rgba(255,255,255,.1)',
                    borderRadius: 10, outline: 'none',
                    color: '#fff', fontSize: '.875rem',
                    transition: 'border-color .15s, box-shadow .15s',
                    fontFamily: 'var(--font-inter, sans-serif)',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#5FE3D0'; e.target.style.boxShadow = '0 0 0 3px rgba(95,227,208,.15)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,.1)'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: '.68rem', fontWeight: 700,
                  color: 'rgba(255,255,255,.45)', marginBottom: '.4rem',
                  textTransform: 'uppercase', letterSpacing: '.08em',
                  fontFamily: 'var(--font-montserrat, sans-serif)',
                }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••"
                    style={{
                      width: '100%', padding: '.75rem 2.75rem .75rem 1rem',
                      background: 'rgba(255,255,255,.06)',
                      border: '1.5px solid rgba(255,255,255,.1)',
                      borderRadius: 10, outline: 'none',
                      color: '#fff', fontSize: '.875rem',
                      transition: 'border-color .15s, box-shadow .15s',
                      fontFamily: 'var(--font-inter, sans-serif)',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#5FE3D0'; e.target.style.boxShadow = '0 0 0 3px rgba(95,227,208,.15)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,.1)'; e.target.style.boxShadow = 'none' }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '.85rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,.35)', padding: 0,
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                marginTop: '.25rem', width: '100%', padding: '.85rem',
                background: loading ? 'rgba(95,227,208,.4)' : '#5FE3D0',
                color: loading ? '#fff' : '#0f172a', fontWeight: 700, fontSize: '.9rem',
                border: '1px solid rgba(95,227,208,.5)',
                borderRadius: 9999, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(95,227,208,.4)',
                fontFamily: 'var(--font-montserrat, sans-serif)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#4A7FDB'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#5FE3D0'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)' }}}
              >
                {loading ? 'Entrando...' : <><span>Entrar na Plataforma</span> <ArrowRight size={16} /></>}
              </button>
            </form>

            {/* Divisor */}
            <div style={{
              margin: '1.5rem 0',
              borderTop: '1px solid rgba(255,255,255,.07)',
              display: 'flex', alignItems: 'center', gap: '.75rem',
            }}>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', fontFamily: 'var(--font-inter, sans-serif)' }}>
                Este acesso é exclusivo para a equipe interna
              </span>
            </div>

            {/* Link formulário dentro do card */}
            <a href="/formulario" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.6rem',
              padding: '.75rem 1rem', borderRadius: 10,
              border: '1px solid rgba(95,227,208,.25)',
              background: 'rgba(95,227,208,.08)',
              color: '#5FE3D0', textDecoration: 'none',
              fontSize: '.82rem', fontWeight: 600,
              transition: 'all .2s',
              fontFamily: 'var(--font-montserrat, sans-serif)',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(95,227,208,.15)'; e.currentTarget.style.borderColor = 'rgba(95,227,208,.5)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(95,227,208,.08)'; e.currentTarget.style.borderColor = 'rgba(95,227,208,.25)' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.55rem', minWidth: 0 }}>
                <ClipboardList size={15} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Pré-cadastro de escola</span>
              </span>
              <ArrowRight size={14} style={{ flexShrink: 0 }} />
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER — Responsivo (mobile e desktop)
          ══════════════════════════════════════════════════════════ */}
      <footer className="desktop-footer" style={{
        background: '#030712',
        borderTop: '1px solid rgba(255,255,255,.06)',
        padding: '3rem 2rem 2rem',
        display: 'none',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '3rem', marginBottom: '2.5rem' }}>

            {/* Coluna 1 — Frase + contatos */}
            <div>
              {/* Frase institucional */}
              <p style={{
                fontFamily: 'var(--font-cormorant, serif)',
                fontSize: '1rem', fontStyle: 'italic',
                color: 'rgba(255,255,255,.5)', lineHeight: 1.6,
                marginBottom: '1.25rem', maxWidth: 320,
              }}>
                "Plataforma inteligente de gestão comercial para educação de qualidade."
              </p>

              {/* Contatos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {[
                  { icon: <Mail size={14} />, label: 'contato@wemake.tec.br', href: 'mailto:contato@wemake.tec.br' },
                  { icon: <Phone size={14} />, label: '(83) 99654-1530', href: 'tel:+5583996541530' },
                  { icon: <MessageCircle size={14} />, label: 'WhatsApp Comercial', href: 'https://wa.me/5583996541530' },
                  { icon: <span style={{fontSize:'14px'}}>📷</span>, label: '@wemakebr', href: 'https://instagram.com/wemakebr' },
                ].map(item => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: '.5rem',
                    color: 'rgba(255,255,255,.45)', fontSize: '.78rem',
                    textDecoration: 'none', transition: 'color .15s',
                    fontFamily: 'var(--font-inter, sans-serif)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#5FE3D0'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}
                  >
                    <span style={{ color: '#5FE3D0', flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Coluna 2 — Módulos da plataforma */}
            <div>
              <div style={{
                fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: '#5FE3D0', marginBottom: '1rem',
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                Módulos da Plataforma
              </div>
              {[
                'Dashboard Comercial',
                'Gestão de Escolas',
                'Registros de Interações',
                'Jornada de Relacionamento',
                'Jornada Contratual',
                'Pipeline Kanban',
                'Tabela Geral',
                'Calculadora Eskolare',
                'Downloads e Relatórios',
              ].map(item => (
                <div key={item} style={{
                  color: 'rgba(255,255,255,.35)', fontSize: '.75rem',
                  padding: '.2rem 0', fontFamily: 'var(--font-inter, sans-serif)',
                }}>{item}</div>
              ))}
            </div>

            {/* Coluna 3 — Links úteis */}
            <div>
              <div style={{
                fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: '#5FE3D0', marginBottom: '1rem',
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                Links Úteis
              </div>
              {[
                { label: 'We Make', href: 'https://wemake.tec.br/' },
                { label: 'Gestão Comercial', href: '/' },
                { label: 'Gestão de Contratos', href: '/' },
                { label: 'Formulário de Pré-Cadastro', href: '/formulario' },
              ].map(item => (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', color: 'rgba(255,255,255,.4)', fontSize: '.78rem',
                  padding: '.25rem 0', textDecoration: 'none', transition: 'color .15s',
                  fontFamily: 'var(--font-inter, sans-serif)',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#5FE3D0'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.4)'}
                >
                  {item.label}
                </a>
              ))}

              {/* Destaque formulário no footer */}
              <div style={{ marginTop: '1.25rem' }}>
                <a href="/formulario" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  background: '#5FE3D0', color: '#0f172a',
                  padding: '.45rem 1rem', borderRadius: 9999,
                  fontSize: '.75rem', fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(95,227,208,.3)',
                  fontFamily: 'var(--font-montserrat, sans-serif)',
                }}>
                  <ClipboardList size={13} />
                  Formulário para Escolas
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,.05)',
            paddingTop: '1.25rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
              <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.2)', fontFamily: 'var(--font-montserrat, sans-serif)', letterSpacing: '.03em' }}>
                © {new Date().getFullYear()} We Make · Gestão Comercial para Educação
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', paddingTop: '.25rem' }}>
                <svg width="32" height="20" viewBox="0 0 560 100" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
                  <line x1="50" y1="10" x2="10" y2="90" stroke="rgba(255,255,255,.5)" strokeWidth="11" strokeLinecap="round"/>
                  <line x1="50" y1="10" x2="90" y2="90" stroke="rgba(255,255,255,.5)" strokeWidth="11" strokeLinecap="round"/>
                  <line x1="24" y1="58" x2="76" y2="58" stroke="rgba(255,255,255,.5)" strokeWidth="8" strokeLinecap="round"/>
                  <circle cx="50" cy="10" r="7" fill="rgba(255,255,255,.5)"/>
                </svg>
                <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-inter, sans-serif)', fontStyle: 'italic', margin: 0 }}>
                  Criado pela Arkos
                </p>
              </div>
            </div>
            <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.15)', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Plataforma de uso exclusivo da equipe interna
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Footer */}
      <div className="mobile-footer-container">
        <MobileFooter />
      </div>

      {/* Responsivo — mobile */}
      <style>{`
        input::placeholder { color: rgba(255,255,255,.22) !important; }

        /* Desktop styles — header and footer visible */
        @media (min-width: 769px) {
          .desktop-header { display: flex !important; }
          .desktop-footer { display: grid !important; }
          .mobile-nav-container { display: none !important; }
          .mobile-footer-container { display: none !important; }
        }

        /* Mobile styles — mobile nav and footer visible */
        @media (max-width: 768px) {
          .desktop-header { display: none !important; }
          .desktop-footer { display: none !important; }
          .mobile-nav-container { display: block !important; }
          .mobile-footer-container { display: block !important; }
          .mobile-cta-header { display: block !important; }

          .hero-grid {
            grid-template-columns: 1fr !important;
            padding: 80px 1rem 3rem !important;
            gap: 2rem !important;
            margin-top: 0 !important;
          }

          /* Show hero text on mobile with better formatting */
          .hero-grid > div:first-child {
            display: block !important;
            padding-bottom: 1.5rem !important;
            border-bottom: 1px solid rgba(95,227,208,.15) !important;
          }

          .hero-grid > div:first-child h1 {
            font-size: 2rem !important;
            margin-bottom: 1rem !important;
          }

          .hero-grid > div:first-child p {
            font-size: 0.95rem !important;
            line-height: 1.6 !important;
            margin-bottom: 1.25rem !important;
          }

          /* Login card: responsive */
          .hero-grid > div:last-child {
            width: 100% !important;
            max-width: 100% !important;
            padding: 1.5rem !important;
          }

          /* Form inputs responsive */
          input, button {
            width: 100% !important;
            min-height: 48px !important;
            font-size: 1rem !important;
            padding: 12px 16px !important;
          }

          /* Hero section padding adjustments */
          section[style*="flex: 1"] {
            padding-top: 70px !important;
          }

          /* Responsive grid for 2-column layouts */
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }

          /* Badge responsive */
          [style*="inline-flex"][style*="gap"] {
            font-size: 0.6rem !important;
            padding: 0.25rem 0.75rem !important;
          }
        }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 480px) {
          .hero-grid {
            padding: 70px 0.75rem 1rem !important;
          }

          .hero-grid > div:last-child {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  )
}

