'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// We Make brand colors
// Royal Blue: #4c8ade | Mint: #76f3cd | Navy: #0b1f44 | Amber: #ffcc00 | Deep Blue: #2a69ba

export default function AcessoEscolaPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pinRefs = useRef<Array<HTMLInputElement | null>>([])

  // Focus first PIN box on mount (after email)
  useEffect(() => {
    // no auto-focus — let email field be first
  }, [])

  const handlePinChange = (index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[index] = digit
    setPin(next)

    // Auto-advance to next box
    if (digit && index < 5) {
      pinRefs.current[index + 1]?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (pin[index]) {
        const next = [...pin]
        next[index] = ''
        setPin(next)
      } else if (index > 0) {
        pinRefs.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) pinRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) pinRefs.current[index + 1]?.focus()
  }

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setPin(next)
    const lastFilled = Math.min(pasted.length, 5)
    pinRefs.current[lastFilled]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pinStr = pin.join('')
    if (!email.trim()) { setError('Por favor, informe o e-mail da escola.'); return }
    if (pinStr.length < 6) { setError('Digite os 6 dígitos do código PIN.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/propostas/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), pin: pinStr }),
      })

      const json = await res.json()

      if (!res.ok || !json.token) {
        setError(json.error ?? 'E-mail ou código inválidos.')
        setLoading(false)
        return
      }

      router.push(`/proposta/${json.token}`)
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  const pinFilled = pin.every(d => d !== '')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f6ff 0%, #e8f0fb 40%, #f5fbf8 100%)',
      fontFamily: '"Geist", "Inter", system-ui, sans-serif',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Decorative background shapes */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(76,138,222,.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(118,243,205,.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '8%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(76,138,222,.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main card */}
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#ffffff',
        borderRadius: 24,
        boxShadow: '0 8px 48px rgba(11,31,68,.10), 0 2px 12px rgba(76,138,222,.08)',
        border: '1px solid rgba(76,138,222,.12)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Top accent bar */}
        <div style={{
          height: 5,
          background: 'linear-gradient(90deg, #4c8ade 0%, #76f3cd 100%)',
        }} />

        <div style={{ padding: '2.5rem 2.5rem 2rem' }}>

          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <Image
              src="/proposta/logo-color.png"
              alt="We Make"
              width={160}
              height={44}
              style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: 44 }}
              priority
            />
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: '"Fraunces", "Cormorant Garamond", Georgia, serif',
              fontSize: '1.85rem',
              fontWeight: 700,
              color: '#0b1f44',
              lineHeight: 1.2,
              marginBottom: '.6rem',
              letterSpacing: '-.01em',
            }}>
              Acesso à sua Proposta
            </h1>
            <p style={{
              fontSize: '.875rem',
              color: '#5a6a8a',
              lineHeight: 1.6,
              maxWidth: 340,
              margin: '0 auto',
            }}>
              Insira o e-mail e o código fornecidos pela equipe We Make
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fff5f5',
              border: '1px solid rgba(220,38,38,.25)',
              borderLeft: '4px solid #dc2626',
              borderRadius: 10,
              padding: '.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#b91c1c',
              fontSize: '.83rem',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '.5rem',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

            {/* Email field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '.72rem',
                fontWeight: 700,
                color: '#8898b0',
                marginBottom: '.45rem',
                textTransform: 'uppercase',
                letterSpacing: '.09em',
              }}>
                E-mail da escola
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="escola@exemplo.com.br"
                style={{
                  width: '100%',
                  padding: '.8rem 1rem',
                  border: '1.5px solid #dce4f0',
                  borderRadius: 12,
                  fontSize: '.9rem',
                  color: '#0b1f44',
                  background: '#f8fafd',
                  outline: 'none',
                  transition: 'border-color .15s, box-shadow .15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#4c8ade'
                  e.target.style.boxShadow = '0 0 0 3px rgba(76,138,222,.15)'
                  e.target.style.background = '#fff'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#dce4f0'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = '#f8fafd'
                }}
              />
            </div>

            {/* PIN field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '.72rem',
                fontWeight: 700,
                color: '#8898b0',
                marginBottom: '.45rem',
                textTransform: 'uppercase',
                letterSpacing: '.09em',
              }}>
                Código PIN (6 dígitos)
              </label>

              <div style={{
                display: 'flex',
                gap: '.5rem',
                justifyContent: 'center',
              }}>
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { pinRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(i, e)}
                    onPaste={i === 0 ? handlePinPaste : undefined}
                    autoComplete="off"
                    style={{
                      width: 52,
                      height: 58,
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#0b1f44',
                      border: `1.5px solid ${digit ? '#4c8ade' : '#dce4f0'}`,
                      borderRadius: 12,
                      background: digit ? 'rgba(76,138,222,.06)' : '#f8fafd',
                      outline: 'none',
                      transition: 'border-color .15s, box-shadow .15s, background .15s',
                      cursor: 'text',
                      caretColor: '#4c8ade',
                      fontFamily: '"Geist", monospace',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#4c8ade'
                      e.target.style.boxShadow = '0 0 0 3px rgba(76,138,222,.18)'
                      e.target.style.background = '#fff'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = digit ? '#4c8ade' : '#dce4f0'
                      e.target.style.boxShadow = 'none'
                      e.target.style.background = digit ? 'rgba(76,138,222,.06)' : '#f8fafd'
                    }}
                  />
                ))}
              </div>

              <p style={{
                textAlign: 'center',
                fontSize: '.75rem',
                color: '#a0aec0',
                marginTop: '.55rem',
              }}>
                O PIN foi enviado junto com o link da proposta
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !pinFilled}
              style={{
                marginTop: '.25rem',
                width: '100%',
                padding: '.9rem',
                background: (loading || !email.trim() || !pinFilled)
                  ? '#c8d8f0'
                  : 'linear-gradient(135deg, #4c8ade 0%, #2a69ba 100%)',
                color: (loading || !email.trim() || !pinFilled) ? '#7a9ac8' : '#fff',
                fontWeight: 700,
                fontSize: '.95rem',
                border: 'none',
                borderRadius: 12,
                cursor: (loading || !email.trim() || !pinFilled) ? 'not-allowed' : 'pointer',
                transition: 'all .2s',
                boxShadow: (loading || !email.trim() || !pinFilled)
                  ? 'none'
                  : '0 4px 20px rgba(76,138,222,.45)',
                letterSpacing: '.01em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '.5rem',
              }}
              onMouseEnter={e => {
                if (!loading && email.trim() && pinFilled) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(76,138,222,.55)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = (loading || !email.trim() || !pinFilled)
                  ? 'none'
                  : '0 4px 20px rgba(76,138,222,.45)'
              }}
            >
              {loading ? (
                <>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.35)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Acessar Proposta
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            margin: '1.75rem 0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '.75rem',
          }}>
            <div style={{ flex: 1, height: 1, background: '#eef2f8' }} />
            <span style={{ fontSize: '.75rem', color: '#b0bcd4', whiteSpace: 'nowrap' }}>dúvidas?</span>
            <div style={{ flex: 1, height: 1, background: '#eef2f8' }} />
          </div>

          {/* Contact */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(76,138,222,.06) 0%, rgba(118,243,205,.08) 100%)',
            border: '1px solid rgba(76,138,222,.14)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '.8rem', color: '#5a6a8a', marginBottom: '.4rem', lineHeight: 1.5 }}>
              Entre em contato com a equipe We Make
            </p>
            <a
              href="mailto:contato@wemake.tec.br"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem',
                color: '#4c8ade',
                fontWeight: 700,
                fontSize: '.875rem',
                textDecoration: 'none',
                transition: 'color .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#2a69ba' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#4c8ade' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              contato@wemake.tec.br
            </a>
          </div>

          {/* Footer link to internal system */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link
              href="/login"
              style={{
                fontSize: '.75rem',
                color: '#a0aec0',
                textDecoration: 'none',
                transition: 'color .15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.3rem',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLAnchorElement).style.color = '#4c8ade' }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLAnchorElement).style.color = '#a0aec0' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Acessar o Sistema We Make
            </Link>
          </div>

        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #c0cce0 !important; }
        @media (max-width: 480px) {
          form > div:nth-child(2) > div { gap: .35rem !important; }
          form > div:nth-child(2) > div input {
            width: 44px !important;
            height: 52px !important;
            font-size: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  )
}
